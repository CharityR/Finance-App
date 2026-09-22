CREATE TABLE "news_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"security_id" uuid,
	"sector" text,
	"headline" text NOT NULL,
	"summary" text NOT NULL,
	"source" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"is_mock" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"security_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "news_item" ADD CONSTRAINT "news_item_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "news_item_security_id_idx" ON "news_item" USING btree ("security_id");--> statement-breakpoint
CREATE INDEX "news_item_published_at_idx" ON "news_item" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "watchlist_items_user_id_idx" ON "watchlist_items" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_items_user_security_idx" ON "watchlist_items" USING btree ("user_id","security_id");