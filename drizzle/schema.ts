import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, foreignKey } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Devices/Products table for Styly phone inventory.
 */
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: int("stock").default(0).notNull(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

/**
 * Orders table for tracking customer orders.
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  status: mysqlEnum("status", ["pending", "processing", "shipped", "delivered"]).default("pending").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  itemCount: int("itemCount").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items junction table (many-to-many between orders and devices).
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  deviceId: int("deviceId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  priceAtPurchase: decimal("priceAtPurchase", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Activity logs table for tracking user actions and recent activity feed.
 */
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * Analytics snapshots for historical data tracking.
 */
export const analyticsSnapshots = mysqlTable("analyticsSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  totalUsers: int("totalUsers").default(0).notNull(),
  activeDevices: int("activeDevices").default(0).notNull(),
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0").notNull(),
  totalOrders: int("totalOrders").default(0).notNull(),
  newOrders: int("newOrders").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type InsertAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;