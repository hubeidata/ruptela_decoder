const log = require("../lib/trace");
const validateToken = require("./validateToken");
const { verifyAccessToken } = require("./verify");

function authenticateToken(req, res, next) {
  log.info("Iniciando middleware authenticateToken");
  log.info("Headers recibidos:", req.headers);

  let token = null;
  try {
    token = validateToken(req.headers);
    log.info("Token extraído:", token);
  } catch (error) {
    log.error("Error en validateToken:", error.message);
    if (error.message === "Token not provided") {
      return res.status(401).json({ error: "Token no proporcionado" });
    }
    if (error.message === "Token format invalid") {
      return res.status(401).json({ error: "Token mal formado" });
    }
  }

  try {
    const decoded = verifyAccessToken(token);
    log.info("Decoded token:", decoded);
    req.user = decoded.user || decoded;
    next();
  } catch (err) {
    log.error("Error en verifyAccessToken, token:", token, "Error:", err);
    return res.status(403).json({ error: "Token inválido" });
  }
}

module.exports = authenticateToken;
