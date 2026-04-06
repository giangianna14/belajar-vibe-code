import { mysqlTable, int, varchar, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  createdAt: datetime()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
