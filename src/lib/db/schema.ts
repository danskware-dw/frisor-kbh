import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────────────

export const bookingStatusEnum = pgEnum("booking_status", [
  "confirmed",
  "pending",
  "cancelled",
  "completed",
]);

export const userRoleEnum = pgEnum("user_role", ["admin", "manager"]);

export const emailTypeEnum = pgEnum("email_type", [
  "booking_confirmation",
  "booking_cancelled",
  "booking_rescheduled",
]);

export const emailStatusEnum = pgEnum("email_status", [
  "pending",
  "sent",
  "failed",
]);

// ── Tables ─────────────────────────────────────────────────────────────────────

export const salonClosures = pgTable("salon_closures", {
  date: text("date").primaryKey(),
  message: text("message").notNull().default(""),
}).enableRLS();

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const treatments = pgTable("treatments", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  durationMinutes: integer("duration_minutes").notNull(),
  price: text("price").notNull(),
  image: text("image"),
  imageAlt: text("image_alt").notNull().default(""),
  imageStoragePath: text("image_storage_path"),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const employees = pgTable("employees", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    notes: text("notes").notNull().default(""),
    marketingConsent: boolean("marketing_consent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("customers_email_idx").on(table.email)]
);

export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    treatmentId: text("treatment_id").notNull(),
    treatmentName: text("treatment_name").notNull(),
    priceLabel: text("price_label"),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id),
    employeeName: text("employee_name").notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    date: text("date").notNull(),
    time: text("time").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    status: bookingStatusEnum("status").notNull().default("confirmed"),
    notes: text("notes").notNull().default(""),
    bookingSource: text("booking_source").notNull().default("online"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bookings_employee_date_idx").on(table.employeeId, table.date),
    index("bookings_customer_id_idx").on(table.customerId),
  ]
);

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: text("booking_id"),
  recipient: text("recipient").notNull(),
  type: emailTypeEnum("type").notNull(),
  status: emailStatusEnum("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true, mode: "string" }),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").notNull().unique(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const galleryImages = pgTable(
  "gallery_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    url: text("url").notNull(),
    storagePath: text("storage_path"),
    fileHash: text("file_hash"),
    mediaType: text("media_type").notNull().default("image"),
    altText: text("alt_text").notNull().default(""),
    caption: text("caption").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("gallery_images_file_hash_idx").on(table.fileHash),
    index("gallery_images_sort_order_idx").on(table.sortOrder),
  ]
);
