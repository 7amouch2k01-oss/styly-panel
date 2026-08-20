/**
 * server/db.ts
 * ─────────────────────────────────────────────────────────────
 * MongoDB data layer using Mongoose.
 * All exported function signatures remain identical to the previous
 * LibSQL/Drizzle implementation so that routers don't need to change.
 */
import { connectMongo, toPlain, nextId,
  UserModel, BrandModel, DeviceModel, OrderModel, OrderItemModel,
  ShipmentModel, PostModel, BagItemModel, MannequinProfileModel,
  BrandStoreModel, UserGradeModel, BrandLevelModel, CommissionModel,
  WithdrawalModel, ActivityLogModel, NotificationModel, FollowModel
} from "./mongodb.js";

// Re-export Mongoose models and helpers needed by routers
export { ShipmentModel, OrderModel, WithdrawalModel, CommissionModel, toPlain };

// ─────────────────────────────────────────────────────────────
// INIT (called once at server startup)
// ─────────────────────────────────────────────────────────────

let _initialized = false;

export async function initDb(): Promise<void> {
  if (_initialized) return;
  _initialized = true;
  await connectMongo();
  console.log("[DB] MongoDB ready");
}

// noop getDb() — kept for backward compat, MongoDB uses models directly
export function getDb(): any { return null; }

// ─────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────

export async function getAllUsers() {
  return toPlain(await UserModel.find().sort({ createdAt: -1 }));
}

export async function getUserById(id: number) {
  return toPlain(await UserModel.findOne({ id }));
}

export async function getUserByEmail(email: string) {
  return toPlain(await UserModel.findOne({ email }));
}

export async function getUserByOpenId(openId: string) {
  return toPlain(await UserModel.findOne({ openId }));
}

export async function createUser(data: {
  id?: number; openId?: string; name?: string; email?: string; loginMethod?: string;
  role?: "user" | "admin"; passwordHash?: string; avatarUrl?: string;
  isEmailVerified?: boolean; verificationCode?: string | null;
}) {
  const now = new Date().toISOString();
  const id = data.id || await nextId("users");
  const openId = data.openId || `user_${id}_${Date.now()}`;
  const doc = new UserModel({ id, openId, ...data, createdAt: now, updatedAt: now, lastSignedIn: now });
  await doc.save();
  return toPlain(doc);
}

export async function updateUser(id: number, data: Partial<{
  name: string; email: string; avatarUrl: string; bio: string;
  passwordHash: string; role: string; status: string;
  isEmailVerified: boolean; verificationCode: string | null;
  lastSignedIn: string | Date; updatedAt: string | Date; loginMethod: string;
  // Password reset
  resetPasswordToken: string | null; resetPasswordExpiry: string | null;
  // Delivery profile
  phone: string; deliveryAddress: string; deliveryCity: string;
  deliveryPostCode: string; deliveryCountry: string;
}>) {
  const now = new Date().toISOString();
  const updateData: any = { ...data, updatedAt: now };
  if (data.lastSignedIn instanceof Date) updateData.lastSignedIn = data.lastSignedIn.toISOString();
  await UserModel.updateOne({ id }, updateData);
  return toPlain(await UserModel.findOne({ id }));
}

export async function upsertUser(data: {
  openId: string; name?: string | null; email?: string | null;
  loginMethod?: string | null; role?: "user" | "admin"; avatarUrl?: string | null;
  isEmailVerified?: boolean; verificationCode?: string | null;
  lastSignedIn?: Date;
}) {
  const existing = await getUserByOpenId(data.openId);
  const cleanData: any = {};
  if (data.name !== undefined && data.name !== null) cleanData.name = data.name;
  if (data.email !== undefined && data.email !== null) cleanData.email = data.email;
  if (data.loginMethod !== undefined && data.loginMethod !== null) cleanData.loginMethod = data.loginMethod;
  if (data.avatarUrl !== undefined && data.avatarUrl !== null) cleanData.avatarUrl = data.avatarUrl;
  if (data.role) cleanData.role = data.role;
  if (data.isEmailVerified !== undefined) cleanData.isEmailVerified = data.isEmailVerified;
  if (data.verificationCode !== undefined) cleanData.verificationCode = data.verificationCode;
  if (data.lastSignedIn) cleanData.lastSignedIn = data.lastSignedIn.toISOString();

  if (existing) {
    return await updateUser(existing.id, cleanData);
  } else {
    return await createUser({
      openId: data.openId,
      ...cleanData,
    });
  }
}

export async function updateUserStatus(id: number, status: "active" | "inactive" | "banned") {
  await UserModel.updateOne({ id }, { status, updatedAt: new Date().toISOString() });
}

export async function updateUserRole(id: number, role: "user" | "admin") {
  await UserModel.updateOne({ id }, { role, updatedAt: new Date().toISOString() });
}

export async function updateUserPermissions(id: number, permissions: string[]) {
  await UserModel.updateOne({ id }, { permissions, updatedAt: new Date().toISOString() });
}

export async function deleteUser(id: number) {
  await UserModel.deleteOne({ id });
}

// ─────────────────────────────────────────────────────────────
// BRANDS
// ─────────────────────────────────────────────────────────────

export async function getAllBrands() {
  return toPlain(await BrandModel.find().sort({ createdAt: -1 }));
}

export async function getBrandById(id: number) {
  return toPlain(await BrandModel.findOne({ id }));
}

export async function createBrand(data: {
  name: string; country: string; category: string;
  logoUrl?: string; description?: string; website?: string;
}) {
  const now = new Date().toISOString();
  const id = await nextId("brands");
  const doc = new BrandModel({ id, ...data, createdAt: now, updatedAt: now });
  await doc.save();
  // auto-create BrandLevel entry
  const blId = await nextId("brandLevels");
  const bl = new BrandLevelModel({ id: blId, brandId: doc.id, updatedAt: now });
  await bl.save();
  return toPlain(doc);
}

export async function updateBrand(id: number, data: Partial<{
  name: string; country: string; category: string; logoUrl: string;
  description: string; website: string; isActive: boolean;
}>) {
  await BrandModel.updateOne({ id }, { ...data, updatedAt: new Date().toISOString() });
  return toPlain(await BrandModel.findOne({ id }));
}

export async function deleteBrand(id: number) {
  await BrandModel.deleteOne({ id });
}

export async function getBrandStorefrontData(brandId: number) {
  const brand = await BrandModel.findOne({ id: brandId });
  const products = await DeviceModel.find({ brandId, isActive: true });
  const level = await BrandLevelModel.findOne({ brandId });
  const posts = await PostModel.find({ approvalStatus: "green", status: "active" })
    .sort({ createdAt: -1 }).limit(20);
  return {
    brand: toPlain(brand),
    products: toPlain(products),
    level: toPlain(level),
    posts: toPlain(posts),
  };
}

// ─────────────────────────────────────────────────────────────
// DEVICES (Products)
// ─────────────────────────────────────────────────────────────

export async function getAllDevices() {
  return toPlain(await DeviceModel.find().sort({ createdAt: -1 }));
}

export async function getDeviceById(id: number) {
  return toPlain(await DeviceModel.findOne({ id }));
}

export async function createDevice(data: {
  name: string; category: string; price: number; stock?: number;
  description?: string; imageUrl?: string; brandId?: number | null;
}) {
  const now = new Date().toISOString();
  const id = await nextId("devices");
  const doc = new DeviceModel({ id, ...data, brandId: data.brandId ?? undefined, createdAt: now, updatedAt: now });
  await doc.save();
  return toPlain(doc);
}

export async function updateDevice(id: number, data: Partial<{
  name: string; category: string; price: number; stock: number;
  description: string; imageUrl: string; brandId: number | null; isActive: boolean;
}>) {
  const updateData: any = { ...data, updatedAt: new Date().toISOString() };
  if (data.brandId === null) updateData.brandId = undefined;
  await DeviceModel.updateOne({ id }, updateData);
  return toPlain(await DeviceModel.findOne({ id }));
}

export async function deleteDevice(id: number) {
  await DeviceModel.deleteOne({ id });
}

// ─────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────

export async function getAllOrders() {
  return toPlain(await OrderModel.find().sort({ createdAt: -1 }));
}

export async function getOrderById(id: number) {
  return toPlain(await OrderModel.findOne({ id }));
}

export async function createOrder(data: {
  id?: number; customerId: number; customerName: string; customerEmail?: string | null;
  status?: string; totalAmount: number; itemCount?: number; notes?: string;
  items?: { deviceId: number; quantity: number; priceAtPurchase: number }[];
}) {
  const now = new Date().toISOString();
  const id = data.id || await nextId("orders");
  const doc = new OrderModel({ id, ...data, customerEmail: data.customerEmail ?? undefined, createdAt: now, updatedAt: now });
  await doc.save();
  if (data.items) {
    for (const item of data.items) {
      const oiId = await nextId("orderItems");
      const i = new OrderItemModel({ id: oiId, ...item, orderId: doc.id, createdAt: now });
      await i.save();
    }
  }
  return toPlain(doc);
}

export async function updateOrderStatus(id: number, status: string) {
  await OrderModel.updateOne({ id }, { status, updatedAt: new Date().toISOString() });
}

// ─────────────────────────────────────────────────────────────
// POSTS
// ─────────────────────────────────────────────────────────────

export async function getAllPosts(opts?: { limit?: number; offset?: number }) {
  let query = PostModel.find().sort({ createdAt: -1 });
  if (opts?.offset) query = query.skip(opts.offset);
  if (opts?.limit) query = query.limit(opts.limit);
  return toPlain(await query);
}

export const getPosts = getAllPosts;

export async function getActivePosts(opts?: { limit?: number; offset?: number }) {
  let query = PostModel.find({ status: "active", approvalStatus: "green" }).sort({ createdAt: -1 });
  if (opts?.offset) query = query.skip(opts.offset);
  if (opts?.limit) query = query.limit(opts.limit);
  return toPlain(await query);
}

export async function getPostById(id: number) {
  return toPlain(await PostModel.findOne({ id }));
}

export async function createPost(arg1: any, arg2?: any) {
  let userId: number;
  let postData: any;
  if (typeof arg1 === "number") {
    userId = arg1;
    postData = arg2 || {};
  } else {
    postData = arg1 || {};
    userId = postData.userId || 1;
  }

  // Extract brandId from taggedProduct (top-level for fast querying)
  const taggedProduct = postData.taggedProduct || null;
  // Multi-item outfit support — array of all tagged products
  const taggedProducts = Array.isArray(postData.taggedProducts) && postData.taggedProducts.length > 0
    ? postData.taggedProducts
    : taggedProduct ? [taggedProduct] : [];

  const brandId: number | null = taggedProduct?.brandId
    ?? (taggedProducts[0]?.brandId ?? null)
    ?? postData.brandId ?? null;

  // Hotspots — accept array of objects directly
  const hotspots = Array.isArray(postData.hotspots)
    ? postData.hotspots
    : [];

  // Creator — accept object directly
  const creator = postData.creator || null;

  const now = new Date().toISOString();
  const id = await nextId("posts");
  const doc = new PostModel({
    id,
    userId,
    brandId,
    unregisteredBrand: postData.unregisteredBrand || null,
    image: postData.image || postData.imageUrl || null,
    caption: postData.caption || null,
    category: postData.category || null,
    mediaType: postData.mediaType || "image",
    status: postData.status || "active",
    approvalStatus: postData.approvalStatus || "pending",
    taggedProduct,
    taggedProducts,
    creator,
    hotspots,
    createdAt: now,
    updatedAt: now,
  });
  await doc.save();
  return toPlain(doc);
}

/**
 * Get all posts that tag a specific brand (by brandId).
 * This is the correct way to populate the Brand Dashboard — using the indexed brandId field.
 */
export async function getPostsByBrand(brandId: number) {
  return toPlain(await PostModel.find({ brandId }).sort({ createdAt: -1 }));
}

export async function updatePost(id: number, data: Partial<{
  caption: string; category: string; status: string; approvalStatus: string;
  taggedProduct: string; hotspots: string; likes: number; comments: number;
}>) {
  await PostModel.updateOne({ id }, { ...data, updatedAt: new Date().toISOString() });
  return toPlain(await PostModel.findOne({ id }));
}

export async function updatePostStatus(id: number, status: "active" | "hidden" | "flagged") {
  await PostModel.updateOne({ id }, { status, updatedAt: new Date().toISOString() });
}

export async function updatePostApproval(id: number, approvalStatus: "pending" | "green" | "red" | "grey") {
  const post = await PostModel.findOne({ id });
  await PostModel.updateOne({ id }, { approvalStatus, updatedAt: new Date().toISOString() });

  if (post && approvalStatus === "green") {
    // 1. Award creator commission reward and points
    const productPrice = post.taggedProduct?.price || 120;
    const userGrade = await getUserGrade(post.userId);
    const rate = userGrade?.commissionRate || 0.05;
    const commissionAmount = Math.max(5, Math.round(productPrice * rate * 10) / 10);

    // Check if commission for this approved post already exists
    const existing = await CommissionModel.findOne({ postId: id, userId: post.userId });
    if (!existing) {
      const now = new Date().toISOString();
      const commId = await nextId("commissions");
      const comm = new CommissionModel({
        id: commId,
        userId: post.userId,
        brandId: post.brandId || undefined,
        postId: id,
        amount: commissionAmount,
        description: `Creator commission for approved post #${id} tagging "${post.taggedProduct?.name || 'Brand Product'}"`,
        status: "approved",
        createdAt: now,
        updatedAt: now,
      });
      await comm.save();

      // Add Style Points XP
      await addStylePoints(post.userId, 50, `Post #${id} approved by brand`);

      // Update UserGrade totalEarned
      await UserGradeModel.updateOne(
        { userId: post.userId },
        { $inc: { totalEarned: commissionAmount } }
      );

      // Create in-app notification for creator
      const notifId = await nextId("notifications");
      const notif = new NotificationModel({
        id: notifId,
        userId: post.userId,
        type: "brand_approval",
        title: "Post Tag Approved! 🌟",
        message: `Your outfit post was approved! You earned a ${commissionAmount} TND commission and 50 Style Points.`,
        createdAt: now,
      });
      await notif.save();
    } else if (existing.status === "pending") {
      await CommissionModel.updateOne({ id: existing.id }, { status: "approved", updatedAt: new Date().toISOString() });
    }
  } else if (post && approvalStatus === "red") {
    await CommissionModel.updateMany(
      { postId: id, userId: post.userId, status: "pending" },
      { status: "rejected", updatedAt: new Date().toISOString() }
    );
  }
}

export async function deletePost(id: number) {
  await PostModel.deleteOne({ id });
}

// ─────────────────────────────────────────────────────────────
// BAG ITEMS
// ─────────────────────────────────────────────────────────────

export async function getBagItems(userId: number) {
  return toPlain(await BagItemModel.find({ userId }).sort({ addedAt: -1 }));
}

export async function addBagItem(arg1: any, arg2?: any) {
  let itemData: any;
  if (typeof arg1 === "number") {
    itemData = { userId: arg1, ...arg2 };
  } else {
    itemData = arg1;
  }
  const now = new Date().toISOString();
  const id = await nextId("bagItems");
  const doc = new BagItemModel({ id, ...itemData, addedAt: now });
  await doc.save();
  return toPlain(doc);
}

export const addToBag = addBagItem;

export async function removeBagItem(arg1: number, arg2?: number) {
  const id = typeof arg2 === "number" ? arg2 : arg1;
  await BagItemModel.deleteOne({ id });
}

export const removeFromBag = removeBagItem;

export async function clearBag(userId: number) {
  await BagItemModel.deleteMany({ userId });
}

export async function updateBagItemQty(id: number, qty: number) {
  await BagItemModel.updateOne({ id }, { qty });
}

// ─────────────────────────────────────────────────────────────
// MANNEQUIN PROFILES
// ─────────────────────────────────────────────────────────────

export async function getMannequinProfiles(userId: number) {
  return toPlain(await MannequinProfileModel.find({ userId }).sort({ slot: 1 }));
}

export async function getMannequinProfile(userId: number, _slot?: number) {
  const profiles = await getMannequinProfiles(userId);
  return profiles[0] || null;
}

export async function getAllMannequinProfiles(_userId?: number) {
  let query: any = {};
  if (_userId) query.userId = _userId;
  return toPlain(await MannequinProfileModel.find(query));
}

export async function saveMannequinProfile(userId: number, data: any) {
  return await upsertMannequinProfile(userId, 1, data);
}

export async function upsertMannequinProfile(arg1: number, arg2: any, arg3?: any) {
  let userId: number;
  let slot: number;
  let data: any;
  if (typeof arg2 === "number") {
    userId = arg1;
    slot = arg2;
    data = arg3 || {};
  } else {
    userId = arg1;
    slot = 1;
    data = arg2 || {};
  }

  const now = new Date().toISOString();
  const existing = await MannequinProfileModel.findOne({ userId, slot });
  if (existing) {
    await MannequinProfileModel.updateOne({ userId, slot }, { ...data, updatedAt: now });
    return toPlain(await MannequinProfileModel.findOne({ userId, slot }));
  } else {
    const id = await nextId("mannequinProfiles");
    const doc = new MannequinProfileModel({ id, ...data, userId, slot, createdAt: now, updatedAt: now });
    await doc.save();
    return toPlain(doc);
  }
}

export async function deleteMannequinProfile(userId: number, slot: number) {
  await MannequinProfileModel.deleteOne({ userId, slot });
}

// ─────────────────────────────────────────────────────────────
// BRAND STORES
// ─────────────────────────────────────────────────────────────

export async function getAllBrandStores() {
  return toPlain(await BrandStoreModel.find().sort({ createdAt: -1 }));
}

export async function getBrandStoreByUserId(userId: number, _brandId?: number) {
  let query: any = { userId };
  if (_brandId) query.brandId = _brandId;
  return toPlain(await BrandStoreModel.findOne(query));
}

export const getBrandStore = getBrandStoreByUserId;

export async function createBrandStore(arg1: any, arg2?: any) {
  let data = typeof arg1 === "object" ? arg1 : { userId: arg1, ...arg2 };
  const now = new Date().toISOString();
  const id = await nextId("brandStores");
  const doc = new BrandStoreModel({ id, ...data, createdAt: now, updatedAt: now });
  await doc.save();
  return toPlain(doc);
}

export const registerBrandStore = createBrandStore;

export async function updateBrandStoreStatus(id: number, status: "pending" | "approved" | "rejected") {
  await BrandStoreModel.updateOne({ id }, { status, updatedAt: new Date().toISOString() });
}

// ─────────────────────────────────────────────────────────────
// ACTIVITY LOGS
// ─────────────────────────────────────────────────────────────

export async function logActivity(
  userId: number, action: string, entityType: string,
  entityId?: number, description?: string
) {
  const id = await nextId("activityLogs");
  const doc = new ActivityLogModel({
    id, userId, action, entityType, entityId, description,
    createdAt: new Date().toISOString(),
  });
  await doc.save();
  return toPlain(doc);
}

export async function getRecentActivity(arg1?: number, arg2?: number) {
  let query: any = {};
  let limit = 50;
  if (typeof arg1 === "number" && typeof arg2 === "number") {
    query.userId = arg1;
    limit = arg2;
  } else if (typeof arg1 === "number") {
    limit = arg1;
  }
  return toPlain(await ActivityLogModel.find(query).sort({ createdAt: -1 }).limit(limit));
}

// ─────────────────────────────────────────────────────────────
// USER GRADES (Style Points)
// ─────────────────────────────────────────────────────────────

const GRADE_TIERS = [
  { min: 0,    grade: 1, title: "Newcomer",       commissionRate: 0.02 },
  { min: 100,  grade: 2, title: "Style Scout",    commissionRate: 0.03 },
  { min: 500,  grade: 3, title: "Trend Setter",   commissionRate: 0.05 },
  { min: 1500, grade: 4, title: "Fashion Forward",commissionRate: 0.07 },
  { min: 5000, grade: 5, title: "Style Icon",     commissionRate: 0.10 },
];

function calcGrade(sp: number) {
  let tier = GRADE_TIERS[0];
  for (const t of GRADE_TIERS) { if (sp >= t.min) tier = t; }
  return tier;
}

export async function getUserGrade(userId: number) {
  let grade = await UserGradeModel.findOne({ userId });
  if (!grade) {
    const id = await nextId("userGrades");
    grade = new UserGradeModel({ id, userId });
    await grade.save();
  }
  return toPlain(grade);
}

export async function getGradeLeaderboard(limit = 20) {
  return toPlain(await UserGradeModel.find().sort({ stylePoints: -1 }).limit(limit));
}

export async function addStylePoints(userId: number, points: number, _reason?: string) {
  let grade = await UserGradeModel.findOne({ userId });
  if (!grade) {
    const id = await nextId("userGrades");
    grade = new UserGradeModel({ id, userId });
  }
  const newSP = (grade.stylePoints || 0) + points;
  const tier = calcGrade(newSP);
  grade.stylePoints = newSP;
  grade.grade = tier.grade;
  grade.gradeTitle = tier.title;
  grade.commissionRate = tier.commissionRate;
  grade.updatedAt = new Date().toISOString();
  await grade.save();
  return toPlain(grade);
}

// ─────────────────────────────────────────────────────────────
// BRAND LEVELS (XP)
// ─────────────────────────────────────────────────────────────

const BRAND_TIERS = [
  { min: 0,     level: 1, title: "Starter" },
  { min: 500,   level: 2, title: "Rising" },
  { min: 2000,  level: 3, title: "Established" },
  { min: 7500,  level: 4, title: "Influential" },
  { min: 20000, level: 5, title: "Iconic" },
];

export async function getBrandLevel(brandId: number) {
  let bl = await BrandLevelModel.findOne({ brandId });
  if (!bl) {
    const id = await nextId("brandLevels");
    bl = new BrandLevelModel({ id, brandId });
    await bl.save();
  }
  return toPlain(bl);
}

export async function addBrandXP(brandId: number, xp: number, _reason?: string) {
  let bl = await BrandLevelModel.findOne({ brandId });
  if (!bl) {
    const id = await nextId("brandLevels");
    bl = new BrandLevelModel({ id, brandId });
  }
  const newXP = (bl.xp || 0) + xp;
  let tier = BRAND_TIERS[0];
  for (const t of BRAND_TIERS) { if (newXP >= t.min) tier = t; }
  bl.xp = newXP;
  bl.level = tier.level;
  bl.levelTitle = tier.title;
  bl.updatedAt = new Date().toISOString();
  await bl.save();
  return { newXP, tier };
}

// ─────────────────────────────────────────────────────────────
// COMMISSIONS
// ─────────────────────────────────────────────────────────────

export async function getUserCommissions(userId: number) {
  return toPlain(await CommissionModel.find({ userId }).sort({ createdAt: -1 }));
}

export async function getBrandCommissions(brandId: number) {
  return toPlain(await CommissionModel.find({ brandId }).sort({ createdAt: -1 }));
}

export async function createCommission(data: {
  userId: number; brandId?: number; postId?: number; amount: number; description?: string;
}) {
  const now = new Date().toISOString();
  const id = await nextId("commissions");
  const doc = new CommissionModel({ id, ...data, createdAt: now, updatedAt: now });
  await doc.save();
  return toPlain(doc);
}

export async function updateCommissionStatus(id: number, status: "approved" | "paid" | "rejected") {
  await CommissionModel.updateOne({ id }, { status, updatedAt: new Date().toISOString() });
}

// ─────────────────────────────────────────────────────────────
// WITHDRAWALS & FINANCIALS (User & Brand)
// ─────────────────────────────────────────────────────────────

export async function getUserCommissionFinancials(userId: number) {
  const commissions = toPlain(await CommissionModel.find({ userId }).sort({ createdAt: -1 }));
  const withdrawals = toPlain(await WithdrawalModel.find({ userId, type: "user" }).sort({ createdAt: -1 }));

  // Total earned from approved and paid commissions
  const approvedCommissions = commissions.filter((c: any) => c.status === "approved" || c.status === "paid");
  const totalEarned = approvedCommissions.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

  // Pending commissions not yet approved
  const pendingCommissions = commissions
    .filter((c: any) => c.status === "pending")
    .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

  // Total completed payouts
  const totalWithdrawn = withdrawals
    .filter((w: any) => w.status === "completed")
    .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

  // Pending / processing withdrawals
  const pendingWithdrawal = withdrawals
    .filter((w: any) => w.status === "pending" || w.status === "approved")
    .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

  // Available balance for new withdrawal requests
  const availableBalance = Math.max(0, Math.round((totalEarned - totalWithdrawn - pendingWithdrawal) * 100) / 100);

  return {
    availableBalance,
    totalEarned: Math.round(totalEarned * 100) / 100,
    totalWithdrawn: Math.round(totalWithdrawn * 100) / 100,
    pendingCommissions: Math.round(pendingCommissions * 100) / 100,
    pendingWithdrawal: Math.round(pendingWithdrawal * 100) / 100,
    commissions,
    withdrawals,
  };
}

export async function getBrandFinancials(brandId: number) {
  // 1. Fetch shipments for this brand
  const shipments = await ShipmentModel.find({ brandId });
  const completedShipments = shipments.filter(s => s.status === "delivered" || s.status === "shipped");

  // 2. Fetch order items for these shipments
  const shipmentIds = completedShipments.map(s => s.id);
  const items = await OrderItemModel.find({ shipmentId: { $in: shipmentIds } });

  // Gross sales volume
  const grossSales = items.reduce((sum, item) => sum + ((item.priceAtPurchase || 0) * (item.quantity || 1)), 0);

  // Platform commission fee (e.g. 5% - 9% based on brand tier)
  const brandLevel = await getBrandLevel(brandId);
  const feeRate = (brandLevel?.level || 1) >= 3 ? 0.05 : ((brandLevel?.level || 1) === 2 ? 0.07 : 0.09);
  const platformFee = Math.round(grossSales * feeRate * 100) / 100;
  const netProfit = Math.max(0, Math.round((grossSales - platformFee) * 100) / 100);

  // 3. Fetch brand withdrawals
  const withdrawals = toPlain(await WithdrawalModel.find({ brandId, type: "brand" }).sort({ createdAt: -1 }));

  const totalWithdrawn = withdrawals
    .filter((w: any) => w.status === "completed")
    .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

  const pendingWithdrawal = withdrawals
    .filter((w: any) => w.status === "pending" || w.status === "approved")
    .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

  const availableBalance = Math.max(0, Math.round((netProfit - totalWithdrawn - pendingWithdrawal) * 100) / 100);

  return {
    brandId,
    grossSales: Math.round(grossSales * 100) / 100,
    platformFee,
    netProfit,
    feeRatePercentage: Math.round(feeRate * 100),
    totalWithdrawn: Math.round(totalWithdrawn * 100) / 100,
    pendingWithdrawal: Math.round(pendingWithdrawal * 100) / 100,
    availableBalance,
    totalOrders: completedShipments.length,
    withdrawals,
  };
}

export async function createWithdrawalRequest(data: {
  userId: number;
  brandId?: number | null;
  type: "user" | "brand";
  requesterName: string;
  requesterEmail: string;
  amount: number;
  paymentMethod: "d17" | "flouci" | "bank_transfer" | "cash_pickup";
  paymentDetails: {
    phone?: string;
    flouciNumber?: string;
    rib?: string;
    bankName?: string;
    beneficiaryName?: string;
    notes?: string;
  };
}) {
  if (data.amount <= 0) {
    throw new Error("Withdrawal amount must be greater than 0");
  }

  // Validate balance
  if (data.type === "user") {
    if (data.amount < 50) {
      throw new Error("Minimum withdrawal amount for users is 50.00 TND");
    }
    const financials = await getUserCommissionFinancials(data.userId);
    if (financials.availableBalance < 50) {
      throw new Error(`You must have at least 50.00 TND in available commission profits to withdraw (current: ${financials.availableBalance} TND)`);
    }
    if (data.amount > financials.availableBalance) {
      throw new Error(`Insufficient balance. Available: ${financials.availableBalance} TND, Requested: ${data.amount} TND`);
    }
  } else if (data.type === "brand" && data.brandId) {
    const financials = await getBrandFinancials(data.brandId);
    if (data.amount > financials.availableBalance) {
      throw new Error(`Insufficient brand profit balance. Available: ${financials.availableBalance} TND, Requested: ${data.amount} TND`);
    }
  }

  const now = new Date().toISOString();
  const id = await nextId("withdrawals");
  const doc = new WithdrawalModel({
    id,
    ...data,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  await doc.save();

  // Create notification for requester
  const notifId = await nextId("notifications");
  const notif = new NotificationModel({
    id: notifId,
    userId: data.userId,
    type: "new_order",
    title: "Withdrawal Requested 💸",
    message: `Your withdrawal request of ${data.amount} TND via ${data.paymentMethod.toUpperCase()} has been submitted for admin review.`,
    createdAt: now,
  });
  await notif.save();

  return toPlain(doc);
}

export async function getAllWithdrawals(filters?: { type?: string; status?: string }) {
  const query: any = {};
  if (filters?.type && filters.type !== "all") query.type = filters.type;
  if (filters?.status && filters.status !== "all") query.status = filters.status;
  return toPlain(await WithdrawalModel.find(query).sort({ createdAt: -1 }));
}

export async function getUserWithdrawals(userId: number) {
  return toPlain(await WithdrawalModel.find({ userId, type: "user" }).sort({ createdAt: -1 }));
}

export async function getBrandWithdrawals(brandId: number) {
  return toPlain(await WithdrawalModel.find({ brandId, type: "brand" }).sort({ createdAt: -1 }));
}

export async function updateWithdrawalStatus(
  id: number,
  status: "pending" | "approved" | "completed" | "rejected",
  adminNotes?: string,
  rejectionReason?: string
) {
  const now = new Date().toISOString();
  const withdrawal = await WithdrawalModel.findOne({ id });
  if (!withdrawal) throw new Error("Withdrawal request not found");

  await WithdrawalModel.updateOne(
    { id },
    {
      status,
      adminNotes: adminNotes ?? withdrawal.adminNotes,
      rejectionReason: rejectionReason ?? withdrawal.rejectionReason,
      processedAt: (status === "completed" || status === "rejected") ? now : withdrawal.processedAt,
      updatedAt: now,
    }
  );

  // If completed and user withdrawal, update user grade totalPaid
  if (status === "completed" && withdrawal.type === "user") {
    await UserGradeModel.updateOne(
      { userId: withdrawal.userId },
      { $inc: { totalPaid: withdrawal.amount } }
    );
  }

  // Create notification for requester
  const notifId = await nextId("notifications");
  const notif = new NotificationModel({
    id: notifId,
    userId: withdrawal.userId,
    type: status === "completed" ? "new_order" : "brand_approval",
    title: status === "completed"
      ? "Payout Completed! 💰"
      : (status === "rejected" ? "Withdrawal Update ❌" : "Withdrawal Processing ⏳"),
    message: status === "completed"
      ? `Your payout of ${withdrawal.amount} TND has been sent to your ${withdrawal.paymentMethod.toUpperCase()}!`
      : (status === "rejected"
        ? `Your withdrawal request of ${withdrawal.amount} TND was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''} The amount is returned to your available balance.`
        : `Your withdrawal request of ${withdrawal.amount} TND is now being processed.`),
    createdAt: now,
  });
  await notif.save();

  return toPlain(await WithdrawalModel.findOne({ id }));
}

// ─────────────────────────────────────────────────────────────
// SHIPMENTS / DELIVERY SYSTEM
// ─────────────────────────────────────────────────────────────

export type CheckoutItem = {
  id: number; name: string; price: number; image?: string;
  size?: string; qty: number; brandId?: number; brandName?: string;
};

export type CheckoutAddress = {
  fullName: string; phone: string; address: string;
  city: string; postCode: string; country: string;
};

export async function createFullOrder(
  customerId: number, customerEmail: string | undefined,
  checkout: CheckoutAddress, items: CheckoutItem[], totalAmount: number
) {
  const now = new Date().toISOString();
  const shippingLine = `${checkout.address}, ${checkout.city} ${checkout.postCode}, ${checkout.country}`;

  // 1. Create order
  const orderId = await nextId("orders");
  const ord = new OrderModel({
    id:              orderId,
    customerId,
    customerName:    checkout.fullName,
    customerEmail,
    phone:           checkout.phone,
    shippingAddress: checkout.address,
    city:            checkout.city,
    postCode:        checkout.postCode,
    country:         checkout.country,
    status:          "pending",
    totalAmount,
    itemCount:       items.reduce((s, i) => s + i.qty, 0),
    createdAt: now, updatedAt: now,
  });
  await ord.save();

  // 2. Group by brand
  const byBrand = new Map<string, CheckoutItem[]>();
  for (const item of items) {
    const key = `${item.brandId ?? 0}::${item.brandName ?? "Unknown"}`;
    if (!byBrand.has(key)) byBrand.set(key, []);
    byBrand.get(key)!.push(item);
  }

  // 3. One shipment per brand
  for (const [key, bItems] of Array.from(byBrand)) {
    const [bIdStr, bName] = key.split("::");
    const brandId = parseInt(bIdStr) || 0;

    const shipmentId = await nextId("shipments");
    const sh = new ShipmentModel({
      id:              shipmentId,
      orderId:         ord.id,
      brandId,
      brandName:       bName,
      status:          "pending",
      shippingAddress: shippingLine,
      createdAt: now, updatedAt: now,
    });
    await sh.save();

    for (const item of bItems) {
      const orderItemId = await nextId("orderItems");
      const oi = new OrderItemModel({
        id:              orderItemId,
        orderId:         ord.id,
        shipmentId:      sh.id,
        deviceId:        item.id,
        brandId:         item.brandId ?? null,
        productName:     item.name,
        productImage:    item.image ?? null,
        size:            item.size ?? null,
        quantity:        item.qty,
        priceAtPurchase: item.price,
        createdAt: now,
      });
      await oi.save();
    }
  }

  return toPlain(ord);
}

export async function getShipmentsByOrder(orderId: number) {
  const shs = toPlain(await ShipmentModel.find({ orderId }).sort({ createdAt: -1 }));
  const allItems = toPlain(await OrderItemModel.find({ orderId }));
  return shs.map((s: any) => ({ ...s, items: allItems.filter((i: any) => i.shipmentId === s.id) }));
}

export async function getShipmentsByBrand(brandId: number) {
  const shs = toPlain(await ShipmentModel.find({ brandId }).sort({ createdAt: -1 }));
  const allItems = toPlain(await OrderItemModel.find({ brandId }));
  return shs.map((s: any) => ({ ...s, items: allItems.filter((i: any) => i.shipmentId === s.id) }));
}

export async function getAllShipments() {
  return toPlain(await ShipmentModel.find().sort({ createdAt: -1 }));
}

export async function updateShipmentStatus(
  shipmentId: number,
  data: {
    status: "pending"|"preparing"|"ready_for_pickup"|"shipped"|"delivered"|"canceled"|"refunded";
    carrier?: string; trackingNumber?: string; estimatedDeliveryDate?: string; notes?: string;
  }
) {
  await ShipmentModel.updateOne({ id: shipmentId }, { ...data, updatedAt: new Date().toISOString() });
}

export async function getOrdersByCustomer(customerId: number) {
  const ords = toPlain(await OrderModel.find({ customerId }).sort({ createdAt: -1 }));
  const result = [];
  for (const ord of ords) {
    const shs = await getShipmentsByOrder(ord.id);
    result.push({ ...ord, shipments: shs });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// ANALYTICS / DASHBOARD STATS
// ─────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [totalUsers, totalBrands, totalDevices, totalOrders, totalPosts] = await Promise.all([
    UserModel.countDocuments(),
    BrandModel.countDocuments({ isActive: true }),
    DeviceModel.countDocuments({ isActive: true }),
    OrderModel.countDocuments(),
    PostModel.countDocuments({ status: "active" }),
  ]);

  const revenueAgg = await OrderModel.aggregate([
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ]);
  const totalRevenue = revenueAgg[0]?.total ?? 0;

  return { totalUsers, totalBrands, totalDevices, activeDevices: totalDevices, totalOrders, totalRevenue, totalPosts };
}

export const getDashboardMetrics = getDashboardStats;

// ─────────────────────────────────────────────────────────────
// LEGACY COMPAT — getFallbackData kept so routers don't break
// ─────────────────────────────────────────────────────────────

export async function getFallbackData() {
  return {
    users:             toPlain(await UserModel.find()),
    devices:           toPlain(await DeviceModel.find()),
    orders:            toPlain(await OrderModel.find()),
    brands:            toPlain(await BrandModel.find()),
    posts:             toPlain(await PostModel.find()),
    bagItems:          toPlain(await BagItemModel.find()),
    mannequinProfiles: toPlain(await MannequinProfileModel.find()),
    brandStores:       toPlain(await BrandStoreModel.find()),
    orderItems:        toPlain(await OrderItemModel.find()),
    activityLogs:      toPlain(await ActivityLogModel.find()),
  };
}

// ─────────────────────────────────────────────────────────────
// DELIVERY PROFILE
// ─────────────────────────────────────────────────────────────

export async function getUserDeliveryProfile(userId: number) {
  const user = await UserModel.findOne({ id: userId });
  if (!user) return null;
  const plain = toPlain(user);
  return {
    phone: plain.phone || "",
    deliveryAddress: plain.deliveryAddress || "",
    deliveryCity: plain.deliveryCity || "",
    deliveryPostCode: plain.deliveryPostCode || "",
    deliveryCountry: plain.deliveryCountry || "Tunisia",
    isComplete: !!(plain.phone && plain.deliveryAddress && plain.deliveryCity),
  };
}

export async function updateDeliveryProfile(userId: number, data: {
  phone?: string; deliveryAddress?: string; deliveryCity?: string;
  deliveryPostCode?: string; deliveryCountry?: string;
}) {
  await UserModel.updateOne({ id: userId }, { ...data, updatedAt: new Date().toISOString() });
  return getUserDeliveryProfile(userId);
}

// ─────────────────────────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────────────────────────

export async function setPasswordResetToken(email: string, token: string, expiryMs = 3600000) {
  const expiry = new Date(Date.now() + expiryMs).toISOString();
  await UserModel.updateOne(
    { email },
    { resetPasswordToken: token, resetPasswordExpiry: expiry, updatedAt: new Date().toISOString() }
  );
}

export async function getUserByResetToken(token: string) {
  return toPlain(await UserModel.findOne({ resetPasswordToken: token }));
}

export async function resetUserPassword(token: string, newPasswordHash: string) {
  const user = await getUserByResetToken(token);
  if (!user) throw new Error("Invalid reset token");
  if (!user.resetPasswordExpiry || new Date(user.resetPasswordExpiry) < new Date()) {
    throw new Error("Reset token has expired");
  }
  await UserModel.updateOne(
    { id: user.id },
    { passwordHash: newPasswordHash, resetPasswordToken: null, resetPasswordExpiry: null, updatedAt: new Date().toISOString() }
  );
  return user;
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

export async function createNotification(data: {
  userId?: number; brandId?: number; orderId?: number;
  type: "order_placed" | "order_confirmed" | "order_shipped" | "order_delivered" | "new_order" | "shipment_update";
  title: string; message: string;
}) {
  const now = new Date().toISOString();
  const id = await nextId("notifications");
  const doc = new NotificationModel({ id, ...data, isRead: false, createdAt: now });
  await doc.save();
  return toPlain(doc);
}

export async function getNotificationsByUser(userId: number) {
  return toPlain(await NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(50));
}

export async function getNotificationsByBrand(brandId: number) {
  return toPlain(await NotificationModel.find({ brandId }).sort({ createdAt: -1 }).limit(50));
}

export async function markNotificationsRead(ids: number[]) {
  await NotificationModel.updateMany({ id: { $in: ids } }, { isRead: true });
}

export async function getUnreadCountByUser(userId: number) {
  return await NotificationModel.countDocuments({ userId, isRead: false });
}

export async function getUnreadCountByBrand(brandId: number) {
  return await NotificationModel.countDocuments({ brandId, isRead: false });
}

export async function linkPendingPostsToBrand(brandName: string, brandId: number) {
  const slug = brandName.toLowerCase().replace(/\s+/g, "");
  const posts = await PostModel.find({
    $or: [
      { unregisteredBrand: { $regex: new RegExp(`^${brandName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") } },
      {
        brandId: null,
        caption: { $regex: new RegExp(`@${slug}\\b`, "i") }
      }
    ]
  });

  if (posts.length > 0) {
    for (const post of posts) {
      post.brandId = brandId;
      post.approvalStatus = "pending";
      post.unregisteredBrand = null;
      if (post.taggedProduct) {
        post.taggedProduct.brandId = brandId;
      }
      await post.save();
    }
    console.log(`[Styly Pipeline] Successfully linked ${posts.length} posts to brand "${brandName}" (ID: ${brandId})`);
  }
}

// ─────────────────────────────────────────────────────────────
// FOLLOWS
// ─────────────────────────────────────────────────────────────

export async function followTarget(followerId: number, targetType: "user" | "brand", targetId: number, targetName?: string) {
  const existing = await FollowModel.findOne({ followerId, targetType, targetId });
  if (existing) return toPlain(existing); // already following
  const id = await nextId("follows");
  const doc = new FollowModel({ id, followerId, targetType, targetId, targetName: targetName || "" });
  await doc.save();
  return toPlain(doc);
}

export async function unfollowTarget(followerId: number, targetType: "user" | "brand", targetId: number) {
  await FollowModel.deleteOne({ followerId, targetType, targetId });
  return { success: true };
}

export async function isFollowing(followerId: number, targetType: "user" | "brand", targetId: number): Promise<boolean> {
  const doc = await FollowModel.findOne({ followerId, targetType, targetId });
  return !!doc;
}

export async function getFollowing(followerId: number) {
  const docs = await FollowModel.find({ followerId }).sort({ createdAt: -1 });
  return toPlain(docs);
}

export async function getFollowers(targetType: "user" | "brand", targetId: number) {
  const docs = await FollowModel.find({ targetType, targetId }).sort({ createdAt: -1 });
  return toPlain(docs);
}

export async function getFollowCounts(userId: number) {
  const [following, followers] = await Promise.all([
    FollowModel.countDocuments({ followerId: userId }),
    FollowModel.countDocuments({ targetType: "user", targetId: userId }),
  ]);
  return { following, followers };
}
