import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Admin Access Control", () => {
  it("should allow admin to access dashboard metrics", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.dashboard.metrics();
      // Result can be null if database is not available, but the call should not throw
      expect(result === null || typeof result === 'object').toBe(true);
    } catch (error: any) {
      console.error("Dashboard metrics error:", error);
      expect.fail(`Admin should be able to access dashboard metrics: ${error?.message}`);
    }
  });

  it("should deny non-admin user access to dashboard metrics", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.dashboard.metrics();
      expect.fail("Non-admin should not be able to access dashboard metrics");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toContain("permission");
    }
  });

  it("should deny unauthenticated user access to dashboard metrics", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.dashboard.metrics();
      expect.fail("Unauthenticated user should not be able to access dashboard metrics");
    } catch (error: any) {
      // adminProcedure checks role first, so unauthenticated users get FORBIDDEN
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should allow admin to access users list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.users.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      expect.fail("Admin should be able to access users list");
    }
  });

  it("should deny non-admin user access to users list", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.users.list();
      expect.fail("Non-admin should not be able to access users list");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should allow admin to access devices list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.devices.list();
      // Result should be an array (empty if database is not available)
      expect(Array.isArray(result)).toBe(true);
    } catch (error: any) {
      console.error("Devices list error:", error);
      expect.fail(`Admin should be able to access devices list: ${error?.message}`);
    }
  });

  it("should allow admin to access orders list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.orders.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      expect.fail("Admin should be able to access orders list");
    }
  });

  it("should allow any authenticated user to access their own profile", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.auth.me();
      expect(result).toBeDefined();
      expect(result?.role).toBe("user");
    } catch (error) {
      expect.fail("Authenticated user should be able to access their profile");
    }
  });

  it("should deny unauthenticated user access to their profile", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});
