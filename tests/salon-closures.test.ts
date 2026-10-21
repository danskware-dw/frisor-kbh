import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { config } from "dotenv";
import pg from "pg";
import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { getDb } from "../src/lib/db/client";
import { getAvailability, assertSlotAvailable } from "../src/lib/booking/availability";
import { createBooking } from "../src/lib/booking/create-booking";
import { BookingError } from "../src/lib/booking/errors";
import { deleteSalonClosure, listAdminSalonClosures, listSalonClosures, saveSalonClosure, validateSalonClosureInput } from "../src/lib/booking/salon-closures";

config({ path: ".env.local", quiet: true });
const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run database tests.");

// Every fixture lives in a unique schema; customer and booking data are never touched.
const schema = `closure_test_${process.pid}_${Date.now()}`;
const connection = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
const testUrl = new URL(databaseUrl);
testUrl.searchParams.set("options", `-c search_path=${schema},public`);
testUrl.searchParams.set("application_name", schema);
process.env.DATABASE_URL = testUrl.toString();

const date = "2099-10-23"; // Friday, independently checked; all normal slots are bookable.
const query = { date, employeeId: "test-barber", treatmentId: "test-cut" };
const bookingInput = {
  ...query, time: "10:00", customerName: "Closure Test", customerPhone: "12345678",
  customerEmail: "closure-test@example.invalid", notes: "",
};

before(async () => {
  await connection.connect();
  await connection.query(`CREATE SCHEMA "${schema}"`);
  await connection.query(`GRANT USAGE ON SCHEMA "${schema}" TO anon, authenticated`);
  for (const table of ["categories", "treatments", "employees", "customers", "bookings"]) {
    await connection.query(`CREATE TABLE "${schema}"."${table}" (LIKE public."${table}" INCLUDING ALL)`);
  }
  await connection.query(`SET search_path TO "${schema}", public`);
  await connection.query(await readFile("drizzle/0003_salon_closures.sql", "utf8"));
  await connection.query(`INSERT INTO "${schema}".categories (id, name) VALUES ('test-category', 'Test')`);
  await connection.query(`INSERT INTO "${schema}".treatments (id, category_id, name, duration_minutes, price) VALUES ('test-cut', 'test-category', 'Test cut', 20, '100 kr')`);
  await connection.query(`INSERT INTO "${schema}".employees (id, name) VALUES ('test-barber', 'Test barber')`);
});

beforeEach(async () => {
  await connection.query(`TRUNCATE "${schema}".salon_closures, "${schema}".bookings, "${schema}".customers`);
});

after(async () => {
  await getDb().$client.end();
  await connection.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await connection.end();
});

async function closeDate() {
  await connection.query(`INSERT INTO "${schema}".salon_closures (date, message) VALUES ($1, $2)`, [date, "Vi holder ferie."]);
}

const closedError = (error: unknown) => error instanceof BookingError && error.code === "CLOSED_DATE";

test("availability rejects a closed date for the whole shop", async () => {
  await closeDate();
  await assert.rejects(getAvailability(query), closedError);
});

test("slot validation rejects a closure even when normal opening hours allow it", async () => {
  await closeDate();
  await assert.rejects(assertSlotAvailable({ ...query, time: "10:00", durationMinutes: 20 }), closedError);
});

test("a stale booking submission creates neither a booking nor a customer on a closed date", async () => {
  await closeDate();
  await assert.rejects(createBooking(bookingInput), closedError);
  const result = await connection.query(`SELECT (SELECT count(*) FROM "${schema}".bookings)::int AS bookings, (SELECT count(*) FROM "${schema}".customers)::int AS customers`);
  assert.deepEqual(result.rows[0], { bookings: 0, customers: 0 });
});

test("another open date stays bookable and reopening restores the closed date", async () => {
  await closeDate();
  assert.ok((await getAvailability({ ...query, date: "2099-10-24" })).slots.includes("10:00"));
  await deleteSalonClosure(date);
  assert.ok((await getAvailability(query)).slots.includes("10:00"));
  const result = await createBooking(bookingInput);
  assert.equal(result.date, date);
  assert.equal(result.status, "confirmed");
});

test("saving the same closure updates the public message without duplicate dates", async () => {
  await saveSalonClosure({ date, message: "  Ferie  " });
  await saveSalonClosure({ date, message: "Vi åbner igen i morgen." });
  assert.deepEqual(await listSalonClosures(), [{ date, message: "Vi åbner igen i morgen." }]);
});

test("the dashboard lists affected appointments and never cancels them automatically", async () => {
  const booking = await createBooking(bookingInput);
  await saveSalonClosure({ date });
  const closures = await listAdminSalonClosures();
  assert.equal(closures[0].affectedBookings.length, 1);
  assert.equal(closures[0].affectedBookings[0].id, booking.id);
  assert.equal(closures[0].affectedBookings[0].customerName, "Closure Test");
  await deleteSalonClosure(date);
  const result = await connection.query(`SELECT status FROM "${schema}".bookings WHERE id = $1`, [booking.id]);
  assert.equal(result.rows[0].status, "confirmed");
  assert.deepEqual(await listAdminSalonClosures(), []);
});

test("closure input rejects impossible dates, past dates, and overlong messages", () => {
  for (const input of [
    { date: "2099-02-30" }, { date: "2099-13-01" }, { date: "2020-01-01" },
    { date: "tomorrow" }, { date, message: "x".repeat(301) }, { date: null },
  ]) assert.throws(() => validateSalonClosureInput(input), BookingError);
  assert.deepEqual(validateSalonClosureInput({ date, message: "  Ferie  " }), { date, message: "Ferie" });
});

test("Sunday remains closed after an extra closure is removed", async () => {
  await saveSalonClosure({ date: "2099-10-25" });
  await deleteSalonClosure("2099-10-25");
  await assert.rejects(getAvailability({ ...query, date: "2099-10-25" }), closedError);
});

test("a booking waits for the closure transaction and rejects after it commits", async () => {
  await connection.query("BEGIN");
  let submitted: Promise<unknown> | undefined;
  try {
    await connection.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`salon:${date}`]);
    submitted = createBooking(bookingInput).then((value) => value, (error: unknown) => error);
    let waiting = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      // Supavisor replaces application_name, so observe the actual date lock directly.
      const activity = await connection.query("SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND NOT granted AND objid::bigint = (hashtext($1)::bigint & 4294967295)", [`salon:${date}`]);
      if (activity.rowCount) { waiting = true; break; }
      await delay(25);
    }
    assert.equal(waiting, true, "new bookings must share the salon date lock with closures");
    await closeDate();
    await connection.query("COMMIT");
    assert.ok(closedError(await submitted));
    const result = await connection.query(`SELECT count(*)::int AS count FROM "${schema}".bookings`);
    assert.equal(result.rows[0].count, 0);
  } finally {
    await connection.query("ROLLBACK");
    await submitted;
  }
});

test("direct anonymous and signed-in database clients cannot change closures", async () => {
  for (const role of ["anon", "authenticated"]) {
    await connection.query("BEGIN");
    try {
      await connection.query(`SET LOCAL ROLE ${role}`);
      await assert.rejects(
        connection.query(`INSERT INTO "${schema}".salon_closures (date) VALUES ($1)`, [date]),
        (error: unknown) => (error as { code?: string }).code === "42501"
      );
    } finally {
      await connection.query("ROLLBACK");
    }
  }
});
