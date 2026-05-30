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
      return null;
    }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["admin", "user"]) }))
      .mutation(async ({ input }) => {
        return { success: true, message: "User role updated" };
      }),
    updateStatus: adminProcedure
      .input(z.object({ userId: z.number(), status: z.enum(["active", "inactive", "banned"]) }))
      .mutation(async ({ input }) => {
        return { success: true, message: "User status updated" };
      }),
  }),

  // Products/Devices management
  devices: router({
    list: adminProcedure.query(async () => {
      return await getAllDevices();
    }),
    getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
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
        return { success: true, message: "Product created", id: 1 };
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
        return { success: true, message: "Product updated" };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return { success: true, message: "Product deleted" };
      }),
  }),

  // Orders management
  orders: router({
    list: adminProcedure.query(async () => {
      return await getAllOrders();
    }),
    getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return null;
    }),
    updateStatus: adminProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(["pending", "processing", "shipped", "delivered"]),
      }))
      .mutation(async ({ input }) => {
        return { success: true, message: "Order status updated" };
      }),
  }),

  // Brands management
  brands: router({
    list: adminProcedure.query(async () => {
      return [
        { id: 1, name: "Nike", country: "USA", category: "Mixed", productsCount: 45, status: "active" },
        { id: 2, name: "Adidas", country: "Germany", category: "Mixed", productsCount: 38, status: "active" },
        { id: 3, name: "Zara", country: "Spain", category: "Clothing", productsCount: 52, status: "active" },
        { id: 4, name: "H&M", country: "Sweden", category: "Clothing", productsCount: 61, status: "active" },
        { id: 5, name: "Gucci", country: "Italy", category: "Accessories", productsCount: 28, status: "active" },
        { id: 6, name: "Zen", country: "Tunisia", category: "Clothing", productsCount: 15, status: "active" },
        { id: 7, name: "Exist", country: "Tunisia", category: "Mixed", productsCount: 22, status: "active" },
        { id: 8, name: "Carthage", country: "Tunisia", category: "Accessories", productsCount: 18, status: "active" },
      ];
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        country: z.string().min(1),
        category: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return { success: true, message: "Brand created", id: 1 };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1),
        country: z.string().min(1),
        category: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return { success: true, message: "Brand updated" };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return { success: true, message: "Brand deleted" };
      }),
  }),

  // Analytics
  analytics: router({
    salesTrends: adminProcedure.query(async () => {
      return [];
    }),
    userGrowth: adminProcedure.query(async () => {
      return [];
    }),
  }),
});

export type AppRouter = typeof appRouter;
