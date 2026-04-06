import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/config";
import { users } from "../db/schema";

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<string> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  if (existing.length > 0) {
    throw new Error("Email sudah terdaftar");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({ name, email, password: hashedPassword });

  return "OK";
}
