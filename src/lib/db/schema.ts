import * as authSchema from "@/lib/db/auth-schema";

import {
  boolean,
  index,
  integer,
  pgSchema,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

const appSchema = pgSchema("promptHub");

export const usersTable = authSchema.user;

export const categoriesTable = appSchema.table("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

export const promptsTable = appSchema.table(
  "prompts",
  {
    id: serial("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => authSchema.user.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").references(() => categoriesTable.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 300 }).notNull(),
    content: text("content").notNull(),
    description: text("description"),
    result: text("result"),
    modelName: varchar("model_name", { length: 200 }),
    isPublic: boolean("is_public").notNull().default(true),

    parentPromptId: integer("parent_prompt_id").references(
      (): AnyPgColumn => promptsTable.id,
      { onDelete: "set null" },
    ),
    forkedFromVersionId: integer("forked_from_version_id"),

    currentVersionNo: integer("current_version_no").notNull().default(1),

    viewCount: integer("view_count").notNull().default(0),
    scrapCount: integer("scrap_count").notNull().default(0),
    forkCount: integer("fork_count").notNull().default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    authorIdIdx: index("prompt_author_id_idx").on(table.authorId),
    categoryIdIdx: index("prompt_category_id_idx").on(table.categoryId),
    parentPromptIdIdx: index("prompt_parent_prompt_id_idx").on(
      table.parentPromptId,
    ),
  }),
);

export const promptVersionsTable = appSchema.table(
  "prompt_versions",
  {
    id: serial("id").primaryKey(),
    promptId: integer("prompt_id")
      .notNull()
      .references(() => promptsTable.id, { onDelete: "cascade" }),
    versionNo: integer("version_no").notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    content: text("content").notNull(),
    changeNote: text("change_note"),
    editedBy: text("edited_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    promptIdIdx: index("prompt_versions_prompt_id_idx").on(table.promptId),
  }),
);

export const promptImagesTable = appSchema.table(
  "prompt_images",
  {
    id: serial("id").primaryKey(),
    promptId: integer("prompt_id")
      .notNull()
      .references(() => promptsTable.id, { onDelete: "cascade" }),
    imageUrl: varchar("image_url", { length: 1000 }).notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    promptIdIdx: index("prompt_image_prompt_id_idx").on(table.promptId),
  })
);

export const scrapsTable = appSchema.table(
  "scraps",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    promptId: integer("prompt_id")
      .notNull()
      .references(() => promptsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.promptId] }),
    userIdIdx: index("scrap_user_id_idx").on(table.userId),
    promptIdIdx: index("scrap_prompt_id_idx").on(table.promptId),
  }),
);
