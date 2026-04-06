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

export async function getCurrentUser(token: string): Promise<{
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}> {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const sessionResult = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  if (sessionResult.length === 0) {
    throw new Error("Unauthorized");
  }

  const session = sessionResult[0]!;

  const userResult = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.userId));

  if (userResult.length === 0) {
    throw new Error("Unauthorized");
  }

  return userResult[0]!;
}

export async function logoutUser(token: string): Promise<string> {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const result = await db.delete(sessions).where(eq(sessions.token, token));

  // MySQL2 returns ResultSetHeader with affectedRows
  if ((result as any).affectedRows === 0) {
    throw new Error("Unauthorized");
  }

  return "OK";
}
