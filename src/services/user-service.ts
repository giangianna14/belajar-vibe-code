import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/config";
import { users, sessions } from "../db/schema";

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

export async function loginUser(
  email: string,
  password: string
): Promise<string> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (result.length === 0) {
    throw new Error("Email atau password salah");
  }

  const user = result[0];

  if (!user) {
    throw new Error("Email atau password salah");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Email atau password salah");
  }

  const token = crypto.randomUUID();

  await db.insert(sessions).values({ token, userId: user.id });

  return token;
}
