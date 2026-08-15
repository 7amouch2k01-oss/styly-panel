import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendBrandOrderEmail,
  sendOrderDeliveredEmail,
} from "./email";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure, syncProcedure, protectedProcedure } from "./_core/trpc";
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
  logActivity,
  getPosts,
  getFallbackData,
  // Grade & Level
  getUserGrade,
  addStylePoints,
  getGradeLeaderboard,
  getBrandLevel,
  addBrandXP,
  // Commissions
  getUserCommissions,
  getBrandCommissions,
  createCommission,
  updateCommissionStatus,
  // Profile, Password Reset & Notifications
  getUserDeliveryProfile,
  updateDeliveryProfile,
  setPasswordResetToken,
  getUserByResetToken,
  resetUserPassword,
  createNotification,
  getNotificationsByUser,
  getNotificationsByBrand,
  markNotificationsRead,
  getUnreadCountByUser,
  getUnreadCountByBrand,
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
          role: z.enum(["admin", "user"]).default("user"),
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

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const openId = `local_${crypto.randomUUID()}`;
        const pwdHash = hashPassword(input.password);

        const newUserPayload = {
          openId,
          name: input.name,
          email: input.email.toLowerCase(),
          loginMethod: "local",
          role: input.role,
          passwordHash: pwdHash,
          isEmailVerified: false,
          verificationCode: code,
        };

        // Create user first so signup completes even if email hangs
        await upsertUser(newUserPayload);

        // Send verification email — fire-and-forget so signup is never blocked by email API
        sendVerificationEmail(input.email, code).catch((emailErr: any) => {
          console.error("[Auth] Email send failed (non-fatal):", emailErr.message);
          console.log(`[Auth] ⚠️  Verification code for ${input.email}: ${code}`);
        });


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
    verifyEmail: protectedProcedure
      .input(
        z.object({
          code: z.string().length(6, "Code must be exactly 6 digits"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = ctx.user;
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to verify email",
          });
        }

        if (!user.verificationCode) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No verification pending for this user",
          });
        }

        if (user.verificationCode !== input.code) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid verification code",
          });
        }

        await upsertUser({
          openId: user.openId,
          isEmailVerified: true,
          verificationCode: null,
        });

        await logActivity(user.id, "Email Verified", "user", user.id, `User verified email successfully`);

        return {
          success: true,
        };
      }),
    resendVerificationCode: protectedProcedure
      .mutation(async ({ ctx }) => {
        const user = ctx.user;
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in",
          });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await upsertUser({
          openId: user.openId,
          verificationCode: code,
        });

        if (!user.email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User email address is missing",
          });
        }

        sendVerificationEmail(user.email, code).catch((emailErr: any) => {
          console.error("[Auth] Resend verification email failed (non-fatal):", emailErr.message);
          console.log(`[Auth] ⚠️  New verification code for ${user.email}: ${code}`);
        });

        return {
          success: true,
        };
      }),
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email("Invalid email format") }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user) {
          // Return success even if email not found to prevent user enumeration
          return { success: true, message: "If an account with that email exists, a password reset link has been sent." };
        }

        const token = crypto.randomBytes(32).toString("hex");
        await setPasswordResetToken(input.email.toLowerCase(), token);

        // Origin for reset URL
        const origin = ctx.req.headers.origin || "https://responsible-harmony-production-8371.up.railway.app";
        const resetUrl = `${origin}/reset-password?token=${token}`;

        sendPasswordResetEmail(input.email, resetUrl).catch((err: any) => {
          console.error("[Auth] Reset password email failed (non-fatal):", err.message);
          console.log(`[Auth] ⚠️  Reset password link for ${input.email}: ${resetUrl}`);
        });

        return { success: true, message: "Password reset link sent to your email!" };
      }),
    resetPassword: publicProcedure
      .input(
        z.object({
          token: z.string().min(1, "Reset token is required"),
          newPassword: z.string().min(6, "Password must be at least 6 characters"),
        })
      )
      .mutation(async ({ input }) => {
        const newPasswordHash = hashPassword(input.newPassword);
        try {
          const user = await resetUserPassword(input.token, newPasswordHash);
          await logActivity(user.id, "Password Reset", "user", user.id, `User ${user.name} reset their password`);
          return { success: true, message: "Password reset successfully! You can now log in with your new password." };
        } catch (err: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: err.message || "Invalid or expired reset token",
          });
        }
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
    list: publicProcedure.query(async () => {
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
    // Brand owners can create products without needing admin role
    brandCreate: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        category: z.string().min(1),
        price: z.number().positive(),
        stock: z.number().nonnegative().default(1),
        brandId: z.number(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
        // Verify this user owns the brand
        const { getBrandStore } = await import("./db");
        const store = await getBrandStore(userId);
        if (!store || store.brandId !== input.brandId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this brand" });
        }
        const product = await createDevice(input);
        await logActivity(userId, "Brand Product Created", "device", product.id, `Brand owner created product "${input.name}"`);
        return { success: true, message: "Product created", product };
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
    // NOTE: All new purchases should use checkout.placeOrder which creates per-brand shipments.
    // This legacy endpoint is kept for sync/compat but now also creates proper shipments.
    create: publicProcedure
      .input(z.object({
        items: z.array(z.object({
          id: z.number(),
          name: z.string(),
          price: z.number(),
          image: z.string().optional().default(""),
          size: z.string().optional().default(""),
          qty: z.number(),
          brandId: z.number().optional(),
          brandName: z.string().optional(),
        })),
        total: z.number(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id ?? input.userId ?? 1;
        const customerName = ctx.user?.name ?? "Styly User";
        const customerEmail = ctx.user?.email ?? undefined;
        // Route through createFullOrder so each brand gets a proper ShipmentModel entry
        const { createFullOrder } = await import("./db");
        const address = {
          fullName: customerName,
          phone: "",
          address: "",
          city: "",
          postCode: "",
          country: "Tunisia",
        };
        const order = await createFullOrder(userId, customerEmail, address, input.items as any, input.total);
        await logActivity(userId, "Order Placed", "order", order.id,
          `${customerName} placed order with ${input.items.length} item(s) — total ${input.total.toFixed(2)} TND`);
        return { success: true, message: "Order placed", orderId: order.id };
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
    list: publicProcedure.query(async () => {
      return await getAllBrands();
    }),
    storefront: publicProcedure
      .input(z.object({
        brandId: z.number()
      }))
      .query(async ({ input }) => {
        const { getBrandStorefrontData } = await import("./db");
        return await getBrandStorefrontData(input.brandId);
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
        const { linkPendingPostsToBrand } = await import("./db");
        await linkPendingPostsToBrand(brand.name, brand.id);
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

  // Analytics — all from real MongoDB aggregations
  analytics: router({
    salesTrends: adminProcedure.query(async () => {
      const { OrderModel } = await import("./mongodb");
      // Aggregate total order revenue grouped by YYYY-MM
      const agg = await OrderModel.aggregate([
        { $group: {
          _id: { $substr: ["$createdAt", 0, 7] },
          sales: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]);
      return agg.map((r: any) => ({ month: r._id, sales: r.sales, orders: r.orders }));
    }),
    userGrowth: adminProcedure.query(async () => {
      const { UserModel } = await import("./mongodb");
      const agg = await UserModel.aggregate([
        { $group: {
          _id: { $substr: ["$createdAt", 0, 7] },
          users: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]);
      // Compute cumulative user count
      let cumulative = 0;
      return agg.map((r: any) => {
        cumulative += r.users;
        return { month: r._id, users: cumulative, newUsers: r.users };
      });
    }),
    // New: full admin analytics — revenue, orders, users grouped by month
    full: adminProcedure.query(async () => {
      const { OrderModel, UserModel } = await import("./mongodb");
      const [revenueAgg, userAgg] = await Promise.all([
        OrderModel.aggregate([
          { $group: {
            _id: { $substr: ["$createdAt", 0, 7] },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          }},
          { $sort: { _id: 1 } },
          { $limit: 12 },
        ]),
        UserModel.aggregate([
          { $group: {
            _id: { $substr: ["$createdAt", 0, 7] },
            newUsers: { $sum: 1 },
          }},
          { $sort: { _id: 1 } },
          { $limit: 12 },
        ]),
      ]);
      // Merge by month key
      const monthMap: Record<string, any> = {};
      for (const r of revenueAgg as any[]) {
        monthMap[r._id] = { month: r._id, revenue: r.revenue, orders: r.orders, newUsers: 0 };
      }
      for (const r of userAgg as any[]) {
        if (monthMap[r._id]) monthMap[r._id].newUsers = r.newUsers;
        else monthMap[r._id] = { month: r._id, revenue: 0, orders: 0, newUsers: r.newUsers };
      }
      return Object.values(monthMap).sort((a: any, b: any) => a.month.localeCompare(b.month));
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

  // =============================================================================
  // CONSUMER APP PROCEDURES (PHASE 3)
  // =============================================================================

  mannequin: router({
    save: protectedProcedure
      .input(z.object({
        slot: z.number().optional().default(1),
        name: z.string().optional(),
        gender: z.string().optional(),
        height: z.number().optional(),
        weight: z.number().optional(),
        bodyShape: z.string().optional(),
        bust: z.number().optional(),
        waist: z.number().optional(),
        hips: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;
        const { saveMannequinProfile } = await import("./db");
        await saveMannequinProfile(userId, input);
        return { success: true, message: "Mannequin profile saved" };
      }),
    get: publicProcedure
      .input(z.object({ slot: z.number().optional().default(1) }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id || 1;
        const { getMannequinProfile } = await import("./db");
        return await getMannequinProfile(userId, input.slot);
      }),
    getAll: publicProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user?.id || 1;
        const { getAllMannequinProfiles } = await import("./db");
        return await getAllMannequinProfiles(userId);
      }),
  }),

  brandStore: router({
    register: protectedProcedure
      .input(z.object({
        brandName: z.string(),
        ownerName: z.string(),
        email: z.string().email(),
        phone: z.string(),
        idFile: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;
        const { registerBrandStore, getAllBrands, createBrand } = await import("./db");

        // Try to find or create a matching Brand record so brandId is always set
        let brandId: number | undefined;
        const brands = await getAllBrands();
        const existing = brands.find(
          (b: any) => b.name.toLowerCase() === input.brandName.toLowerCase()
        );
        if (existing) {
          brandId = existing.id;
        } else {
          // Auto-create a brand record in inactive (pending approval) state
          const newBrand = await createBrand({
            name: input.brandName,
            country: "Tunisia",
            category: "Fashion",
          });
          brandId = newBrand.id;
          // Set inactive initially
          const { BrandModel } = await import("./mongodb.js");
          await BrandModel.updateOne({ id: brandId }, { isActive: false });
          // Link pre-tagged posts immediately
          const { linkPendingPostsToBrand } = await import("./db");
          await linkPendingPostsToBrand(newBrand.name, newBrand.id);
        }

        await registerBrandStore(userId, { ...input, brandId });
        return { success: true, message: "Brand store registered", brandId };
      }),
    get: publicProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user?.id || 1;
        const { getBrandStore } = await import("./db");
        return await getBrandStore(userId);
      }),
    listPending: adminProcedure
      .query(async () => {
        const { BrandStoreModel } = await import("./mongodb.js");
        const { toPlain } = await import("./db");
        return toPlain(await BrandStoreModel.find({ status: "pending" }).sort({ createdAt: -1 }));
      }),
    approve: adminProcedure
      .input(z.object({
        storeId: z.number(),
        approve: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { updateBrandStoreStatus, updateBrand } = await import("./db");
        const { BrandStoreModel } = await import("./mongodb.js");
        
        const status = input.approve ? "approved" : "rejected";
        await updateBrandStoreStatus(input.storeId, status);
        
        const store = await BrandStoreModel.findOne({ id: input.storeId });
        if (store && store.brandId) {
          // Activate or deactivate the Brand based on approval
          await updateBrand(store.brandId, { isActive: input.approve });
          if (input.approve) {
            const { linkPendingPostsToBrand } = await import("./db");
            await linkPendingPostsToBrand(store.brandName, store.brandId);
          }
        }
        
        await logActivity(
          ctx.user.id,
          input.approve ? "Brand Store Approved" : "Brand Store Rejected",
          "brandStore",
          input.storeId,
          `Admin ${input.approve ? "approved" : "rejected"} brand store request #${input.storeId}`
        );
        
        return { success: true };
      }),
  }),

  posts: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }).optional())
      .query(async ({ input }) => {
        const { getPosts } = await import("./db");
        return await getPosts(input);
      }),
    adminList: adminProcedure
      .query(async () => {
        const posts = await getPosts();
        const users = await getAllUsers();
        return posts.map((p: any) => ({
          ...p,
          author: users.find((u: any) => u.id === p.userId) || null,
        }));
      }),
    updateStatus: adminProcedure
      .input(z.object({
        postId: z.number(),
        status: z.enum(["active", "hidden", "flagged"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const { updatePostStatus } = await import("./db");
        await updatePostStatus(input.postId, input.status);
        await logActivity(ctx.user.id, "Post Status Updated", "post", input.postId, `Updated post #${input.postId} to ${input.status}`);
        return { success: true, message: "Post status updated" };
      }),
    delete: adminProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { deletePost } = await import("./db");
        await deletePost(input.postId);
        await logActivity(ctx.user.id, "Post Deleted", "post", input.postId, `Deleted post #${input.postId}`);
        return { success: true, message: "Post deleted" };
      }),
    // ── posts.create ── Auto-parses @BrandName from caption to resolve brandId
    create: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        caption: z.string(),
        category: z.string(),
        unregisteredBrand: z.string().nullable().optional(),
        taggedProduct: z.object({
          id: z.number(),
          name: z.string(),
          price: z.number(),
          image: z.string(),
          brandId: z.number().nullable().optional()
        }),
        hotspots: z.array(z.object({
          x: z.number(),
          y: z.number(),
          brandId: z.number(),
          productId: z.number()
        })).optional(),
        mediaType: z.enum(["image", "video"]).default("image")
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;
        const { createPost } = await import("./db");
        const { BrandModel } = await import("./mongodb");

        const creator = {
          name:     ctx.user.name || "Style Creator",
          username: `@${(ctx.user.name || "creator").toLowerCase().replace(/\s+/g, "")}`,
          avatar:   "/logo.png",
          isBrand:  false,
          verified: false,
        };

        // ── Auto-detect @BrandName mentions in caption ──
        // Priority: explicit taggedProduct.brandId > @mention in caption
        let resolvedBrandId: number | null = input.taggedProduct?.brandId ?? null;
        let approvalStatus: "pending" | "grey" = "grey";
        let unregisteredBrand: string | null = input.unregisteredBrand ?? null;

        if (!resolvedBrandId) {
          // Extract all @mentions from caption (e.g. "@NikeBrand" or "@Nike Brand")
          const mentionMatches = input.caption.match(/@([a-zA-Z0-9]+)/g);
          if (mentionMatches && mentionMatches.length > 0) {
            // Try to find a brand whose name (lowercased, stripped of spaces) matches any mention
            const allBrands = await BrandModel.find({ isActive: { $ne: false } }).lean();
            let matchedAny = false;
            for (const mention of mentionMatches) {
              const slug = mention.replace("@", "").toLowerCase();
              const matched = allBrands.find((b: any) =>
                b.name.toLowerCase().replace(/\s+/g, "") === slug ||
                b.name.toLowerCase().startsWith(slug)
              );
              if (matched) {
                resolvedBrandId = matched.id;
                approvalStatus = "pending"; // Needs brand owner approval
                unregisteredBrand = null;
                matchedAny = true;
                break;
              }
            }
            if (!matchedAny && !unregisteredBrand) {
              // Not registered yet - tag it as unregisteredBrand
              unregisteredBrand = mentionMatches[0].replace("@", "");
            }
          }
        } else {
          // brandId came explicitly from the client (selected via Add Item flow)
          approvalStatus = "pending";
        }

        await createPost(userId, {
          image:         input.imageUrl,
          caption:       input.caption,
          category:      input.category,
          mediaType:     input.mediaType,
          creator,
          taggedProduct: input.taggedProduct,
          hotspots:      input.hotspots || [],
          brandId:       resolvedBrandId,
          unregisteredBrand,
          approvalStatus,
        });

        return { success: true, message: "Post created successfully" };
      }),

    // ── getBrandTaggedPosts ── Now queries by brandId (fast indexed query)
    getBrandTaggedPosts: publicProcedure
      .input(z.object({
        brandId: z.number()
      }))
      .query(async ({ input }) => {
        const { getPostsByBrand, getAllUsers } = await import("./db");
        const posts = await getPostsByBrand(input.brandId);
        const users = await getAllUsers();

        return posts.map((post: any) => {
          const poster = users.find((u: any) => u.id === post.userId);
          const posterName = poster?.name || post.creator?.name || "Style Creator";
          const likesCount = post.likes || 0;

          return {
            id:               String(post.id),
            posterName,
            posterAvatar:     "/logo.png",
            postImage:        post.image || "/product_dress_1.png",
            likes:            likesCount,
            shares:           Math.floor(likesCount * 0.12),
            comments:         post.comments || 0,
            interactions:     likesCount + (post.comments || 0),
            clicks:           Math.floor(likesCount * 0.45),
            orders:           Math.floor(likesCount * 0.05),
            revenue:          Math.floor(likesCount * 0.05) * (post.taggedProduct?.price || 150),
            commissionEarned: Math.floor(likesCount * 0.05) * (post.taggedProduct?.price || 150) * 0.1,
            taggedProducts:   post.taggedProduct ? [post.taggedProduct.name] : [],
            lockType:         post.approvalStatus || "pending",
            postText:         post.caption || "",
            taggedAt:         post.createdAt || new Date().toISOString(),
          };
        });
      }),
    updateApprovalStatus: publicProcedure
      .input(z.object({
        postId: z.number(),
        approvalStatus: z.enum(["pending", "green", "red", "grey"])
      }))
      .mutation(async ({ input }) => {
        const { updatePostApproval } = await import("./db");
        await updatePostApproval(input.postId, input.approvalStatus);
        return { success: true };
      })
  }),

  bag: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user.id;
        const { getBagItems } = await import("./db");
        return await getBagItems(userId);
      }),
    add: protectedProcedure
      .input(z.object({
        productId: z.number(),
        name: z.string(),
        price: z.number(),
        image: z.string(),
        size: z.string(),
        qty: z.number().default(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;
        const { addToBag } = await import("./db");
        await addToBag(userId, input);
        return { success: true, message: "Added to bag" };
      }),
    remove: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;
        const { removeFromBag } = await import("./db");
        await removeFromBag(userId, input.id);
        return { success: true, message: "Removed from bag" };
      }),
    clear: protectedProcedure
      .mutation(async ({ ctx }) => {
        const userId = ctx.user.id;
        const { clearBag } = await import("./db");
        await clearBag(userId);
        return { success: true, message: "Bag cleared" };
      }),
  }),

  // ─────────────────────────────────────────────────────────────
  // USER GRADE SYSTEM
  // ─────────────────────────────────────────────────────────────
  userGrade: router({
    get: publicProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id || 1;
      return await getUserGrade(userId);
    }),
    addPoints: adminProcedure
      .input(z.object({ userId: z.number(), points: z.number(), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        const result = await addStylePoints(input.userId, input.points, input.reason);
        return { success: true, ...result };
      }),
    leaderboard: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return await getGradeLeaderboard(input.limit);
      }),
  }),

  // ─────────────────────────────────────────────────────────────
  // BRAND LEVEL SYSTEM
  // ─────────────────────────────────────────────────────────────
  brandLevel: router({
    get: publicProcedure
      .input(z.object({ brandId: z.number() }))
      .query(async ({ input }) => {
        return await getBrandLevel(input.brandId);
      }),
    addXP: adminProcedure
      .input(z.object({ brandId: z.number(), xp: z.number(), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        const result = await addBrandXP(input.brandId, input.xp, input.reason);
        return { success: true, ...result };
      }),
  }),

  // ─────────────────────────────────────────────────────────────
  // COMMISSIONS
  // ─────────────────────────────────────────────────────────────
  commissions: router({
    myCommissions: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      return await getUserCommissions(userId);
    }),
    brandCommissions: publicProcedure
      .input(z.object({ brandId: z.number() }))
      .query(async ({ input }) => {
        return await getBrandCommissions(input.brandId);
      }),
    requestPayout: protectedProcedure
      .input(z.object({ brandId: z.number().optional(), postId: z.number().optional(), amount: z.number(), description: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;
        await createCommission({ userId, ...input });
        return { success: true, message: "Payout request submitted" };
      }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["approved", "paid", "rejected"]) }))
      .mutation(async ({ input }) => {
        await updateCommissionStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ─────────────────────────────────────────────────────────────
  // DEV SIMULATION (Admin-restricted)
  // ─────────────────────────────────────────────────────────────
  devSimulation: router({
    simulateOrder: adminProcedure
      .input(z.object({
        brandId: z.number(),
        amount: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;
        const { createOrder, addBrandXP, createCommission } = await import("./db");
        
        await createOrder({
          customerId: userId,
          customerName: ctx.user?.name || "Styly Tester",
          customerEmail: ctx.user?.email || "test@styly.com",
          status: "delivered",
          totalAmount: input.amount,
          itemCount: 1,
          notes: "Dev Simulation Order",
          items: [{ deviceId: 1, quantity: 1, priceAtPurchase: input.amount }]
        });
        
        await addBrandXP(input.brandId, 50, "Dev Simulation order");
        
        await createCommission({
          userId,
          brandId: input.brandId,
          amount: Math.round(input.amount * 0.1 * 100) / 100,
          description: `Dev Simulation sale`
        });
        
        return { success: true, message: "Order and XP simulated!" };
      }),
      
    simulateXP: adminProcedure
      .input(z.object({
        brandId: z.number(),
        xp: z.number()
      }))
      .mutation(async ({ input }) => {
        const { addBrandXP } = await import("./db");
        await addBrandXP(input.brandId, input.xp, "Dev Switcher XP reward");
        return { success: true, message: `Awarded ${input.xp} XP!` };
      })
  }),

  // ─── USER DELIVERY PROFILE ───────────────────────────────────────────────
  userProfile: router({
    getDeliveryProfile: protectedProcedure.query(async ({ ctx }) => {
      return await getUserDeliveryProfile(ctx.user.id);
    }),
    updateDeliveryProfile: protectedProcedure
      .input(
        z.object({
          phone: z.string().min(1, "Phone number is required"),
          deliveryAddress: z.string().min(1, "Address is required"),
          deliveryCity: z.string().min(1, "City is required"),
          deliveryPostCode: z.string().optional(),
          deliveryCountry: z.string().optional().default("Tunisia"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const updated = await updateDeliveryProfile(ctx.user.id, input);
        await logActivity(ctx.user.id, "Delivery Profile Updated", "user", ctx.user.id, `Updated delivery address for ${ctx.user.name}`);
        return { success: true, profile: updated };
      }),
  }),

  // ─── NOTIFICATIONS (Users & Brands) ──────────────────────────────────────
  notifications: router({
    myNotifications: protectedProcedure.query(async ({ ctx }) => {
      const items = await getNotificationsByUser(ctx.user.id);
      const unreadCount = await getUnreadCountByUser(ctx.user.id);
      return { items, unreadCount };
    }),
    brandNotifications: publicProcedure
      .input(z.object({ brandId: z.number() }))
      .query(async ({ input }) => {
        const items = await getNotificationsByBrand(input.brandId);
        const unreadCount = await getUnreadCountByBrand(input.brandId);
        return { items, unreadCount };
      }),
    markRead: publicProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        await markNotificationsRead(input.ids);
        return { success: true };
      }),
  }),

  // ─── CHECKOUT (full order placement with shipments) ───────────────────────
  checkout: router({
    placeOrder: publicProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
              price: z.number(),
              image: z.string().optional(),
              size: z.string().optional(),
              qty: z.number(),
              brandId: z.number().optional(),
              brandName: z.string().optional(),
            })
          ),
          total: z.number(),
          paymentMethod: z.enum(["card", "d17", "flouci", "cod"]).default("cod"),
          address: z.object({
            fullName: z.string(),
            phone: z.string(),
            address: z.string(),
            city: z.string(),
            postCode: z.string(),
            country: z.string(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Require email verification for logged-in users before making purchases
        if (ctx.user && !ctx.user.isEmailVerified) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Email verification required before placing an order. Please verify your email first.",
          });
        }

        const { createFullOrder, getShipmentsByOrder, getBrandById } = await import("./db");
        const userId = ctx.user?.id ?? 1;
        const email = ctx.user?.email ?? undefined;

        // 1. Create order & brand shipments in MongoDB
        const order = await createFullOrder(userId, email, input.address, input.items, input.total);

        // 2. Save delivery profile to user DB if logged in
        if (ctx.user) {
          await updateDeliveryProfile(ctx.user.id, {
            phone: input.address.phone,
            deliveryAddress: input.address.address,
            deliveryCity: input.address.city,
            deliveryPostCode: input.address.postCode,
            deliveryCountry: input.address.country,
          });
        }

        // 3. Notify & Email each Brand that has items in this order
        try {
          const shipments = await getShipmentsByOrder(order.id);
          for (const s of shipments) {
            // Create in-app brand notification
            await createNotification({
              brandId: s.brandId,
              orderId: order.id,
              type: "new_order",
              title: "🛍️ New Order Received!",
              message: `Order #${order.id} from ${input.address.fullName} (${s.brandName}) — ${input.address.city}`,
            });

            // Email brand if brand record has email
            const brandDoc = await getBrandById(s.brandId);
            if (brandDoc && brandDoc.website) {
              const brandItems = input.items.filter(i => i.brandId === s.brandId);
              sendBrandOrderEmail(brandDoc.website, {
                brandName: s.brandName,
                orderId: order.id,
                customerName: input.address.fullName,
                customerPhone: input.address.phone,
                address: `${input.address.address}, ${input.address.city}`,
                items: brandItems,
              }).catch(() => {});
            }
          }
        } catch (err: any) {
          console.error("[Checkout] Non-fatal error creating brand notifications:", err.message);
        }

        // 4. Create in-app customer notification & send confirmation email
        try {
          await createNotification({
            userId,
            orderId: order.id,
            type: "order_placed",
            title: "🎉 Order Placed Successfully!",
            message: `Order #${order.id} total ${input.total.toLocaleString()} TND. We'll update you on delivery status!`,
          });

          if (email) {
            sendOrderConfirmationEmail(email, {
              orderId: order.id,
              customerName: input.address.fullName,
              items: input.items,
              total: input.total,
              paymentMethod: input.paymentMethod,
              address: `${input.address.address}, ${input.address.city}`,
            }).catch(() => {});
          }
        } catch (err: any) {
          console.error("[Checkout] Non-fatal error sending customer email/notification:", err.message);
        }

        await logActivity(userId, "Order Placed", "order", order.id,
          `${input.address.fullName} placed order #${order.id} via ${input.paymentMethod} — ${input.total.toFixed(2)} TND`);

        return { success: true, orderId: order.id };
      }),
  }),

  // ─── DELIVERY (admin + brand + customer) ─────────────────────────────────
  delivery: router({
    /** Admin: see ALL shipments across all brands */
    adminListShipments: adminProcedure.query(async () => {
      const { getAllShipments } = await import("./db");
      return await getAllShipments();
    }),

    /** Admin: list all orders with their shipments */
    adminListOrders: adminProcedure.query(async () => {
      const { getAllOrders, getShipmentsByOrder } = await import("./db");
      const ords = await getAllOrders();
      const result = [];
      for (const ord of ords) {
        const shs = await getShipmentsByOrder(ord.id);
        result.push({ ...ord, shipments: shs });
      }
      return result;
    }),

    /** Brand: see shipments for their brand */
    brandListShipments: publicProcedure
      .input(z.object({ brandId: z.number() }))
      .query(async ({ input }) => {
        const { getShipmentsByBrand } = await import("./db");
        const { OrderItemModel, toPlain } = await import("./mongodb");
        const shs = await getShipmentsByBrand(input.brandId);
        const result = [];
        for (const s of shs) {
          const items = toPlain(await OrderItemModel.find({ shipmentId: s.id }));
          result.push({ ...s, items });
        }
        return result;
      }),

    /** Brand or Admin: update a shipment's fulfillment status / tracking */
    updateShipment: publicProcedure
      .input(
        z.object({
          shipmentId: z.number(),
          status: z.enum(["pending", "preparing", "ready_for_pickup", "shipped", "delivered", "canceled"]),
          carrier: z.string().optional(),
          trackingNumber: z.string().optional(),
          estimatedDeliveryDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { updateShipmentStatus, ShipmentModel, OrderModel, toPlain } = await import("./db");
        
        await updateShipmentStatus(input.shipmentId, {
          status: input.status,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          estimatedDeliveryDate: input.estimatedDeliveryDate,
          notes: input.notes,
        });

        // Trigger lifecycle notifications
        try {
          const shipment = toPlain(await ShipmentModel.findOne({ id: input.shipmentId }));
          if (shipment) {
            const order = toPlain(await OrderModel.findOne({ id: shipment.orderId }));
            
            // Brand confirmed item ready for Styly team pickup
            if (input.status === "ready_for_pickup" || input.status === "preparing") {
              if (order?.customerId) {
                await createNotification({
                  userId: order.customerId,
                  orderId: shipment.orderId,
                  type: "order_confirmed",
                  title: "📦 Brand Confirmed Shipment",
                  message: `${shipment.brandName} has packed your items for order #${shipment.orderId}. Styly team is handling delivery!`,
                });
              }
            }

            // Styly team shipped / delivered
            if (input.status === "shipped") {
              if (order?.customerId) {
                await createNotification({
                  userId: order.customerId,
                  orderId: shipment.orderId,
                  type: "order_shipped",
                  title: "🚚 Order On Its Way!",
                  message: `Your package from ${shipment.brandName} (Order #${shipment.orderId}) is with Styly delivery.`,
                });
              }
            }

            if (input.status === "delivered") {
              if (order?.customerId) {
                await createNotification({
                  userId: order.customerId,
                  orderId: shipment.orderId,
                  type: "order_delivered",
                  title: "🎉 Order Delivered!",
                  message: `Your package from ${shipment.brandName} (Order #${shipment.orderId}) has been delivered!`,
                });

                  sendOrderDeliveredEmail(order.customerEmail, {
                    customerName: order.customerName,
                    orderId: shipment.orderId,
                  }).catch(() => {});
              }
            }
          }
        } catch (err: any) {
          console.error("[Delivery] Non-fatal notification error:", err.message);
        }

        const userId = ctx.user?.id ?? 1;
        await logActivity(
          userId,
          "Shipment Updated",
          "shipment",
          input.shipmentId,
          `Shipment #${input.shipmentId} status → ${input.status}`
        );
        return { success: true, message: "Shipment updated" };
      }),

    /** Customer: get their orders with full shipment tracking */
    myOrders: publicProcedure.query(async ({ ctx }) => {
      const { getOrdersByCustomer } = await import("./db");
      const userId = ctx.user?.id ?? 0;
      if (!userId) return [];
      return await getOrdersByCustomer(userId);
    }),

    /** Customer: track a specific order by ID */
    trackOrder: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const { getShipmentsByOrder } = await import("./db");
        return await getShipmentsByOrder(input.orderId);
      }),

    /** Brand: monthly revenue aggregated from real shipment data */
    brandMonthlyRevenue: publicProcedure
      .input(z.object({ brandId: z.number() }))
      .query(async ({ input }) => {
        const { ShipmentModel, OrderItemModel } = await import("./mongodb");
        // Get all shipments for this brand
        const shipments = await ShipmentModel.find({ brandId: input.brandId }).lean();
        if (!shipments.length) return [];

        const shipmentIds = shipments.map((s: any) => s.id);

        // Aggregate order items by month for this brand's shipments
        const agg = await OrderItemModel.aggregate([
          { $match: { shipmentId: { $in: shipmentIds } } },
          { $group: {
            _id: { $substr: ["$createdAt", 0, 7] },
            revenue: { $sum: { $multiply: ["$priceAtPurchase", "$quantity"] } },
            orders: { $sum: 1 },
          }},
          { $sort: { _id: 1 } },
          { $limit: 12 },
        ]);

        return (agg as any[]).map((r: any) => ({
          month: r._id,
          revenue: Math.round(r.revenue),
          orders: r.orders,
        }));
      }),
  }),

});

export type AppRouter = typeof appRouter;

