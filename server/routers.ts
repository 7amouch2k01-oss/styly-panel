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
