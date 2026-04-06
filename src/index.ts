import { Elysia } from "elysia";
import { db } from "./db/config";
import { users } from "./db/schema";

const app = new Elysia()
  .get("/", () => ({
    message: "Hello World! 🚀 Backend API is running",
    status: "ok",
  }))
  .get("/users", async () => {
    try {
      const allUsers = await db.select().from(users);
      return {
        status: "success",
        data: allUsers,
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      return {
        status: "error",
        message: "Failed to fetch users",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })
  .listen(3000, ({ hostname, port }) => {
    console.log(`🦊 Elysia is running at http://${hostname}:${port}`);
  });
