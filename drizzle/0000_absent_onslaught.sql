CREATE TABLE "promptHub"."categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "promptHub"."prompt_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt_id" integer NOT NULL,
	"version_no" integer NOT NULL,
	"title" varchar(300) NOT NULL,
	"content" text NOT NULL,
	"change_note" text,
	"edited_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promptHub"."prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" integer NOT NULL,
	"category_id" integer,
	"title" varchar(300) NOT NULL,
	"content" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"parent_prompt_id" integer,
	"forked_from_version_id" integer,
	"current_version_no" integer DEFAULT 1 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"scrap_count" integer DEFAULT 0 NOT NULL,
	"fork_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promptHub"."scraps" (
	"user_id" integer NOT NULL,
	"prompt_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scraps_pk" PRIMARY KEY("user_id","prompt_id")
);
--> statement-breakpoint
CREATE TABLE "promptHub"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"nickname" varchar(80) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "promptHub"."prompt_versions" ADD CONSTRAINT "prompt_versions_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "promptHub"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promptHub"."prompt_versions" ADD CONSTRAINT "prompt_versions_edited_by_users_id_fk" FOREIGN KEY ("edited_by") REFERENCES "promptHub"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promptHub"."prompts" ADD CONSTRAINT "prompts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "promptHub"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promptHub"."prompts" ADD CONSTRAINT "prompts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "promptHub"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promptHub"."prompts" ADD CONSTRAINT "prompts_parent_prompt_id_prompts_id_fk" FOREIGN KEY ("parent_prompt_id") REFERENCES "promptHub"."prompts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promptHub"."scraps" ADD CONSTRAINT "scraps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "promptHub"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promptHub"."scraps" ADD CONSTRAINT "scraps_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "promptHub"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prompt_versions_prompt_id_idx" ON "promptHub"."prompt_versions" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "prompts_author_id_idx" ON "promptHub"."prompts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "prompts_category_id_idx" ON "promptHub"."prompts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "prompts_created_at_idx" ON "promptHub"."prompts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "prompts_title_idx" ON "promptHub"."prompts" USING btree ("title");--> statement-breakpoint
CREATE INDEX "scraps_user_id_idx" ON "promptHub"."scraps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scraps_prompt_id_idx" ON "promptHub"."scraps" USING btree ("prompt_id");