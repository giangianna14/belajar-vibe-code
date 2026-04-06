import { Elysia } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/user-service";

/**
 * Helper function to extract and validate Bearer token from Authorization header
 * Returns the token string or null if invalid
 */
function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }
  return authorization.slice(7).trim();
}

export const userRoute = new Elysia()
  .post("/api/users", async ({ body }) => {
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
  })
  .post("/api/users/login", async ({ body }) => {
    const { email, password } = body as {
      email: string;
      password: string;
    };

    try {
      const token = await loginUser(email, password);
      return { data: token };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Internal server error",
      };
    }
  })
  .get("/api/users/current", async ({ headers }) => {
    const token = extractBearerToken(headers["authorization"]);

    if (!token) {
      return { error: "Unauthorized" };
    }

    try {
      const user = await getCurrentUser(token);
      return { data: user };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Internal server error",
      };
    }
  })
  .delete("/api/users/logout", async ({ headers }) => {
    const token = extractBearerToken(headers["authorization"]);

    if (!token) {
      return { error: "Unauthorized" };
    }

    try {
      const result = await logoutUser(token);
      return { data: result };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Internal server error",
      };
    }
  });
