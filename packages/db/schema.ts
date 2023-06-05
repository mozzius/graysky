import { relations } from "drizzle-orm";
import {
  char,
  index,
  mysqlTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  did: char("did", {
    length: 32,
  }).primaryKey(),
});

export const usersRelation = relations(users, ({ many }) => ({
  bookmarks: many(bookmarks),
}));

export const bookmarks = mysqlTable(
  "bookmarks",
  {
    id: serial("id").primaryKey(),
    userDid: text("user_did"),
    postUri: text("post_uri"),
    createdAt: timestamp("created_at"),
  },
  (table) => ({
    indexes: {
      usersDidIx: index("user_did_ix").on(table.userDid),
    },
  }),
);

export const bookmarksRelation = relations(bookmarks, ({ one }) => ({
  users: one(users, {
    fields: [bookmarks.userDid],
    references: [users.did],
  }),
}));
