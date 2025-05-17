// auth-back/schema/event.js
const mongoose = require("mongoose");

const RegistrationFieldSchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  fieldType: { type: String, enum: ["text", "number", "email", "date"], required: true },
  required: { type: Boolean, default: true },
});

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationFields: { type: [RegistrationFieldSchema], default: [] },
  branding: {
    keyVisual: { type: String },
    primaryColor: { type: String },
    secondaryColor: { type: String },
    fontFamily: { type: String },
  },
  publicLink: { type: String }, // Se quitar el default
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Event", EventSchema);
