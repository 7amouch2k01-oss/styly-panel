/**
 * server/mongodb.ts
 * ─────────────────────────────────────────────────────────────
 * Mongoose models for the Styly platform.
 * Replaces the Drizzle/LibSQL (SQLite) data layer.
 * Connection is managed via connectMongo() called once at startup.
 */
import mongoose, { Schema, model } from "mongoose";

// ─── Connection ───────────────────────────────────────────────────────────────

let _connected = false;

export async function connectMongo(): Promise<void> {
  if (_connected) return;
  const uri =
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/styly";
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    _connected = true;
    console.log("[MongoDB] ✅ Connected to:", uri.replace(/:([^@]+)@/, ":****@"));
  } catch (err: any) {
    console.error("[MongoDB] ❌ Connection failed:", err.message);
    console.error("[MongoDB] ⚠️  Server will continue but DB operations will fail until connection is restored.");
    console.error("[MongoDB] 👉 Check your MONGODB_URI in .env and ensure the Atlas user/password is correct.");
    // Don't throw — server continues to run so the frontend loads
  }
}

// ─── Auto-increment helper (replaces SQLite AUTOINCREMENT) ────────────────────

export async function nextId(collection: string): Promise<number> {
  const Counter = mongoose.models.Counter || model(
    "Counter",
    new Schema({ _id: String, seq: { type: Number, default: 0 } })
  );
  const doc = await (Counter as any).findByIdAndUpdate(
    collection,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

// ─── USERS ────────────────────────────────────────────────────────────────────

const UserSchema = new Schema({
  id:                   { type: Number, unique: true, index: true },
  openId:               { type: String, required: true, unique: true },
  name:                 String,
  email:                { type: String, sparse: true },
  loginMethod:          String,
  role:                 { type: String, enum: ["user", "admin"], default: "user" },
  status:               { type: String, enum: ["active", "inactive", "banned"], default: "active" },
  passwordHash:         String,
  avatarUrl:            String,
  bio:                  String,
  isEmailVerified:      { type: Boolean, default: false },
  verificationCode:     String,
  // Password reset
  resetPasswordToken:   String,
  resetPasswordExpiry:  String,
  // Delivery profile
  phone:                String,
  deliveryAddress:      String,
  deliveryCity:         String,
  deliveryPostCode:     String,
  deliveryCountry:      String,
  createdAt:            { type: String, default: () => new Date().toISOString() },
  updatedAt:            { type: String, default: () => new Date().toISOString() },
  lastSignedIn:         { type: String, default: () => new Date().toISOString() },
}, { collection: "users" });

export const UserModel = mongoose.models.User || model("User", UserSchema);

// ─── BRANDS ───────────────────────────────────────────────────────────────────

const BrandSchema = new Schema({
  id:          { type: Number, unique: true, index: true },
  name:        { type: String, required: true, unique: true },
  logoUrl:     String,
  country:     { type: String, required: true },
  category:    { type: String, required: true },
  description: String,
  website:     String,
  isActive:    { type: Boolean, default: true },
  createdAt:   { type: String, default: () => new Date().toISOString() },
  updatedAt:   { type: String, default: () => new Date().toISOString() },
}, { collection: "brands" });

export const BrandModel = mongoose.models.Brand || model("Brand", BrandSchema);

// ─── DEVICES (Products) ───────────────────────────────────────────────────────

const DeviceSchema = new Schema({
  id:          { type: Number, unique: true, index: true },
  name:        { type: String, required: true },
  category:    { type: String, required: true },
  price:       { type: Number, required: true },
  stock:       { type: Number, default: 0 },
  description: String,
  imageUrl:    String,
  brandId:     Number,
  isActive:    { type: Boolean, default: true },
  createdAt:   { type: String, default: () => new Date().toISOString() },
  updatedAt:   { type: String, default: () => new Date().toISOString() },
}, { collection: "devices" });

export const DeviceModel = mongoose.models.Device || model("Device", DeviceSchema);

// ─── ORDERS ───────────────────────────────────────────────────────────────────

const OrderSchema = new Schema({
  id:              { type: Number, unique: true, index: true },
  customerId:      { type: Number, required: true },
  customerName:    { type: String, required: true },
  customerEmail:   String,
  phone:           String,
  shippingAddress: String,
  city:            String,
  postCode:        String,
  country:         String,
  paymentMethod:   { type: String, enum: ["card", "d17", "flouci", "cod"], default: "cod" },
  status:          { type: String, enum: ["pending", "processing", "shipped", "delivered"], default: "pending" },
  totalAmount:     { type: Number, required: true },
  itemCount:       { type: Number, default: 0 },
  notes:           String,
  createdAt:       { type: String, default: () => new Date().toISOString() },
  updatedAt:       { type: String, default: () => new Date().toISOString() },
}, { collection: "orders" });

export const OrderModel = mongoose.models.Order || model("Order", OrderSchema);

// ─── ORDER ITEMS ──────────────────────────────────────────────────────────────

const OrderItemSchema = new Schema({
  id:              { type: Number, unique: true, index: true },
  orderId:         { type: Number, required: true },
  shipmentId:      Number,
  deviceId:        { type: Number, required: true },
  brandId:         Number,
  productName:     String,
  productImage:    String,
  size:            String,
  quantity:        { type: Number, default: 1 },
  priceAtPurchase: { type: Number, required: true },
  createdAt:       { type: String, default: () => new Date().toISOString() },
}, { collection: "orderItems" });

export const OrderItemModel = mongoose.models.OrderItem || model("OrderItem", OrderItemSchema);

// ─── SHIPMENTS ────────────────────────────────────────────────────────────────

const ShipmentSchema = new Schema({
  id:                    { type: Number, unique: true, index: true },
  orderId:               { type: Number, required: true },
  brandId:               { type: Number, required: true },
  brandName:             { type: String, required: true },
  status:                { type: String, enum: ["pending","preparing","ready_for_pickup","shipped","delivered","canceled"], default: "pending" },
  carrier:               String,
  trackingNumber:        String,
  estimatedDeliveryDate: String,
  shippingAddress:       { type: String, required: true },
  notes:                 String,
  createdAt:             { type: String, default: () => new Date().toISOString() },
  updatedAt:             { type: String, default: () => new Date().toISOString() },
}, { collection: "shipments" });

export const ShipmentModel = mongoose.models.Shipment || model("Shipment", ShipmentSchema);

// ─── POSTS ────────────────────────────────────────────────────────────────────

const PostSchema = new Schema({
  id:             { type: Number, unique: true, index: true },
  userId:         { type: Number, required: true },
  image:          String,
  caption:        String,
  category:       String,
  likes:          { type: Number, default: 0 },
  comments:       { type: Number, default: 0 },
  status:         { type: String, enum: ["active", "hidden", "flagged"], default: "active" },
  approvalStatus: { type: String, enum: ["pending", "green", "red", "grey"], default: "pending" },
  taggedProduct:  String, // JSON string
  creatorJson:    String, // JSON string
  hotspots:       String, // JSON string
  mediaType:      { type: String, enum: ["image", "video"], default: "image" },
  createdAt:      { type: String, default: () => new Date().toISOString() },
  updatedAt:      { type: String, default: () => new Date().toISOString() },
}, { collection: "posts" });

export const PostModel = mongoose.models.Post || model("Post", PostSchema);

// ─── BAG ITEMS ────────────────────────────────────────────────────────────────

const BagItemSchema = new Schema({
  id:        { type: Number, unique: true, index: true },
  userId:    { type: Number, required: true },
  productId: { type: Number, required: true },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  image:     String,
  size:      String,
  qty:       { type: Number, default: 1 },
  addedAt:   { type: String, default: () => new Date().toISOString() },
}, { collection: "bagItems" });

export const BagItemModel = mongoose.models.BagItem || model("BagItem", BagItemSchema);

// ─── MANNEQUIN PROFILES ───────────────────────────────────────────────────────

const MannequinProfileSchema = new Schema({
  id:        { type: Number, unique: true, index: true },
  userId:    { type: Number, required: true },
  slot:      { type: Number, default: 1 },
  name:      String,
  gender:    String,
  height:    Number,
  weight:    Number,
  bodyShape: String,
  bust:      Number,
  waist:     Number,
  hips:      Number,
  imageUrl:  String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { collection: "mannequinProfiles" });

export const MannequinProfileModel = mongoose.models.MannequinProfile || model("MannequinProfile", MannequinProfileSchema);

// ─── BRAND STORES ─────────────────────────────────────────────────────────────

const BrandStoreSchema = new Schema({
  id:        { type: Number, unique: true, index: true },
  userId:    { type: Number, required: true },
  brandId:   Number,
  brandName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email:     { type: String, required: true },
  phone:     String,
  idFile:    String,
  status:    { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { collection: "brandStores" });

export const BrandStoreModel = mongoose.models.BrandStore || model("BrandStore", BrandStoreSchema);

// ─── USER GRADES (Style Points) ───────────────────────────────────────────────

const UserGradeSchema = new Schema({
  id:             { type: Number, unique: true, index: true },
  userId:         { type: Number, required: true, unique: true },
  stylePoints:    { type: Number, default: 0 },
  grade:          { type: Number, default: 1 },
  gradeTitle:     { type: String, default: "Newcomer" },
  commissionRate: { type: Number, default: 0.02 },
  totalEarned:    { type: Number, default: 0 },
  totalPaid:      { type: Number, default: 0 },
  updatedAt:      { type: String, default: () => new Date().toISOString() },
}, { collection: "userGrades" });

export const UserGradeModel = mongoose.models.UserGrade || model("UserGrade", UserGradeSchema);

// ─── BRAND LEVELS (XP) ────────────────────────────────────────────────────────

const BrandLevelSchema = new Schema({
  id:         { type: Number, unique: true, index: true },
  brandId:    { type: Number, required: true, unique: true },
  xp:         { type: Number, default: 0 },
  level:      { type: Number, default: 1 },
  levelTitle: { type: String, default: "Starter" },
  updatedAt:  { type: String, default: () => new Date().toISOString() },
}, { collection: "brandLevels" });

export const BrandLevelModel = mongoose.models.BrandLevel || model("BrandLevel", BrandLevelSchema);

// ─── COMMISSIONS ──────────────────────────────────────────────────────────────

const CommissionSchema = new Schema({
  id:          { type: Number, unique: true, index: true },
  userId:      { type: Number, required: true },
  brandId:     Number,
  postId:      Number,
  amount:      { type: Number, required: true },
  status:      { type: String, enum: ["pending", "approved", "paid", "rejected"], default: "pending" },
  description: String,
  createdAt:   { type: String, default: () => new Date().toISOString() },
  updatedAt:   { type: String, default: () => new Date().toISOString() },
}, { collection: "commissions" });

export const CommissionModel = mongoose.models.Commission || model("Commission", CommissionSchema);

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────

const ActivityLogSchema = new Schema({
  id:          { type: Number, unique: true, index: true },
  userId:      { type: Number, required: true },
  action:      { type: String, required: true },
  entityType:  { type: String, required: true },
  entityId:    Number,
  description: String,
  createdAt:   { type: String, default: () => new Date().toISOString() },
}, { collection: "activityLogs" });

export const ActivityLogModel = mongoose.models.ActivityLog || model("ActivityLog", ActivityLogSchema);

// ─── ANALYTICS SNAPSHOTS ──────────────────────────────────────────────────────

const AnalyticsSnapshotSchema = new Schema({
  id:             { type: Number, unique: true, index: true },
  date:           { type: String, default: () => new Date().toISOString() },
  totalUsers:     { type: Number, default: 0 },
  activeProducts: { type: Number, default: 0 },
  totalRevenue:   { type: Number, default: 0 },
  totalOrders:    { type: Number, default: 0 },
  newOrders:      { type: Number, default: 0 },
  topBrand:       String,
  createdAt:      { type: String, default: () => new Date().toISOString() },
}, { collection: "analyticsSnapshots" });

export const AnalyticsSnapshotModel = mongoose.models.AnalyticsSnapshot || model("AnalyticsSnapshot", AnalyticsSnapshotSchema);

// ─── Helper: convert Mongoose doc to plain object with numeric id ─────────────
export function toPlain(doc: any): any {
  if (!doc) return null;
  if (Array.isArray(doc)) return doc.map(toPlain);
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  return obj;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

const NotificationSchema = new Schema({
  id:        { type: Number, unique: true, index: true },
  userId:    Number,   // null for brand-only notifications
  brandId:   Number,   // null for user-only notifications
  orderId:   Number,
  type:      { type: String, enum: ["order_placed", "order_confirmed", "order_shipped", "order_delivered", "new_order", "shipment_update"], default: "order_placed" },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  isRead:    { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { collection: "notifications" });

export const NotificationModel = mongoose.models.Notification || model("Notification", NotificationSchema);
