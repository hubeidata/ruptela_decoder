// auth-back/schema/payment.js
const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  attendee: { type: mongoose.Schema.Types.ObjectId, ref: "Attendee", required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  paymentDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", PaymentSchema);
