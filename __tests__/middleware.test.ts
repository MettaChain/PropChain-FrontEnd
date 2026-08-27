import { TextEncoder } from "util";
import {
  signTestToken,
  verifyTestToken,
} from "../tests/helpers/middlewareJwtTestHelper";

// Mock the subset of Next's request/response APIs used by middleware.
jest.mock("next/server", () => {
  class MockNextRequest {
    nextUrl: URL;
    url: string;
    cookies = {
      values: new Map<string, string>(),
      get: (name: string) => {
        const value = this.cookies.values.get(name);
        return value === undefined ? undefined : { value };
      },
      set: (name: string, value: string) => {
        this.cookies.values.set(name, value);
      },
    };

    constructor(url: string) {
      this.url = url;
      this.nextUrl = new URL(url);
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      next: jest.fn(() => ({ type: "next" })),
      redirect: jest.fn((url: URL) => ({
        type: "redirect",
        url,
        cookies: {
          delete: jest.fn(),
        },
      })),
    },
  };
});

jest.mock("jose", () => ({
  jwtVerify: jest.fn((token: string, secret: Uint8Array) =>
    verifyTestToken(token, secret),
  ),
}));

describe("middleware", () => {
  const secretKey = "test-secret-with-at-least-32-characters";
  const legacySecret =
    "default-fallback-secret-for-dev-only-do-not-use-in-prod";
  let originalEnv: NodeJS.ProcessEnv;
  let NextRequest: new (url: string) => {
    nextUrl: URL;
    url: string;
    cookies: {
      set: (name: string, value: string) => void;
      get: (name: string) => { value: string } | undefined;
    };
  };
  let middleware: typeof import("../middleware").middleware;

  beforeAll(async () => {
    (
      globalThis as typeof globalThis & { TextEncoder: typeof TextEncoder }
    ).TextEncoder = TextEncoder;
    ({ NextRequest } = await import("next/server"));
    ({ middleware } = await import("../middleware"));
  });

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, AUTH_SECRET: secretKey };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createRequest = (pathname: string, tokenValue?: string) => {
    const req = new NextRequest(`http://localhost${pathname}`);
    if (tokenValue !== undefined) {
      req.cookies.set("auth-token", tokenValue);
    }
    return req;
  };

  it("allows public routes without token", async () => {
    const req = createRequest("/public");
    const res = await middleware(req);
    expect((res as any).type).toBe("next");
  });

  it("redirects protected routes without token", async () => {
    const req = createRequest("/dashboard");
    const res = await middleware(req);
    expect((res as any).type).toBe("redirect");
    expect((res as any).url.pathname).toBe("/");
  });

  it("allows protected routes with valid token", async () => {
    const token = signTestToken(secretKey, 3600);
    const req = createRequest("/dashboard", token);
    const res = await middleware(req);
    expect((res as any).type).toBe("next");
  });

  it("redirects protected routes with expired token", async () => {
    const token = signTestToken(secretKey, -3600);
    const req = createRequest("/dashboard", token);
    const res = await middleware(req);
    expect((res as any).type).toBe("redirect");
  });

  it("redirects protected routes with tampered token", async () => {
    const token = signTestToken(secretKey, 3600);
    const req = createRequest("/dashboard", `${token}tampered`);
    const res = await middleware(req);
    expect((res as any).type).toBe("redirect");
  });

  it("rejects a token signed with the removed fallback secret", async () => {
    const token = signTestToken(legacySecret, 3600);
    const req = createRequest("/dashboard", token);
    const res = await middleware(req);
    expect((res as any).type).toBe("redirect");
  });

  it("fails closed when AUTH_SECRET is missing", async () => {
    delete process.env.AUTH_SECRET;
    const token = signTestToken(secretKey, 3600);
    const req = createRequest("/dashboard", token);
    const res = await middleware(req);
    expect((res as any).type).toBe("redirect");
  });

  it("fails closed when AUTH_SECRET is empty", async () => {
    process.env.AUTH_SECRET = "   ";
    const token = signTestToken(secretKey, 3600);
    const req = createRequest("/dashboard", token);
    const res = await middleware(req);
    expect((res as any).type).toBe("redirect");
  });
});
