import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { config } from "dotenv";
import pg from "pg";
import { getDb } from "../src/lib/db/client";
import { cancelBooking } from "../src/lib/booking/cancel-booking";
import { createBooking } from "../src/lib/booking/create-booking";
import { getAvailability } from "../src/lib/booking/availability";
import { BookingError } from "../src/lib/booking/errors";

config({ path: ".env.local", quiet: true });
const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run database tests.");

// Isolated fixtures: the application connection cannot fall back to public tables.
const schema = `cancel_test_${process.pid}_${Date.now()}`;
const connection = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
const testUrl = new URL(databaseUrl);
testUrl.searchParams.set("options", `-c search_path=${schema}`);
process.env.DATABASE_URL = testUrl.toString();

const query = { date: "2099-10-23", employeeId: "test-barber", treatmentId: "test-cut" };
const input = {
  ...query, time: "10:00", customerName: "Cancellation Test", customerPhone: "12345678",
  customerEmail: "cancel-test@example.invalid", notes: "Keep this note",
};

before(async () => {
  await connection.connect();
  await connection.query(`CREATE SCHEMA "${schema}"`);
  for (const table of ["categories", "treatments", "employees", "customers", "bookings", "salon_closures"]) {
    await connection.query(`CREATE TABLE "${schema}"."${table}" (LIKE public."${table}" INCLUDING ALL)`);
  }
  await connection.query(`SET search_path TO "${schema}"`);
  await connection.query("INSERT INTO categories (id, name) VALUES ('test-category', 'Test')");
  await connection.query("INSERT INTO treatments (id, category_id, name, duration_minutes, price) VALUES ('test-cut', 'test-category', 'Test cut', 20, '100 kr')");
  await connection.query("INSERT INTO employees (id, name) VALUES ('test-barber', 'Test barber')");
});

beforeEach(async () => {
  await connection.query("TRUNCATE bookings, customers");
});

after(async () => {
  await getDb().$client.end();
  await connection.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await connection.end();
});

test("cancelling one duplicate preserves the other bookings and customer history", async () => {
  const target = await createBooking(input);
  const other = await createBooking({ ...input, time: "10:40" });
  await cancelBooking(target.id);
  const result = await connection.query("SELECT id, status, notes FROM bookings ORDER BY time");
  assert.deepEqual(result.rows, [
    { id: target.id, status: "cancelled", notes: "Keep this note" },
    { id: other.id, status: "confirmed", notes: "Keep this note" },
  ]);
  const customer = await connection.query("SELECT count(*)::int AS count FROM customers");
  assert.equal(customer.rows[0].count, 1);
});

test("cancellation releases the slot for a new booking", async () => {
  const target = await createBooking(input);
  assert.equal((await getAvailability(query)).slots.includes("10:00"), false);
  await cancelBooking(target.id);
  assert.equal((await getAvailability(query)).slots.includes("10:00"), true);
  const replacement = await createBooking(input);
  assert.equal(replacement.status, "confirmed");
  assert.notEqual(replacement.id, target.id);
});

test("pending bookings can be cancelled", async () => {
  const target = await createBooking(input);
  await connection.query("UPDATE bookings SET status = 'pending' WHERE id = $1", [target.id]);
  await cancelBooking(target.id);
  const result = await connection.query("SELECT status FROM bookings WHERE id = $1", [target.id]);
  assert.equal(result.rows[0].status, "cancelled");
});

test("repeated and concurrent cancellation requests are harmless", async () => {
  const target = await createBooking(input);
  const results = await Promise.all([cancelBooking(target.id), cancelBooking(target.id)]);
  assert.deepEqual(results.map((result) => result.alreadyCancelled).sort(), [false, true]);
  assert.equal((await cancelBooking(target.id)).alreadyCancelled, true);
});

test("a stale cancellation cannot overwrite a completed booking", async () => {
  const target = await createBooking(input);
  await connection.query("UPDATE bookings SET status = 'completed' WHERE id = $1", [target.id]);
  await assert.rejects(cancelBooking(target.id), (error: unknown) =>
    error instanceof BookingError && error.code === "BOOKING_NOT_CANCELLABLE");
  const result = await connection.query("SELECT status FROM bookings WHERE id = $1", [target.id]);
  assert.equal(result.rows[0].status, "completed");
});

test("unknown and malformed booking IDs cannot change any booking", async () => {
  const target = await createBooking(input);
  await assert.rejects(cancelBooking("bk_missing"), (error: unknown) =>
    error instanceof BookingError && error.code === "BOOKING_NOT_FOUND");
  for (const id of [null, "", " ", "x".repeat(101), "../admin", new FormData()]) {
    await assert.rejects(cancelBooking(id), (error: unknown) =>
      error instanceof BookingError && error.code === "INVALID_BOOKING_ID");
  }
  const result = await connection.query("SELECT status FROM bookings WHERE id = $1", [target.id]);
  assert.equal(result.rows[0].status, "confirmed");
});
