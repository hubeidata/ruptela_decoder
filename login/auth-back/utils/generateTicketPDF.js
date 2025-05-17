// auth-back/utils/generateTicketPDF.js
const PDFDocument = require("pdfkit");

function generateTicketPDF(event, attendee, qrCodeDataUrl) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Encabezado: Título del evento
      doc
        .fontSize(24)
        .text(event.title, { align: "center" })
        .moveDown(0.5);

      // Detalles del evento
      doc
        .fontSize(12)
        .text(`Descripción: ${event.description || "Sin descripción"}`, {
          align: "center",
        });
      doc
        .text(
          `Inicio: ${new Date(event.startDate).toLocaleString()}    Fin: ${new Date(
            event.endDate
          ).toLocaleString()}`,
          { align: "center" }
        )
        .moveDown();

      // Datos del asistente
      doc.fontSize(14).text(`Nombre: ${attendee.name}`, { align: "center" });
      doc.fontSize(14).text(`Documento: ${attendee.document}`, { align: "center" });
      doc.moveDown();

      // Agregar imagen del QR Code, si se proporcionó
      if (qrCodeDataUrl) {
        // Convertir el dataURL a buffer (QRCODE es un PNG en dataURL)
        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
        const imgBuffer = Buffer.from(base64Data, "base64");
        doc.image(imgBuffer, { align: "center", width: 150 });
      }

      // Pie de página
      doc.moveDown().fontSize(10).text("Entrada digital válida para el evento. No reemitir.", {
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = generateTicketPDF;
