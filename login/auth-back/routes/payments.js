// auth-back/routes/payments.js (simplificado)
const express = require("express");
const Payment = require("../schema/payment");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const paymentData = req.body;
    const payment = new Payment(paymentData);
    await payment.save();
    // Lógica para interactuar con la pasarela de pago
    res.status(201).json({ statuscode: 201, body: payment });
  } catch (error) {
    res.status(500).json({ statuscode: 500, body: { error: error.message } });
  }
});

module.exports = router;
