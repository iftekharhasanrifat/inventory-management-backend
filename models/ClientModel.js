import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  totalDue: { type: Number, default: 0 },
}, { timestamps: true });

export const Client = mongoose.model('Client', clientSchema);