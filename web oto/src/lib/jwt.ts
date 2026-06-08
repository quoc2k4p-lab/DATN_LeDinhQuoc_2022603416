import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tq-auto-secret-key-that-is-very-long-and-secure-12345"
);

export interface TokenPayload {
  id: string;
  email: string;
  role: "admin" | "staff" | "customer";
  name: string;
}

/**
 * Sign a user payload into a JWT token (expires in 24 hours)
 */
export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

/**
 * Verify a JWT token and return the payload or null if invalid
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}
