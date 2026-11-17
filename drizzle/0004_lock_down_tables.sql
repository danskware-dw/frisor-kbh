-- Lock down all public tables.
-- The app reads and writes these tables only through the direct Postgres
-- connection (DATABASE_URL), which bypasses RLS. The public Supabase REST API
-- (anon key, shipped to every browser) must not be able to read customers,
-- bookings or admin users.
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gallery_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "treatments" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  "admin_users", "bookings", "categories", "customers",
  "email_logs", "employees", "gallery_images", "treatments"
FROM PUBLIC, anon, authenticated;
