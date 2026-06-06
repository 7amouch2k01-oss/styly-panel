import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure, syncProcedure } from "./_core/trpc";
import {
  getAllUsers,
  getAllDevices,
  getAllOrders,
  getRecentActivity,
  getDashboardMetrics,
  getUserByEmail,
  upsertUser,
  updateUserRole,
  updateUserStatus,
  updateUser,
  createUser,
  createDevice,
  updateDevice,
  deleteDevice,
  updateOrderStatus,
  createOrder,
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  logActivity
} from "./db";
import { hashPassword, verifyPassword } from "./authHelpers";
import { sdk } from "./_core/sdk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import crypto from "node:crypto";

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
    signUp: publicProcedure
      .input(
        z.object({
          name: z.string().min(2, "Name must be at least 2 characters"),
          email: z.string().email("Invalid email format"),
          password: z.string().min(6, "Password must be at least 6 characters"),
          role: z.enum(["admin", "user"]).default("admin"), // default to admin locally to prevent lock-outs
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A user with this email already exists",
          });
        }

        const openId = `local_${crypto.randomUUID()}`;
        const pwdHash = hashPassword(input.password);

        const newUserPayload = {
          openId,
          name: input.name,
          email: input.email.toLowerCase(),
          loginMethod: "local",
          role: input.role,
          passwordHash: pwdHash,
        };

        await upsertUser(newUserPayload);

        const createdUser = await getUserByEmail(input.email);
        if (!createdUser) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user account",
          });
        }

        // Auto-sign-in after registration
        const sessionToken = await sdk.createSessionToken(createdUser.openId, {
          name: createdUser.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        await logActivity(createdUser.id, "User Registered", "user", createdUser.id, `New account created for ${createdUser.name}`);

        return {
          success: true,
          user: createdUser,
        };
      }),
    signIn: publicProcedure
      .input(
        z.object({
          email: z.string().email("Invalid email format"),
          password: z.string().min(1, "Password is required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        const isValid = verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        // Update last signed in timestamp
        await upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });

        await logActivity(user.id, "User Logged In", "user", user.id, `User ${user.name} signed in`);

        return {
          success: true,
          user,
        };
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
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["admin", "user"]),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const pwdHash = hashPassword(input.password);
        const user = await createUser({
          name: input.name,
          email: input.email,
          role: input.role,
          passwordHash: pwdHash,
        });
        await logActivity(ctx.user.id, "User Created", "user", user.id, `Created user account for ${input.name}`);
        return { success: true, message: "User created" };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        role: z.enum(["admin", "user"]).optional(),
        status: z.enum(["active", "inactive", "banned"]).optional(),
        password: z.string().min(6).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const updateData: any = {
          name: input.name,
          email: input.email,
          role: input.role,
          status: input.status,
        };
        if (input.password) {
          updateData.passwordHash = hashPassword(input.password);
        }
        await updateUser(input.id, updateData);
        await logActivity(ctx.user.id, "User Updated", "user", input.id, `Updated details of user #${input.id}`);
        return { success: true, message: "User updated" };
      }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["admin", "user"]) }))
      .mutation(async ({ input, ctx }) => {
        await updateUserRole(input.userId, input.role);
        await logActivity(ctx.user.id, "Updated User Role", "user", input.userId, `Changed role of user #${input.userId} to ${input.role}`);
        return { success: true, message: "User role updated" };
      }),
    updateStatus: adminProcedure
      .input(z.object({ userId: z.number(), status: z.enum(["active", "inactive", "banned"]) }))
      .mutation(async ({ input, ctx }) => {
        await updateUserStatus(input.userId, input.status);
        await logActivity(ctx.user.id, "Updated User Status", "user", input.userId, `Changed status of user #${input.userId} to ${input.status}`);
        return { success: true, message: "User status updated" };
      }),
  }),

  // Products/Devices management
  devices: router({
    list: adminProcedure.query(async () => {
      return await getAllDevices();
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        category: z.string().min(1),
        price: z.number().positive(),
        stock: z.number().nonnegative(),
        brandId: z.number().nullable().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const product = await createDevice(input);
        await logActivity(ctx.user.id, "Product Created", "device", product.id, `Created product "${input.name}"`);
        return { success: true, message: "Product created", id: product.id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        price: z.number().positive().optional(),
        stock: z.number().nonnegative().optional(),
        brandId: z.number().nullable().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateDevice(input.id, input);
        await logActivity(ctx.user.id, "Product Updated", "device", input.id, `Updated details of product #${input.id}`);
        return { success: true, message: "Product updated" };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteDevice(input.id);
        await logActivity(ctx.user.id, "Product Deleted", "device", input.id, `Deleted product #${input.id}`);
        return { success: true, message: "Product deleted" };
      }),
  }),

  // Orders management
  orders: router({
    list: adminProcedure.query(async () => {
      return await getAllOrders();
    }),
    updateStatus: adminProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(["pending", "processing", "shipped", "delivered"]),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateOrderStatus(input.orderId, input.status);
        await logActivity(ctx.user.id, "Order Status Updated", "order", input.orderId, `Updated status of order #${input.orderId} to ${input.status}`);
        return { success: true, message: "Order status updated" };
      }),
  }),

  // Brands management
  brands: router({
    list: adminProcedure.query(async () => {
      return await getAllBrands();
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        country: z.string().min(1),
        category: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const brand = await createBrand(input);
        await logActivity(ctx.user.id, "Brand Created", "brand", brand.id, `Created brand "${input.name}"`);
        return { success: true, message: "Brand created", id: brand.id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        country: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateBrand(input.id, input);
        await logActivity(ctx.user.id, "Brand Updated", "brand", input.id, `Updated details of brand #${input.id}`);
        return { success: true, message: "Brand updated" };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteBrand(input.id);
        await logActivity(ctx.user.id, "Brand Deleted", "brand", input.id, `Deleted brand #${input.id}`);
        return { success: true, message: "Brand deleted" };
      }),
  }),

  // Analytics
  analytics: router({
    salesTrends: adminProcedure.query(async () => {
      return [
        { month: "Jan", sales: 4000 },
        { month: "Feb", sales: 3000 },
        { month: "Mar", sales: 2000 },
        { month: "Apr", sales: 2780 },
        { month: "May", sales: 1890 },
        { month: "Jun", sales: 2390 },
        { month: "Jul", sales: 3490 },
      ];
    }),
    userGrowth: adminProcedure.query(async () => {
      return [
        { month: "Jan", users: 100 },
        { month: "Feb", users: 150 },
        { month: "Mar", users: 220 },
        { month: "Apr", users: 290 },
        { month: "May", users: 410 },
        { month: "Jun", users: 500 },
        { month: "Jul", users: 650 },
      ];
    }),
  }),

  // Mobile App Database Synchronization
  sync: router({
    user: syncProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum(["admin", "user"]).default("user"),
        password: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          await updateUser(existingUser.id, {
            name: input.name,
            email: input.email,
            role: input.role,
          });
          return { success: true, message: "User synced (updated)", id: existingUser.id };
        }
        
        const pwdHash = hashPassword(input.password || "default-secure-pwd-12345");
        const user = await createUser({
          id: input.id,
          name: input.name,
          email: input.email,
          role: input.role,
          passwordHash: pwdHash,
        });
        await logActivity(user.id, "User Registered (Sync)", "user", user.id, `New account synced for ${input.name}`);
        return { success: true, message: "User synced (created)", id: user.id };
      }),

    brand: syncProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        country: z.string(),
        category: z.string(),
      }))
      .mutation(async ({ input }) => {
        const brand = await createBrand(input);
        return { success: true, message: "Brand synced", id: brand.id };
      }),

    product: syncProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        category: z.string(),
        price: z.number(),
        stock: z.number(),
        brandId: z.number().nullable().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const product = await createDevice(input);
        return { success: true, message: "Product synced", id: product.id };
      }),

    order: syncProcedure
      .input(z.object({
        id: z.number(),
        customerId: z.number(),
        customerName: z.string(),
        customerEmail: z.string().email().nullable().optional(),
        status: z.enum(["pending", "processing", "shipped", "delivered"]).default("pending"),
        totalAmount: z.number(),
        itemCount: z.number(),
        notes: z.string().optional(),
        items: z.array(z.object({
          deviceId: z.number(),
          quantity: z.number(),
          priceAtPurchase: z.number(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const order = await createOrder(input);
        return { success: true, message: "Order synced", id: order.id };
      }),
  }),
});

export type AppRouter = typeof appRouter;
