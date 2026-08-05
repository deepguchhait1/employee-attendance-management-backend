import mongoose from "mongoose";
import { env } from "./env.js";

const connectDB = async () => {
  try {

    await mongoose.connect(env.MONGODB_URI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed");
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;
