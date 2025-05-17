// auth-back/utils/generateQRCode.js
const QRCode = require("qrcode");

async function generateQRCode(data) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data);
    return qrCodeDataUrl;
  } catch (error) {
    throw error;
  }
}

module.exports = generateQRCode;
