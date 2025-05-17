// auth-back/routes/attendees.js
const express = require("express");
const router = express.Router();
const Attendee = require("../schema/attendees");
const Event = require("../schema/event");
const generateQRCode = require("../utils/generateQRCode");
const generateTicketPDF = require("../utils/generateTicketPDF");
const sendTicketEmail = require("../utils/sendEmail");

// Verificar que las funciones se importaron correctamente
console.log("generateQRCode:", generateQRCode);
console.log("generateTicketPDF:", generateTicketPDF);
console.log("sendTicketEmail:", sendTicketEmail);

// Registrar un asistente a un evento
router.post("/:eventId/register", async (req, res) => {
  console.log("POST /api/attendees/" + req.params.eventId + "/register llamado");
  console.log("Datos recibidos en el body:", req.body);
  
  try {
    const { name, phone, email, document, additionalData } = req.body;
    
    // Validar campos obligatorios
    if (!name || !phone || !email || !document) {
      console.error("Error: Faltan campos obligatorios");
      return res.status(400).json({ statuscode: 400, body: { error: "Faltan campos obligatorios" } });
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Error: Correo electrónico inválido:", email);
      return res.status(400).json({ statuscode: 400, body: { error: "Correo electrónico inválido" } });
    }
    
    // Crear el registro del asistente
    const attendee = new Attendee({
      event: req.params.eventId,
      name,
      phone,
      email,
      document,
      additionalData,
    });
    console.log("Asistente creado:", attendee);
    console.log("attendee._id:", attendee._id);
    
    // Generar el QR code para el asistente
    const qrData = `event:${req.params.eventId}|attendee:${attendee._id}`;
    console.log("Generando QR Code con datos:", qrData);
    
    let qrCodeDataUrl;
    try {
      qrCodeDataUrl = await generateQRCode(qrData);
      console.log("QR Code generado:", qrCodeDataUrl ? "OK" : "No OK");
    } catch (qrError) {
      console.error("Error al generar el QR Code:", qrError);
      throw new Error("Fallo al generar el código QR");
    }
    attendee.qrCode = qrCodeDataUrl;
    
    // Guardar el asistente en la base de datos
    try {
      await attendee.save();
      console.log("Asistente guardado correctamente:", attendee);
    } catch (saveError) {
      console.error("Error al guardar el asistente:", saveError);
      throw new Error("Fallo al guardar el registro del asistente");
    }
    
    // Obtener los datos del evento
    let event;
    try {
      event = await Event.findById(req.params.eventId);
      if (!event) {
        console.error("Evento no encontrado para el ID:", req.params.eventId);
        return res.status(404).json({ statuscode: 404, body: { error: "Evento no encontrado" } });
      }
      console.log("Evento obtenido:", event);
    } catch (findError) {
      console.error("Error al obtener el evento:", findError);
      throw new Error("Fallo al obtener los datos del evento");
    }
    
    // Generar PDF del ticket
    let ticketPDFBuffer;
    try {
      console.log("Generando PDF del ticket...");
      ticketPDFBuffer = await generateTicketPDF(event, attendee, qrCodeDataUrl);
      console.log("PDF generado, tamaño:", ticketPDFBuffer.length, "bytes");
    } catch (pdfError) {
      console.error("Error al generar el PDF del ticket:", pdfError);
      throw new Error("Fallo al generar el PDF del ticket");
    }
    
    // Enviar el ticket por correo electrónico
    try {
      const subject = `Tu entrada para: ${event.title}`;
      const text = `Hola ${name},\nAdjunto encontrarás tu entrada digital para el evento: ${event.title}. Presenta este PDF junto con el código QR en la entrada.`;
      console.log("Enviando correo a:", email);
      await sendTicketEmail(email, subject, text, ticketPDFBuffer);
      console.log("Correo enviado correctamente.");
    } catch (mailError) {
      console.error("Error al enviar el correo:", mailError);
      throw new Error("Fallo al enviar el correo electrónico");
    }
    
    res.status(201).json({
      statuscode: 201,
      body: { message: "Registro completado, se ha enviado tu entrada por correo.", attendee },
    });
  } catch (error) {
    console.error("Error en registro de asistente:", error);
    res.status(500).json({ statuscode: 500, body: { error: error.message } });
  }
});

module.exports = router;
