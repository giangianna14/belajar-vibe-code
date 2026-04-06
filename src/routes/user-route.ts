import { Elysia } from "elysia";
import { registerUser } from "../services/user-service";

export const userRoute = new Elysia().post("/api/users", async ({ body }) => {
  const { name, email, password } = body as {
    name: string;
    email: string;
    password: string;
  };

  try {
    const result = await registerUser(name, email, password);
    return { data: result };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
});
