import express from "express";
import Horario from "../schema/horario.js";
const router = express.Router();

// Crear
router.post("/", async (req, res) => {
  try {
    const horario = await Horario.create(req.body);
    res.status(201).json(horario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar todos
router.get("/", async (req, res) => {
  try {
    const horarios = await Horario.findAll();
    res.json(horarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modificar
router.put("/:id", async (req, res) => {
  try {
    const [updated] = await Horario.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const horario = await Horario.findByPk(req.params.id);
      res.json(horario);
    } else {
      res.status(404).json({ error: "Horario no encontrado" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Horario.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ message: "Horario eliminado" });
    } else {
      res.status(404).json({ error: "Horario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;