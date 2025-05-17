const express = require("express");
const router = express.Router();
const Event = require("../schema/event");

router.get("/:publicLink", async (req, res) => {
  console.log(`GET /api/public/events/${req.params.publicLink} llamado`);
  console.log("Headers recibidos:", req.headers);

  try {
    const event = await Event.findOne({ publicLink: req.params.publicLink });

    if (!event) {
      console.error("Evento no encontrado para el publicLink:", req.params.publicLink);
      return res.status(404).json({ statuscode: 404, body: { error: "Evento no encontrado" } });
    }

    console.log("Evento encontrado:", event);
    res.json({ statuscode: 200, body: event });
  } catch (error) {
    console.error("Error en GET /api/public/events/:publicLink:", error);
    res.status(500).json({ statuscode: 500, body: { error: error.message } });
  }
});

module.exports = router;
