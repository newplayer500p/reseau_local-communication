// models/Message.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  room: { type: String, ref: 'Room', required: true },
  sender: { type: String, ref: 'User', required: true }, // ou null pour system messages
  type: { type: String, enum: ['text','file'], default: 'text' },
  text: String,
  file: {
    filename: String,
    url: String,
    mime: String,
    size: Number
  },
  createdAt: { type: Date, default: Date.now },
});

MessageSchema.index({ room: 1, createdAt: -1 });

export default mongoose.model('Message', MessageSchema);
