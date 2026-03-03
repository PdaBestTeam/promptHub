import { de } from "date-fns/locale";
import { z } from "zod";

export const createBlogSchema = z.object({
  title: z.string().min(1, "제목을 입력하시오"),
  content: z.string().min(1, "Content 내용을 입력하시오"),
});

export type CreateBlogSchema = z.infer<typeof createBlogSchema>;

export const createBlogCommentSchema = z.object({
  content: z.string().min(1, "댓글 내용을 입력하시오"),
  parentId: z.number().int().positive().optional().nullable(),
});
export type CreateBlogCommentSchema = z.infer<typeof createBlogCommentSchema>;
