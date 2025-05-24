const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const authenticateToken = require("./auth/authenticateToken");
const log = require("./lib/trace");
require("dotenv").config();

app.use(express.json({ limit: "10mb" }));

// Configurar CORS una sola vez
const corsOptions = {
  origin: [process.env.FRONTEND_ORIGIN,process.env.FRONTEND_ORIGIN_2],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

const port = process.env.PORT || 3000;

async function main() {
  await mongoose.connect(process.env.DB_CONNECTION_STRING);
  console.log("Conectado a la base de datos");
}
main().catch((err) => console.log(err));

// Rutas públicas
app.use("/api/signup", require("./routes/signup"));
app.use("/api/login", require("./routes/login"));
app.use("/api/signout", require("./routes/logout"));
app.use("/api/refresh-token", require("./routes/refreshToken"));
app.use("/api/public/events", require("./routes/publicEvents"));
app.use("/api/attendees", require("./routes/attendees"));


// Montar el middleware de autenticación para las rutas protegidas
app.use(authenticateToken);

// Rutas protegidas (ahora req.user estará definido)
app.use("/api/events", require("./routes/events"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/user", require("./routes/user"));


app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});

module.exports = app;
