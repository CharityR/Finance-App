CREATE TYPE "public"."asset_class" AS ENUM('stock', 'etf', 'mutual_fund', 'bond', 'treasury_bill', 'reit', 'gold', 'other');--> statement-breakpoint
CREATE TABLE "dividend_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"security_id" uuid NOT NULL,
	"ex_date" date NOT NULL,
	"pay_date" date NOT NULL,
	"amount_per_share" numeric(19, 4) NOT NULL,
	"currency" text NOT NULL,
	"is_mock" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"security_id" uuid NOT NULL,
	"quantity" numeric(19, 6) NOT NULL,
	"average_cost_basis" numeric(19, 4) NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"security_id" uuid NOT NULL,
	"price" numeric(19, 4) NOT NULL,
	"currency" text NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"provenance" "provenance" DEFAULT 'current' NOT NULL,
	"is_mock" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "securities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticker" text NOT NULL,
	"name" text NOT NULL,
	"exchange" text NOT NULL,
	"asset_class" "asset_class" NOT NULL,
	"sector" text,
	"country" text NOT NULL,
	"currency" text NOT NULL,
	"is_mock" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dividend_event" ADD CONSTRAINT "dividend_event_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_snapshot" ADD CONSTRAINT "price_snapshot_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dividend_event_security_id_idx" ON "dividend_event" USING btree ("security_id");--> statement-breakpoint
CREATE INDEX "holdings_user_id_idx" ON "holdings" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "holdings_user_security_idx" ON "holdings" USING btree ("user_id","security_id");--> statement-breakpoint
CREATE INDEX "price_snapshot_security_fetched_idx" ON "price_snapshot" USING btree ("security_id","fetched_at");--> statement-breakpoint
CREATE UNIQUE INDEX "securities_ticker_exchange_idx" ON "securities" USING btree ("ticker","exchange");