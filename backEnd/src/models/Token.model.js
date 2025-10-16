import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  userEMail: { type: String, ref: "User", required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  revoked: { type: Date, default: null },
  replacedByToken: { type: String, default: null },
});

refreshTokenSchema.virtual("isExpired").get(function () {
  return Date.now() >= this.expiresAt;
});

refreshTokenSchema.virtual("isActive").get(function () {
  return !this.revoked && !this.isExpired;
});

export default mongoose.model("RefreshToken", refreshTokenSchema);