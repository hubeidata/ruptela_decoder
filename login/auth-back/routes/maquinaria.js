import express from "express";
import Maquinaria from "../schema/maquinaria.js";
const router = express.Router();

// Crear
router.post("/", async (req, res) => {
  try {
    const maquinaria = await Maquinaria.create(req.body);
    res.status(201).json(maquinaria);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar todos
router.get("/", async (req, res) => {
  try {
    const maquinarias = await Maquinaria.findAll();
    res.json(maquinarias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modificar
router.put("/:id", async (req, res) => {
  try {
    const [updated] = await Maquinaria.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const maquinaria = await Maquinaria.findByPk(req.params.id);
      res.json(maquinaria);
    } else {
      res.status(404).json({ error: "Maquinaria no encontrada" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Maquinaria.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ message: "Maquinaria eliminada" });
    } else {
      res.status(404).json({ error: "Maquinaria no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;