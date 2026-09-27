CREATE TYPE "public"."liability_category" AS ENUM('mortgage', 'loan', 'credit_card', 'other');--> statement-breakpoint
CREATE TYPE "public"."manual_asset_category" AS ENUM('real_estate', 'other');--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_currency" text NOT NULL,
	"quote_currency" text NOT NULL,
	"rate" numeric(19, 6) NOT NULL,
	"as_of" date NOT NULL,
	"provenance" "provenance" DEFAULT 'estimated' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "liability_category" NOT NULL,
	"name" text NOT NULL,
	"currency" text NOT NULL,
	"balance" numeric(19, 4) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "manual_asset_category" NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"currency" text NOT NULL,
	"value" numeric(19, 4) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "fx_rates_pair_idx" ON "fx_rates" USING btree ("base_currency","quote_currency");--> statement-breakpoint
CREATE INDEX "liabilities_user_id_idx" ON "liabilities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "manual_assets_user_id_idx" ON "manual_assets" USING btree ("user_id");