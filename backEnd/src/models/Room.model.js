import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ex: "math-101"
  title: { type: String, required: true },
  description: String,
  passwordHash: String,
  createdBy: { type: String, ref: 'User', required: true },
  isPrivate: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

RoomSchema.methods.checkPassword = function(plaintext) {
  if (!this.passwordHash) return Promise.resolve(true);
  return bcrypt.compare(plaintext, this.passwordHash);
};

export default mongoose.model('Room', RoomSchema);
