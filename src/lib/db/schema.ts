import { sql } from "drizzle-orm";
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

// ══════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════
export const usersTable = appSchema.table("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: varchar("nickname", { length: 80 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ══════════════════════════════════════════════════════
// CATEGORIES  (4 fixed: 일러스트, 개발, 고민해결, 여행)
// ══════════════════════════════════════════════════════
export const categoriesTable = appSchema.table("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

// ══════════════════════════════════════════════════════
// PROMPTS
// ══════════════════════════════════════════════════════
export const promptsTable = appSchema.table(
  "prompts",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").references(() => categoriesTable.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 300 }).notNull(),
    content: text("content").notNull(),
    description: text("description"),
    isPublic: boolean("is_public").notNull().default(true),
    // Fork relations
    parentPromptId: integer("parent_prompt_id").references(
      (): AnyPgColumn => promptsTable.id,
      { onDelete: "set null" }
    ),
    forkedFromVersionId: integer("forked_from_version_id"),
    // Version tracking
    currentVersionNo: integer("current_version_no").notNull().default(1),
    // Stats (denormalized for perf)
    viewCount: integer("view_count").notNull().default(0),
    scrapCount: integer("scrap_count").notNull().default(0),
    forkCount: integer("fork_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("prompts_author_id_idx").on(table.authorId),
    index("prompts_category_id_idx").on(table.categoryId),
    index("prompts_created_at_idx").on(table.createdAt),
    index("prompts_title_idx").on(table.title),
  ]
);

// ══════════════════════════════════════════════════════
// PROMPT_VERSIONS
// ══════════════════════════════════════════════════════
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
    editedBy: integer("edited_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("prompt_versions_prompt_id_idx").on(table.promptId),
  ]
);

// ══════════════════════════════════════════════════════
// SCRAPS
// ══════════════════════════════════════════════════════
export const scrapsTable = appSchema.table(
  "scraps",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    promptId: integer("prompt_id")
      .notNull()
      .references(() => promptsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.promptId],
      name: "scraps_pk",
    }),
    index("scraps_user_id_idx").on(table.userId),
    index("scraps_prompt_id_idx").on(table.promptId),
  ]
);
