CREATE TABLE "salon_closures" (
	"date" text PRIMARY KEY NOT NULL,
	"message" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "salon_closures" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "salon_closures" FROM PUBLIC, anon, authenticated;
