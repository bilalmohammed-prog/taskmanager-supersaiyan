import mongoose from "mongoose";

const MONGODB_URI = process.env.uri as string;

if (!MONGODB_URI) {
  throw new Error("Please add MONGODB_URI to .env file");
}

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  await mongoose.connect(MONGODB_URI);
  isConnected = true;
  console.log("MongoDB Connected");
}
