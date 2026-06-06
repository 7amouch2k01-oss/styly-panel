import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, devices, orders, orderItems, activityLogs, brands, User } from "../drizzle/schema";
import { ENV } from './_core/env';
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

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

// =============================================================================
// LOCAL PERSISTENT JSON FALLBACK
// =============================================================================

const FALLBACK_FILE = path.join(import.meta.dirname, "db_fallback.json");

interface FallbackStore {
  users: any[];
  devices: any[];
  orders: any[];
  orderItems: any[];
  activityLogs: any[];
  brands: any[];
}

function initFallbackStore(): FallbackStore {
  if (fs.existsSync(FALLBACK_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(FALLBACK_FILE, "utf-8"));
    } catch (e) {
      console.error("[Database Fallback] Failed to parse file:", e);
    }
  }

  // Seed default data for local testing
  const defaultStore: FallbackStore = {
    users: [
      {
        id: 1,
        openId: "dev-admin-openid",
        name: "Developer (Local Admin)",
        email: "admin@styly.com",
        loginMethod: "local",
        role: "admin",
        passwordHash: "", // local admin fallback
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSignedIn: new Date().toISOString(),
      }
    ],
    devices: [
      { id: 1, name: "Air Max Plus", category: "Shoes", price: "180.00", stock: 12, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 2, name: "Stussy Hoodie", category: "Clothing", price: "120.00", stock: 8, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 3, name: "Oversized Tee", category: "Clothing", price: "45.00", stock: 25, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 4, name: "Suede Cap", category: "Accessories", price: "35.00", stock: 15, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 5, name: "Styly Bomber Jacket", category: "Clothing", price: "210.00", stock: 5, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    orders: [
      { id: 1, customerId: 101, customerName: "John Doe", customerEmail: "john@example.com", status: "delivered", totalAmount: "225.00", itemCount: 2, notes: "Deliver to front desk", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 2, customerId: 102, customerName: "Sarah Connor", customerEmail: "sarah@terminator.com", status: "shipped", totalAmount: "180.00", itemCount: 1, notes: "Fragile", createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, customerId: 103, customerName: "Tony Stark", customerEmail: "tony@stark.com", status: "processing", totalAmount: "1250.00", itemCount: 5, notes: "Express shipping", createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 172800000).toISOString() },
      { id: 4, customerId: 104, customerName: "Bruce Wayne", customerEmail: "bruce@batman.com", status: "pending", totalAmount: "35.00", itemCount: 1, notes: "", createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 259200000).toISOString() },
    ],
    orderItems: [
      { id: 1, orderId: 1, deviceId: 1, quantity: 1, priceAtPurchase: "180.00", createdAt: new Date().toISOString() },
      { id: 2, orderId: 1, deviceId: 3, quantity: 1, priceAtPurchase: "45.00", createdAt: new Date().toISOString() },
      { id: 3, orderId: 2, deviceId: 1, quantity: 1, priceAtPurchase: "180.00", createdAt: new Date().toISOString() },
    ],
    activityLogs: [
      { id: 1, userId: 1, action: "User Logged In", entityType: "user", entityId: 1, description: "Admin logged in to the dashboard", createdAt: new Date().toISOString() },
      { id: 2, userId: 1, action: "Stock Updated", entityType: "device", entityId: 2, description: "Updated stock for Stussy Hoodie", createdAt: new Date(Date.now() - 3600000).toISOString() },
    ],
    brands: [
      { id: 1, name: "Nike", country: "USA", category: "Mixed", productsCount: 45, status: "active" },
      { id: 2, name: "Adidas", country: "Germany", category: "Mixed", productsCount: 38, status: "active" },
      { id: 3, name: "Zara", country: "Spain", category: "Clothing", productsCount: 52, status: "active" },
      { id: 4, name: "H&M", country: "Sweden", category: "Clothing", productsCount: 61, status: "active" },
      { id: 5, name: "Gucci", country: "Italy", category: "Accessories", productsCount: 28, status: "active" },
      { id: 6, name: "Zen", country: "Tunisia", category: "Clothing", productsCount: 15, status: "active" },
      { id: 7, name: "Exist", country: "Tunisia", category: "Mixed", productsCount: 22, status: "active" },
      { id: 8, name: "Carthage", country: "Tunisia", category: "Accessories", productsCount: 18, status: "active" },
    ]
  };

  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(defaultStore, null, 2), "utf-8");
  return defaultStore;
}

export function getFallbackData(): FallbackStore {
  return initFallbackStore();
}

export function saveFallbackData(store: FallbackStore) {
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(store, null, 2), "utf-8");
}

const nextId = (array: any[]) => (array.length > 0 ? Math.max(...array.map(x => x.id)) + 1 : 1);

// =============================================================================
// DATABASE READ/WRITE OPERATIONS
// =============================================================================

export async function upsertUser(user: any): Promise<void> {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    const existingIndex = store.users.findIndex(u => u.openId === user.openId || (user.email && u.email === user.email));
    
    const now = new Date().toISOString();
    if (existingIndex !== -1) {
      store.users[existingIndex] = {
        ...store.users[existingIndex],
        ...user,
        updatedAt: now,
        lastSignedIn: now,
      };
    } else {
      store.users.push({
        id: nextId(store.users),
        role: "user",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
        ...user,
      });
    }
    saveFallbackData(store);
    return;
  }

  try {
    const values: any = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash", "role"] as const;
    textFields.forEach(field => {
      if (user[field] !== undefined) {
        values[field] = user[field];
        updateSet[field] = user[field];
      }
    });

    values.lastSignedIn = user.lastSignedIn || new Date();
    updateSet.lastSignedIn = values.lastSignedIn;

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
    const store = getFallbackData();
    return store.users.find(u => u.openId === openId);
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    return store.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function logActivity(userId: number, action: string, entityType: string, entityId?: number, description?: string) {
  const db = await getDb();
  const now = new Date();
  if (!db) {
    const store = getFallbackData();
    store.activityLogs.push({
      id: nextId(store.activityLogs),
      userId,
      action,
      entityType,
      entityId: entityId || null,
      description: description || null,
      createdAt: now.toISOString(),
    });
    saveFallbackData(store);
    return;
  }

  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      entityType,
      entityId,
      description,
      createdAt: now,
    });
  } catch (e) {
    console.error("[Database] Failed to log activity:", e);
  }
}

// User queries
export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    return getFallbackData().users;
  }
  return db.select().from(users);
}

export async function updateUserRole(userId: number, role: "admin" | "user") {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    const user = store.users.find(u => u.id === userId);
    if (user) user.role = role;
    saveFallbackData(store);
    return;
  }
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserStatus(userId: number, status: "active" | "inactive" | "banned") {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    const user = store.users.find(u => u.id === userId);
    if (user) user.status = status;
    saveFallbackData(store);
    return;
  }
  await db.update(users).set({ status }).where(eq(users.id, userId));
}

export async function updateUser(
  userId: number,
  data: { name?: string; email?: string; role?: "admin" | "user"; status?: "active" | "inactive" | "banned" }
) {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    const user = store.users.find(u => u.id === userId);
    if (user) {
      if (data.name !== undefined) user.name = data.name;
      if (data.email !== undefined) user.email = data.email;
      if (data.role !== undefined) user.role = data.role;
      if (data.status !== undefined) user.status = data.status;
      user.updatedAt = new Date().toISOString();
    }
    saveFallbackData(store);
    return;
  }

  const updateSet: any = { updatedAt: new Date() };
  if (data.name !== undefined) updateSet.name = data.name;
  if (data.email !== undefined) updateSet.email = data.email;
  if (data.role !== undefined) updateSet.role = data.role;
  if (data.status !== undefined) updateSet.status = data.status;

  await db.update(users).set(updateSet).where(eq(users.id, userId));
}

export async function createUser(user: { id?: number; name: string; email: string; role: "admin" | "user"; passwordHash: string }) {
  const db = await getDb();
  const openId = `local_${crypto.randomUUID()}`;
  const now = new Date();

  if (!db) {
    const store = getFallbackData();
    const newUser = {
      id: user.id !== undefined ? user.id : nextId(store.users),
      openId,
      name: user.name,
      email: user.email.toLowerCase(),
      loginMethod: "local",
      role: user.role,
      status: "active",
      passwordHash: user.passwordHash,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      lastSignedIn: now.toISOString(),
    };
    store.users.push(newUser);
    saveFallbackData(store);
    return newUser;
  }

  const values: any = {
    openId,
    name: user.name,
    email: user.email.toLowerCase(),
    loginMethod: "local",
    role: user.role,
    status: "active",
    passwordHash: user.passwordHash,
  };
  if (user.id !== undefined) {
    values.id = user.id;
  }

  const result = await db.insert(users).values(values);
  return { id: user.id !== undefined ? user.id : result[0].insertId };
}

// Device queries
export async function getAllDevices() {
  const db = await getDb();
  if (!db) {
    return getFallbackData().devices.filter(d => d.isActive);
  }
  return db.select().from(devices).where(eq(devices.isActive, true));
}

export async function getDeviceById(id: number) {
  const db = await getDb();
  if (!db) {
    return getFallbackData().devices.find(d => d.id === id) || null;
  }
  const result = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
  return result[0] || null;
}

export async function createDevice(device: { id?: number; name: string; category: string; price: number; stock: number; brandId?: number | null; description?: string }) {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    const newDevice = {
      id: device.id !== undefined ? device.id : nextId(store.devices),
      name: device.name,
      category: device.category,
      price: device.price.toFixed(2),
      stock: device.stock,
      brandId: device.brandId || null,
      description: device.description || "",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.devices.push(newDevice);
    saveFallbackData(store);
    return newDevice;
  }

  const values: any = {
    name: device.name,
    category: device.category,
    price: device.price.toString(),
    stock: device.stock,
    brandId: device.brandId,
    description: device.description,
  };
  if (device.id !== undefined) {
    values.id = device.id;
  }

  const result = await db.insert(devices).values(values);
  return { id: device.id !== undefined ? device.id : result[0].insertId };
}

export async function updateDevice(id: number, device: { name?: string; category?: string; price?: number; stock?: number; brandId?: number | null; description?: string }) {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    const idx = store.devices.findIndex(d => d.id === id);
    if (idx !== -1) {
      store.devices[idx] = {
        ...store.devices[idx],
        ...device,
        price: device.price !== undefined ? device.price.toFixed(2) : store.devices[idx].price,
        updatedAt: new Date().toISOString(),
      };
      saveFallbackData(store);
    }
    return;
  }

  const updateSet: any = { updatedAt: new Date() };
  if (device.name !== undefined) updateSet.name = device.name;
  if (device.category !== undefined) updateSet.category = device.category;
  if (device.price !== undefined) updateSet.price = device.price.toString();
  if (device.stock !== undefined) updateSet.stock = device.stock;
  if (device.brandId !== undefined) updateSet.brandId = device.brandId;
  if (device.description !== undefined) updateSet.description = device.description;

  await db.update(devices).set(updateSet).where(eq(devices.id, id));
}

export async function deleteDevice(id: number) {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    const idx = store.devices.findIndex(d => d.id === id);
    if (idx !== -1) {
      store.devices[idx].isActive = false;
      saveFallbackData(store);
    }
    return;
  }
  await db.update(devices).set({ isActive: false }).where(eq(devices.id, id));
}

// Order queries
export async function getAllOrders() {
  const db = await getDb();
  if (!db) {
    return getFallbackData().orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) {
    return getFallbackData().orders.find(o => o.id === id) || null;
  }
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0] || null;
}

export async function updateOrderStatus(orderId: number, status: "pending" | "processing" | "shipped" | "delivered") {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    const idx = store.orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      store.orders[idx].status = status;
      store.orders[idx].updatedAt = new Date().toISOString();
      saveFallbackData(store);
    }
    return;
  }
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
}

export async function createOrder(order: {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail?: string | null;
  status: "pending" | "processing" | "shipped" | "delivered";
  totalAmount: number | string;
  itemCount: number;
  notes?: string;
  items?: { deviceId: number; quantity: number; priceAtPurchase: number | string }[];
}) {
  const db = await getDb();
  const now = new Date();

  if (!db) {
    const store = getFallbackData();
    const newOrder = {
      id: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail || "",
      status: order.status,
      totalAmount: String(order.totalAmount),
      itemCount: order.itemCount,
      notes: order.notes || "",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    store.orders.push(newOrder);

    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        store.orderItems.push({
          id: store.orderItems.length > 0 ? Math.max(...store.orderItems.map((oi: any) => oi.id)) + 1 : 1,
          orderId: order.id,
          deviceId: item.deviceId,
          quantity: item.quantity,
          priceAtPurchase: String(item.priceAtPurchase),
          createdAt: now.toISOString(),
        });
      });
    }

    saveFallbackData(store);
    return newOrder;
  }

  await db.insert(orders).values({
    id: order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    status: order.status,
    totalAmount: String(order.totalAmount),
    itemCount: order.itemCount,
    notes: order.notes,
  });

  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        deviceId: item.deviceId,
        quantity: item.quantity,
        priceAtPurchase: String(item.priceAtPurchase),
      });
    }
  }

  return { id: order.id };
}

// Brand queries
export async function getAllBrands() {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    return store.brands.map(b => ({
      ...b,
      productsCount: store.devices.filter((d: any) => d.brandId === b.id && d.isActive).length,
    }));
  }

  const allBrands = await db.select().from(brands).where(eq(brands.isActive, true));
  const allDevices = await db.select().from(devices).where(eq(devices.isActive, true));
  
  return allBrands.map(b => ({
    ...b,
    productsCount: allDevices.filter(d => d.brandId === b.id).length,
    status: b.isActive ? "active" : "inactive"
  }));
}

export async function createBrand(brand: { id?: number; name: string; country: string; category: string }) {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    const newBrand = {
      id: brand.id !== undefined ? brand.id : nextId(store.brands),
      name: brand.name,
      country: brand.country,
      category: brand.category,
      productsCount: 0,
      status: "active",
      isActive: true,
    };
    store.brands.push(newBrand);
    saveFallbackData(store);
    return newBrand;
  }

  const values: any = {
    name: brand.name,
    country: brand.country,
    category: brand.category,
    isActive: true,
  };
  if (brand.id !== undefined) {
    values.id = brand.id;
  }

  const result = await db.insert(brands).values(values);
  
  return {
    id: brand.id !== undefined ? brand.id : result[0].insertId,
    name: brand.name,
    country: brand.country,
    category: brand.category,
    productsCount: 0,
    status: "active",
  };
}

export async function updateBrand(id: number, brand: { name?: string; country?: string; category?: string }) {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    const idx = store.brands.findIndex(b => b.id === id);
    if (idx !== -1) {
      store.brands[idx] = {
        ...store.brands[idx],
        ...brand,
      };
      saveFallbackData(store);
    }
    return;
  }

  const updateSet: any = { updatedAt: new Date() };
  if (brand.name !== undefined) updateSet.name = brand.name;
  if (brand.country !== undefined) updateSet.country = brand.country;
  if (brand.category !== undefined) updateSet.category = brand.category;

  await db.update(brands).set(updateSet).where(eq(brands.id, id));
}

export async function deleteBrand(id: number) {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    store.brands = store.brands.filter(b => b.id !== id);
    // Set associated devices to null brand or inactive? Just let them remain, or set brandId to null
    store.devices.forEach((d: any) => {
      if (d.brandId === id) d.brandId = null;
    });
    saveFallbackData(store);
    return;
  }

  await db.update(brands).set({ isActive: false }).where(eq(brands.id, id));
  await db.update(devices).set({ brandId: null }).where(eq(devices.brandId, id));
}

// Activity log queries
export async function getRecentActivity(limit: number = 10) {
  const db = await getDb();
  if (!db) {
    return getFallbackData().activityLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  }
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

// Analytics queries
export async function getDashboardMetrics() {
  const db = await getDb();
  if (!db) {
    const store = getFallbackData();
    const totalUsers = store.users.length;
    const activeDevices = store.devices.filter(d => d.stock > 0).length;
    const totalOrders = store.orders.length;
    const totalRevenue = store.orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);
    
    return {
      totalUsers,
      activeDevices,
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
    };
  }

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
