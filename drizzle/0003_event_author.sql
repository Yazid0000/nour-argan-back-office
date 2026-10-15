ALTER TABLE "order_events" ALTER COLUMN "actor" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_events" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "order_events" ADD COLUMN "user_name" text;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "event_has_author" CHECK ("order_events"."actor" is not null or "order_events"."user_name" is not null);