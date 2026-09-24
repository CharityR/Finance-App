ALTER TYPE "public"."notification_type" ADD VALUE 'category_spending_trend';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'unusual_transaction';--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD COLUMN "category_spending_trend" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD COLUMN "unusual_transaction" boolean DEFAULT true NOT NULL;