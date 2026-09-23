import { createHmac } from "crypto";

export const signTestToken = (
  secret: string,
  expiresInSeconds: number,
): string => {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds }),
  ).toString("base64url");
  const signingInput = `${header}.${payload}`;
  const signature = createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64url");
  return `${signingInput}.${signature}`;
};

export const verifyTestToken = (
  token: string,
  secret: Uint8Array,
): Promise<void> => {
  const [header, payload, signature] = token.split(".");
  const expectedSignature = createHmac("sha256", Buffer.from(secret))
    .update(`${header}.${payload}`)
    .digest("base64url");

  if (!header || !payload || !signature || signature !== expectedSignature) {
    return Promise.reject(new Error("Invalid signature"));
  }

  const decodedPayload = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8"),
  ) as {
    exp?: number;
  };
  if (
    typeof decodedPayload.exp !== "number" ||
    decodedPayload.exp < Math.floor(Date.now() / 1000)
  ) {
    return Promise.reject(new Error("Token expired"));
  }

  return Promise.resolve();
};
