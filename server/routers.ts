import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import { getAllUsers, getAllDevices, getAllOrders, getRecentActivity, getDashboardMetrics } from "./db";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Dashboard metrics
  dashboard: router({
    metrics: adminProcedure.query(async () => {
      return await getDashboardMetrics();
    }),
    recentActivity: adminProcedure.query(async () => {
      return await getRecentActivity(5);
    }),
  }),

  // Users management
  users: router({
    list: adminProcedure.query(async () => {
      return await getAllUsers();
    }),
    getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      // Placeholder - would fetch from DB
      return null;
    }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["admin", "user"]) }))
      .mutation(async ({ input }) => {
        // Placeholder - would update DB
        return { success: true, message: "User role updated" };
      }),
    updateStatus: adminProcedure
      .input(z.object({ userId: z.number(), status: z.enum(["active", "inactive", "banned"]) }))
      .mutation(async ({ input }) => {
        // Placeholder - would update DB
        return { success: true, message: "User status updated" };
      }),
  }),

  // Devices management
  devices: router({
    list: adminProcedure.query(async () => {
      return await getAllDevices();
    }),
    getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      // Placeholder - would fetch from DB
      return null;
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        category: z.string().min(1),
        price: z.number().positive(),
        stock: z.number().nonnegative(),
      }))
      .mutation(async ({ input }) => {
        // Placeholder - would create in DB
        return { success: true, message: "Device created", id: 1 };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1),
        category: z.string().min(1),
        price: z.number().positive(),
        stock: z.number().nonnegative(),
      }))
      .mutation(async ({ input }) => {
        // Placeholder - would update DB
        return { success: true, message: "Device updated" };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Placeholder - would delete from DB
        return { success: true, message: "Device deleted" };
      }),
  }),

  // Orders management
  orders: router({
    list: adminProcedure.query(async () => {
      return await getAllOrders();
    }),
    getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      // Placeholder - would fetch from DB
      return null;
    }),
    updateStatus: adminProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(["pending", "processing", "shipped", "delivered"]),
      }))
      .mutation(async ({ input }) => {
        // Placeholder - would update DB
        return { success: true, message: "Order status updated" };
      }),
  }),

  // Analytics
  analytics: router({
    salesTrends: adminProcedure.query(async () => {
      // Placeholder - would aggregate from DB
      return [];
    }),
    userGrowth: adminProcedure.query(async () => {
      // Placeholder - would aggregate from DB
      return [];
    }),
  }),
});

export type AppRouter = typeof appRouter;
