import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id:           integer("id").primaryKey({ autoIncrement: true }),
  openId:       text("openId").notNull().unique(),
  name:         text("name"),
  email:        text("email").unique(),
  loginMethod:  text("loginMethod"),
  role:         text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  status:       text("status", { enum: ["active", "inactive", "banned"] }).default("active").notNull(),
  passwordHash: text("passwordHash"),
  avatarUrl:    text("avatarUrl"),
  bio:          text("bio"),
  createdAt:    text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt:    text("updatedAt").default(sql`(datetime('now'))`).notNull(),
  lastSignedIn: text("lastSignedIn").default(sql`(datetime('now'))`).notNull(),
  isEmailVerified: integer("isEmailVerified", { mode: "boolean" }).default(false).notNull(),
  verificationCode: text("verificationCode"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─────────────────────────────────────────────────────────────
// BRANDS
// ─────────────────────────────────────────────────────────────
export const brands = sqliteTable("brands", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  name:        text("name").notNull().unique(),
  logoUrl:     text("logoUrl"),
  country:     text("country").notNull(),
  category:    text("category").notNull(),
  description: text("description"),
  website:     text("website"),
  isActive:    integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt:   text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt:   text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = typeof brands.$inferInsert;

// ─────────────────────────────────────────────────────────────
// PRODUCTS / DEVICES
// ─────────────────────────────────────────────────────────────
export const devices = sqliteTable("devices", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  name:        text("name").notNull(),
  category:    text("category").notNull(),
  price:       real("price").notNull(),
  stock:       integer("stock").default(0).notNull(),
  description: text("description"),
  imageUrl:    text("imageUrl"),
  brandId:     integer("brandId").references(() => brands.id),
  isActive:    integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt:   text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt:   text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

// ─────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────
export const orders = sqliteTable("orders", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  customerId:      integer("customerId").notNull(),
  customerName:    text("customerName").notNull(),
  customerEmail:   text("customerEmail"),
  phone:           text("phone"),
  shippingAddress: text("shippingAddress"),
  city:            text("city"),
  postCode:        text("postCode"),
  country:         text("country"),
  status:          text("status", { enum: ["pending", "processing", "shipped", "delivered"] }).default("pending").notNull(),
  totalAmount:     real("totalAmount").notNull(),
  itemCount:       integer("itemCount").default(0).notNull(),
  notes:           text("notes"),
  createdAt:       text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt:       text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─────────────────────────────────────────────────────────────
// ORDER ITEMS
// ─────────────────────────────────────────────────────────────
export const orderItems = sqliteTable("orderItems", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  orderId:         integer("orderId").notNull().references(() => orders.id),
  shipmentId:      integer("shipmentId"),
  deviceId:        integer("deviceId").notNull(),
  brandId:         integer("brandId"),
  productName:     text("productName"),
  productImage:    text("productImage"),
  size:            text("size"),
  quantity:        integer("quantity").default(1).notNull(),
  priceAtPurchase: real("priceAtPurchase").notNull(),
  createdAt:       text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─────────────────────────────────────────────────────────────
// ACTIVITY LOGS
// ─────────────────────────────────────────────────────────────
export const activityLogs = sqliteTable("activityLogs", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  userId:      integer("userId").notNull(),
  action:      text("action").notNull(),
  entityType:  text("entityType").notNull(),
  entityId:    integer("entityId"),
  description: text("description"),
  createdAt:   text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// ─────────────────────────────────────────────────────────────
// ANALYTICS SNAPSHOTS
// ─────────────────────────────────────────────────────────────
export const analyticsSnapshots = sqliteTable("analyticsSnapshots", {
  id:             integer("id").primaryKey({ autoIncrement: true }),
  date:           text("date").default(sql`(datetime('now'))`).notNull(),
  totalUsers:     integer("totalUsers").default(0).notNull(),
  activeProducts: integer("activeProducts").default(0).notNull(),
  totalRevenue:   real("totalRevenue").default(0).notNull(),
  totalOrders:    integer("totalOrders").default(0).notNull(),
  newOrders:      integer("newOrders").default(0).notNull(),
  topBrand:       text("topBrand"),
  createdAt:      text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

// ─────────────────────────────────────────────────────────────
// POSTS (consumer social posts)
// ─────────────────────────────────────────────────────────────
export const posts = sqliteTable("posts", {
  id:             integer("id").primaryKey({ autoIncrement: true }),
  userId:         integer("userId").notNull().references(() => users.id),
  image:          text("image"),
  caption:        text("caption"),
  category:       text("category"),
  likes:          integer("likes").default(0).notNull(),
  comments:       integer("comments").default(0).notNull(),
  status:         text("status", { enum: ["active", "hidden", "flagged"] }).default("active").notNull(),
  approvalStatus: text("approvalStatus", { enum: ["pending", "green", "red", "grey"] }).default("pending").notNull(),
  taggedProduct:  text("taggedProduct"),  // JSON string
  creatorJson:    text("creatorJson"),    // JSON string
  hotspots:       text("hotspots"),       // JSON string: array of hotspots [{x, y, brandId, productId}]
  createdAt:      text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt:      text("updatedAt").default(sql`(datetime('now'))`).notNull(),
  mediaType:      text("mediaType", { enum: ["image", "video"] }).default("image").notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// ─────────────────────────────────────────────────────────────
// BAG ITEMS
// ─────────────────────────────────────────────────────────────
export const bagItems = sqliteTable("bagItems", {
  id:        integer("id").primaryKey({ autoIncrement: true }),
  userId:    integer("userId").notNull().references(() => users.id),
  productId: integer("productId").notNull(),
  name:      text("name").notNull(),
  price:     real("price").notNull(),
  image:     text("image"),
  size:      text("size"),
  qty:       integer("qty").default(1).notNull(),
  addedAt:   text("addedAt").default(sql`(datetime('now'))`).notNull(),
});

export type BagItem = typeof bagItems.$inferSelect;
export type InsertBagItem = typeof bagItems.$inferInsert;

// ─────────────────────────────────────────────────────────────
// MANNEQUIN PROFILES
// ─────────────────────────────────────────────────────────────
export const mannequinProfiles = sqliteTable("mannequinProfiles", {
  id:        integer("id").primaryKey({ autoIncrement: true }),
  userId:    integer("userId").notNull().references(() => users.id),
  slot:      integer("slot").default(1).notNull(),
  name:      text("name"),
  gender:    text("gender"),
  height:    real("height"),
  weight:    real("weight"),
  bodyShape: text("bodyShape"),
  bust:      real("bust"),
  waist:     real("waist"),
  hips:      real("hips"),
  imageUrl:  text("imageUrl"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type MannequinProfile = typeof mannequinProfiles.$inferSelect;
export type InsertMannequinProfile = typeof mannequinProfiles.$inferInsert;

// ─────────────────────────────────────────────────────────────
// BRAND STORES
// ─────────────────────────────────────────────────────────────
export const brandStores = sqliteTable("brandStores", {
  id:        integer("id").primaryKey({ autoIncrement: true }),
  userId:    integer("userId").notNull().references(() => users.id),
  brandId:   integer("brandId").references(() => brands.id),
  brandName: text("brandName").notNull(),
  ownerName: text("ownerName").notNull(),
  email:     text("email").notNull(),
  phone:     text("phone"),
  idFile:    text("idFile"),
  status:    text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type BrandStore = typeof brandStores.$inferSelect;
export type InsertBrandStore = typeof brandStores.$inferInsert;

// ─────────────────────────────────────────────────────────────
// USER GRADES (SP — style points)
// ─────────────────────────────────────────────────────────────
export const userGrades = sqliteTable("userGrades", {
  id:             integer("id").primaryKey({ autoIncrement: true }),
  userId:         integer("userId").notNull().unique().references(() => users.id),
  stylePoints:    integer("stylePoints").default(0).notNull(),
  grade:          integer("grade").default(1).notNull(),
  gradeTitle:     text("gradeTitle").default("Newcomer").notNull(),
  commissionRate: real("commissionRate").default(0.02).notNull(),
  totalEarned:    real("totalEarned").default(0).notNull(),
  totalPaid:      real("totalPaid").default(0).notNull(),
  updatedAt:      text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type UserGrade = typeof userGrades.$inferSelect;
export type InsertUserGrade = typeof userGrades.$inferInsert;

// ─────────────────────────────────────────────────────────────
// BRAND LEVELS (XP system)
// ─────────────────────────────────────────────────────────────
export const brandLevels = sqliteTable("brandLevels", {
  id:         integer("id").primaryKey({ autoIncrement: true }),
  brandId:    integer("brandId").notNull().unique().references(() => brands.id),
  xp:         integer("xp").default(0).notNull(),
  level:      integer("level").default(1).notNull(),
  levelTitle: text("levelTitle").default("Starter").notNull(),
  updatedAt:  text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type BrandLevel = typeof brandLevels.$inferSelect;
export type InsertBrandLevel = typeof brandLevels.$inferInsert;

// ─────────────────────────────────────────────────────────────
// COMMISSIONS
// ─────────────────────────────────────────────────────────────
export const commissions = sqliteTable("commissions", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  userId:      integer("userId").notNull().references(() => users.id),
  brandId:     integer("brandId").references(() => brands.id),
  postId:      integer("postId").references(() => posts.id),
  amount:      real("amount").notNull(),
  status:      text("status", { enum: ["pending", "approved", "paid", "rejected"] }).default("pending").notNull(),
  description: text("description"),
  createdAt:   text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt:   text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;

// ─────────────────────────────────────────────────────────────
// SHIPMENTS (per-brand fulfillment units within an order)
// ─────────────────────────────────────────────────────────────
export const shipments = sqliteTable("shipments", {
  id:                    integer("id").primaryKey({ autoIncrement: true }),
  orderId:               integer("orderId").notNull().references(() => orders.id),
  brandId:               integer("brandId").notNull().references(() => brands.id),
  brandName:             text("brandName").notNull(),
  status:                text("status", { enum: ["pending", "preparing", "ready_for_pickup", "shipped", "delivered", "canceled"] }).default("pending").notNull(),
  carrier:               text("carrier"),
  trackingNumber:        text("trackingNumber"),
  estimatedDeliveryDate: text("estimatedDeliveryDate"),
  shippingAddress:       text("shippingAddress").notNull(),
  notes:                 text("notes"),
  createdAt:             text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt:             text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;
