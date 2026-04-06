import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const sessions = mysqlTable("sessions", {
  id: int().primaryKey().autoincrement(),
  token: varchar({ length: 255 }).notNull(),
  userId: int().notNull().references(() => users.id),
  createdAt: timestamp().notNull().defaultNow(),
});
