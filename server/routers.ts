import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sendVerificationEmail } from "./email";
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

        // Send verification email — non-blocking so signup succeeds even if email fails
        try {
          await sendVerificationEmail(input.email, code);
        } catch (emailErr: any) {
          console.error("[Auth] Email send failed (non-fatal):", emailErr.message);
          console.log(`[Auth] ⚠️  Verification code for ${input.email}: ${code}`);
        }

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

        try {
          await sendVerificationEmail(user.email, code);
        } catch (emailErr: any) {
          console.error("[Auth] Resend verification email failed (non-fatal):", emailErr.message);
          console.log(`[Auth] ⚠️  New verification code for ${user.email}: ${code}`);
        }

        return {
          success: true,
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
    create: publicProcedure
      .input(z.object({
        items: z.array(z.object({
          id: z.number(),
          name: z.string(),
          price: z.number(),
          image: z.string(),
          size: z.string(),
          qty: z.number(),
        })),
        total: z.number(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id ?? input.userId ?? 1;
        const customerName = ctx.user?.name ?? "Styly User";
        const customerEmail = ctx.user?.email ?? undefined;

        const order = await createOrder({
          customerId: userId,
          customerName,
          customerEmail,
          status: "pending",
          totalAmount: input.total,
          itemCount: input.items.reduce((acc, i) => acc + i.qty, 0),
          notes: JSON.stringify(input.items.map(i => ({ name: i.name, size: i.size, qty: i.qty, price: i.price }))),
          items: input.items.map(i => ({
            deviceId: i.id,
            quantity: i.qty,
            priceAtPurchase: i.price,
          })),
        });
        await logActivity(userId, "Order Placed", "order", order.id,
          `${customerName} placed order with ${input.items.length} item(s) — total $${input.total.toFixed(2)}`);
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

  // =============================================================================
  // CONSUMER APP PROCEDURES (PHASE 3)
  // =============================================================================

  mannequin: router({
    save: publicProcedure
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
        const userId = ctx.user?.id || 1;
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
    register: publicProcedure
      .input(z.object({
        brandName: z.string(),
        ownerName: z.string(),
        email: z.string().email(),
        phone: z.string(),
        idFile: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id || 1;
        const { registerBrandStore } = await import("./db");
        await registerBrandStore(userId, input);
        return { success: true, message: "Brand store registered" };
      }),
    get: publicProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user?.id || 1;
        const { getBrandStore } = await import("./db");
        return await getBrandStore(userId);
      }),
  }),

  posts: router({
    list: publicProcedure
      .query(async () => {
        const { getPosts } = await import("./db");
        return await getPosts();
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
    create: publicProcedure
      .input(z.object({
        imageUrl: z.string(),
        caption: z.string(),
        category: z.string(),
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
        const userId = ctx.user?.id || 1;
        const { createPost } = await import("./db");
        
        // Find or build user details for creator profile
        const creatorObj = ctx.user 
          ? {
              name: ctx.user.name || "Aria F.",
              username: `@${(ctx.user.name || "ariaf").toLowerCase().replace(/\s+/g, "")}`,
              avatar: "/logo.png",
              isBrand: false,
              verified: false
            }
          : {
              name: "Aria F.",
              username: "@ariaf",
              avatar: "/logo.png",
              isBrand: false,
              verified: false
            };

        await createPost(userId, {
          image: input.imageUrl,
          caption: input.caption,
          category: input.category,
          mediaType: input.mediaType,
          creator: creatorObj,
          taggedProduct: input.taggedProduct,
          hotspots: input.hotspots
        });
        return { success: true, message: "Post created successfully" };
      }),
    getBrandTaggedPosts: publicProcedure
      .input(z.object({
        brandName: z.string()
      }))
      .query(async ({ input }) => {
        const { getPosts, getAllUsers } = await import("./db");
        const posts = await getPosts();
        const users = await getAllUsers();
        
        const normalizedBrand = input.brandName.toLowerCase();
        
        // Filter posts tagging this brand in caption or product name
        const tagged = posts.filter((post: any) => {
          const captionMatch = (post.caption || "").toLowerCase().includes(`@${normalizedBrand}`);
          const wordMatch = (post.caption || "").toLowerCase().includes(normalizedBrand);
          const productMatch = post.taggedProduct && post.taggedProduct.name.toLowerCase().includes(normalizedBrand);
          return captionMatch || wordMatch || productMatch;
        });

        // Map to TaggedPost interface expected by BrandDashboard
        return tagged.map((post: any) => {
          const poster = users.find((u: any) => u.id === post.userId);
          const likesCount = post.likes || 0;
          
          return {
            id: String(post.id),
            posterName: (poster && poster.name) || "Aria Fenix",
            posterAvatar: "/logo.png",
            postImage: post.image || post.imageUrl || "/product_dress_1.png",
            likes: likesCount,
            shares: Math.floor(likesCount * 0.12),
            comments: post.comments || 0,
            interactions: likesCount + (post.comments || 0) + 24,
            clicks: Math.floor(likesCount * 0.45),
            orders: Math.floor(likesCount * 0.05),
            revenue: Math.floor(likesCount * 0.05) * (post.taggedProduct?.price || 150),
            commissionEarned: Math.floor(likesCount * 0.05) * (post.taggedProduct?.price || 150) * 0.1,
            taggedProducts: post.taggedProduct ? [post.taggedProduct.name] : [],
            lockType: post.approvalStatus || "black",
            postText: post.caption,
            taggedAt: post.createdAt || new Date().toISOString()
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
    list: publicProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user?.id || 1;
        const { getBagItems } = await import("./db");
        return await getBagItems(userId);
      }),
    add: publicProcedure
      .input(z.object({
        productId: z.number(),
        name: z.string(),
        price: z.number(),
        image: z.string(),
        size: z.string(),
        qty: z.number().default(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id || 1;
        const { addToBag } = await import("./db");
        await addToBag(userId, input);
        return { success: true, message: "Added to bag" };
      }),
    remove: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id || 1;
        const { removeFromBag } = await import("./db");
        await removeFromBag(userId, input.id);
        return { success: true, message: "Removed from bag" };
      }),
    clear: publicProcedure
      .mutation(async ({ ctx }) => {
        const userId = ctx.user?.id || 1;
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
    myCommissions: publicProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id || 1;
      return await getUserCommissions(userId);
    }),
    brandCommissions: publicProcedure
      .input(z.object({ brandId: z.number() }))
      .query(async ({ input }) => {
        return await getBrandCommissions(input.brandId);
      }),
    requestPayout: publicProcedure
      .input(z.object({ brandId: z.number().optional(), postId: z.number().optional(), amount: z.number(), description: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id || 1;
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
  // DEV SIMULATION
  // ─────────────────────────────────────────────────────────────
  devSimulation: router({
    simulateOrder: publicProcedure
      .input(z.object({
        brandId: z.number(),
        amount: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id || 1;
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
      
    simulateXP: publicProcedure
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

  // ─── CHECKOUT (full order placement with shipments) ───────────────────────
  checkout: router({
    placeOrder: publicProcedure
      .input(z.object({
        items: z.array(z.object({
          id: z.number(),
          name: z.string(),
          price: z.number(),
          image: z.string().optional(),
          size: z.string().optional(),
          qty: z.number(),
          brandId: z.number().optional(),
          brandName: z.string().optional(),
        })),
        total: z.number(),
        address: z.object({
          fullName: z.string(),
          phone: z.string(),
          address: z.string(),
          city: z.string(),
          postCode: z.string(),
          country: z.string(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createFullOrder } = await import("./db");
        const userId = ctx.user?.id ?? 1;
        const email = ctx.user?.email ?? undefined;
        const order = await createFullOrder(userId, email, input.address, input.items, input.total);
        await logActivity(userId, "Order Placed", "order", order.id,
          `${input.address.fullName} placed order #${order.id} — $${input.total.toFixed(2)}`);
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
      .input(z.object({
        shipmentId: z.number(),
        status: z.enum(["pending", "preparing", "ready_for_pickup", "shipped", "delivered", "canceled"]),
        carrier: z.string().optional(),
        trackingNumber: z.string().optional(),
        estimatedDeliveryDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { updateShipmentStatus } = await import("./db");
        await updateShipmentStatus(input.shipmentId, {
          status: input.status,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          estimatedDeliveryDate: input.estimatedDeliveryDate,
          notes: input.notes,
        });
        const userId = ctx.user?.id ?? 1;
        await logActivity(userId, "Shipment Updated", "shipment", input.shipmentId,
          `Shipment #${input.shipmentId} status → ${input.status}`);
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
  }),
});


export type AppRouter = typeof appRouter;

