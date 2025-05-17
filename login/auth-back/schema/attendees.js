const mongoose = require("mongoose");

const AttendeeSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  document: { type: String, required: true },
  additionalData: { type: Object },
  qrCode: { type: String }
});

module.exports = mongoose.model("Attendee", AttendeeSchema);
