import mongoose from "mongoose";

const clientLedgerSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  type: { type: String, enum: ['sale', 'payment','advance'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
  stockOutId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'StockOut'
}
}, { timestamps: true });

export const ClientLedger = mongoose.model('ClientLedger', clientLedgerSchema);