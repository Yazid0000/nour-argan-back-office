CREATE TYPE "public"."actor" AS ENUM('site', 'salma', 'youssef', 'courier');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('oils', 'hammam', 'face', 'hair', 'gifts');--> statement-breakpoint
CREATE TYPE "public"."country" AS ENUM('MA', 'FR', 'BE');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('MAD', 'EUR');--> statement-breakpoint
CREATE TYPE "public"."history_kind" AS ENUM('received', 'confirmed', 'prepared', 'shipped', 'delivered', 'refused', 'returned', 'cancelled', 'callNoAnswer', 'noteAdded');--> statement-breakpoint
CREATE TYPE "public"."payment" AS ENUM('cod', 'card', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('received', 'confirmed', 'prepared', 'shipped', 'delivered', 'refused', 'returned', 'cancelled');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" "country" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor" "actor" NOT NULL,
	"kind" "history_kind" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text NOT NULL,
	"qty" integer NOT NULL,
	"unit_price" integer NOT NULL,
	CONSTRAINT "order_lines_orderId_variantId_unique" UNIQUE("order_id","variant_id"),
	CONSTRAINT "qty_positive" CHECK ("order_lines"."qty" > 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" integer PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"status" "order_status" DEFAULT 'received' NOT NULL,
	"payment" "payment" NOT NULL,
	"currency" "currency" DEFAULT 'MAD' NOT NULL,
	"shipping_fee" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name_fr" text NOT NULL,
	"name_en" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" "category" NOT NULL,
	"price" integer NOT NULL,
	"compare_at_price" integer,
	"threshold" integer DEFAULT 10 NOT NULL,
	"online" boolean DEFAULT true NOT NULL,
	"swatch" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_positive" CHECK ("products"."price" > 0),
	CONSTRAINT "threshold_non_negative" CHECK ("products"."threshold" >= 0)
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"label" text,
	"price" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"restock_level" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "stock_non_negative" CHECK ("variants"."stock" >= 0),
	CONSTRAINT "variant_price_positive" CHECK ("variants"."price" > 0)
);
--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_events_order_id_index" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_lines_order_id_index" ON "order_lines" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_status_index" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_at_index" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_customer_id_index" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "variants_product_id_index" ON "variants" USING btree ("product_id");