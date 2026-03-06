CREATE TABLE "promptHub"."prompt_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt_id" integer NOT NULL,
	"image_url" varchar(1000) NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "promptHub"."prompts_author_id_idx";--> statement-breakpoint
DROP INDEX "promptHub"."prompts_category_id_idx";--> statement-breakpoint
DROP INDEX "promptHub"."prompts_created_at_idx";--> statement-breakpoint
DROP INDEX "promptHub"."prompts_title_idx";--> statement-breakpoint
DROP INDEX "promptHub"."scraps_user_id_idx";--> statement-breakpoint
DROP INDEX "promptHub"."scraps_prompt_id_idx";--> statement-breakpoint
ALTER TABLE "promptHub"."scraps" DROP CONSTRAINT "scraps_pk";--> statement-breakpoint
ALTER TABLE "promptHub"."scraps" ADD CONSTRAINT "scraps_user_id_prompt_id_pk" PRIMARY KEY("user_id","prompt_id");--> statement-breakpoint
ALTER TABLE "promptHub"."prompt_images" ADD CONSTRAINT "prompt_images_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "promptHub"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prompt_image_prompt_id_idx" ON "promptHub"."prompt_images" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "prompt_author_id_idx" ON "promptHub"."prompts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "prompt_category_id_idx" ON "promptHub"."prompts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "prompt_parent_prompt_id_idx" ON "promptHub"."prompts" USING btree ("parent_prompt_id");--> statement-breakpoint
CREATE INDEX "scrap_user_id_idx" ON "promptHub"."scraps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scrap_prompt_id_idx" ON "promptHub"."scraps" USING btree ("prompt_id");--> statement-breakpoint
ALTER TABLE "promptHub"."prompts" DROP COLUMN "result_image_url";