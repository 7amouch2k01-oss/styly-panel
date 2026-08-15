import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI environment variable is required.");
  process.exit(1);
}

async function wipeDatabase() {
  console.log("Connecting to MongoDB Atlas...");
  try {
    await mongoose.connect(uri!);
    console.log("Connected successfully. Wiping all collections...");

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      console.log(`Clearing collection: ${key}`);
      await collections[key].deleteMany({});
    }

    console.log("Database wiped successfully!");
  } catch (err) {
    console.error("Wipe failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

wipeDatabase();
