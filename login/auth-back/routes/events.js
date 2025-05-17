const express = require("express");
const router = express.Router();
const Event = require("../schema/event");

// Crear un nuevo evento
router.post("/", async (req, res) => {
  console.log("POST /api/events llamado");
  console.log("Cuerpo de la petición:", req.body);
  console.log("Usuario (req.user):", req.user);

  try {
    if (!req.user) {
      console.error("Usuario no autenticado");
      return res.status(401).json({ statuscode: 401, body: { error: "Usuario no autenticado" } });
    }
    const eventData = req.body;
    eventData.createdBy = req.user.id;
    // Cargar nanoid de forma dinámica
    const { nanoid } = await import("nanoid");
    eventData.publicLink = nanoid(8);
    const event = new Event(eventData);
    await event.save();
    console.log("Evento guardado:", event);
    res.status(201).json({
      statuscode: 201,
      body: { message: `Evento creado: ${event.title}`, event },
    });
  } catch (error) {
    console.error("Error en POST /api/events:", error);
    res.status(500).json({ statuscode: 500, body: { error: error.message } });
  }
});

// *** Agregar esta ruta para listar eventos ***
router.get("/", async (req, res) => {
  console.log("GET /api/events llamado");
  console.log("Usuario (req.user):", req.user);
  try {
    const events = await Event.find({ createdBy: req.user.id }).sort({ startDate: 1 });
    console.log("Eventos encontrados:", events);
    res.json({ statuscode: 200, body: events });
  } catch (error) {
    console.error("Error en GET /api/events:", error);
    res.status(500).json({ statuscode: 500, body: { error: error.message } });
  }
});

// Obtener un evento por ID
router.get("/:id", async (req, res) => {
  console.log(`GET /api/events/${req.params.id} llamado`);
  console.log("Usuario (req.user):", req.user);
  try {
    const event = await Event.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!event) {
      console.error("Evento no encontrado");
      return res.status(404).json({ statuscode: 404, body: { error: "Evento no encontrado" } });
    }
    console.log("Evento encontrado:", event);
    res.json({ statuscode: 200, body: event });
  } catch (error) {
    console.error("Error en GET /api/events/:id:", error);
    res.status(500).json({ statuscode: 500, body: { error: error.message } });
  }
});

// Actualizar un evento
router.put("/:id", async (req, res) => {
  console.log(`PUT /api/events/${req.params.id} llamado`);
  console.log("Cuerpo de la petición:", req.body);
  console.log("Usuario (req.user):", req.user);
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true }
    );
    if (!event) {
      console.error("Evento no encontrado para actualizar");
      return res.status(404).json({ statuscode: 404, body: { error: "Evento no encontrado" } });
    }
    console.log("Evento actualizado:", event);
    res.json({ statuscode: 200, body: { message: `Evento actualizado: ${event.title}`, event } });
  } catch (error) {
    console.error("Error en PUT /api/events:", error);
    res.status(500).json({ statuscode: 500, body: { error: error.message } });
  }
});

// Eliminar un evento (solo si la fecha de fin es posterior a la fecha actual)
router.delete("/:id", async (req, res) => {
  console.log(`DELETE /api/events/${req.params.id} llamado`);
  console.log("Usuario (req.user):", req.user);
  try {
    const event = await Event.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!event) {
      console.error("Evento no encontrado para eliminar");
      return res.status(404).json({ statuscode: 404, body: { error: "Evento no encontrado" } });
    }
    if (new Date(event.endDate) <= new Date()) {
      console.error("Intento de eliminar un evento finalizado");
      return res.status(400).json({
        statuscode: 400,
        body: { error: "No se pueden eliminar eventos que ya han finalizado" },
      });
    }
    await Event.findByIdAndDelete(req.params.id);
    console.log("Evento eliminado:", req.params.id);
    res.json({ statuscode: 200, body: { message: "Evento eliminado" } });
  } catch (error) {
    console.error("Error en DELETE /api/events:", error);
    res.status(500).json({ statuscode: 500, body: { error: error.message } });
  }
});

module.exports = router;
