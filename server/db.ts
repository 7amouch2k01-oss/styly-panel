import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, devices, orders, orderItems, activityLogs, analyticsSnapshots } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// User queries
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

// Device queries
export async function getAllDevices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devices).where(eq(devices.isActive, true));
}

export async function getDeviceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
  return result[0] || null;
}

// Order queries
export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0] || null;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

// Activity log queries
export async function getRecentActivity(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

// Analytics queries
export async function getDashboardMetrics() {
  const db = await getDb();
  if (!db) return null;
  
  const totalUsers = await db.select().from(users);
  const activeOrders = await db.select().from(orders);
  const allDevices = await db.select().from(devices);
  
  const totalRevenue = activeOrders.reduce((sum, order) => {
    return sum + (parseFloat(order.totalAmount.toString()) || 0);
  }, 0);
  
  return {
    totalUsers: totalUsers.length,
    activeDevices: allDevices.filter(d => d.stock > 0).length,
    totalRevenue: totalRevenue.toFixed(2),
    totalOrders: activeOrders.length,
  };
}
