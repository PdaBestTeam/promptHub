import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgSchema,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

const appSchema = pgSchema("my-next-app");

export const sampleTable = appSchema.table(
  "sample_table",
  {
    // 많이 사용하는 id타입 (1) uuid - defaultRandom: uuidv4
    id: uuid("id").defaultRandom().primaryKey(),
    // 많이 사용하는 id타입 (2) serial (integer-autoIncrement)
    sampleId: serial("sample_id"),
    title: varchar("title", { length: 255 }).notNull(),
    username: varchar("username", { length: 20 }).unique().notNull(),
    content: text("content"),
    age: integer("age"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
    isDeleted: boolean("is_deleted").default(false),
  },
  (table) => [
    // 체크 제약조건
    check("sample_age_check1", sql`${table.age} > 20`),
    index("sample_idx_title").on(table.title),
  ],
);
export const usersTable = appSchema.table("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: varchar("nickname", { length: 80 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const postsTable = appSchema.table("posts", {
  id: serial("id").primaryKey(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const postLikesTable = appSchema.table(
  "post_likes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.postId],
      name: "post_likes_pk",
    }),
    index("post_likes_post_id_index").on(table.postId),
  ],
);

export const postCommentsTable = appSchema.table("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => postsTable.id, {
    onDelete: "set null",
  }),
  parentId: integer("parent_id").references(
    (): AnyPgColumn => postCommentsTable.id,
    { onDelete: "set null" },
  ),
  depth: integer("depth").notNull(),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const blogsTable = appSchema.table("blogs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const blogCommentsTable = appSchema.table("blog_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => postsTable.id, {
    onDelete: "set null",
  }),
  parentId: integer("parent_id").references(
    (): AnyPgColumn => postCommentsTable.id,
    { onDelete: "set null" },
  ),
  depth: integer("depth").notNull(),
  content: varchar("content", { length: 255 }).notNull(),
  blogId: integer("blog_id").references(() => blogsTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
