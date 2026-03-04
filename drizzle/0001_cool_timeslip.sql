ALTER TABLE "promptHub"."users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "promptHub"."users" CASCADE;--> statement-breakpoint
ALTER TABLE "promptHub"."prompt_versions" DROP CONSTRAINT IF EXISTS "prompt_versions_edited_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "promptHub"."prompts" DROP CONSTRAINT IF EXISTS "prompts_author_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "promptHub"."scraps" DROP CONSTRAINT IF EXISTS "scraps_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "promptHub"."prompt_versions" ALTER COLUMN "edited_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "promptHub"."prompts" ALTER COLUMN "author_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "promptHub"."scraps" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "promptHub"."prompt_versions" ADD CONSTRAINT "prompt_versions_edited_by_user_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promptHub"."prompts" ADD CONSTRAINT "prompts_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promptHub"."scraps" ADD CONSTRAINT "scraps_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
