// models/messageModel.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  receiverEmail: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["message", "invite"], 
    default: "message" 
  },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "declined", "read"], 
    default: "pending" 
  },
  managerID: { type: String }, // Used specifically for invites
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);