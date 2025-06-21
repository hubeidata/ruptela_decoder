import express from "express";
import Personal from "../schema/personal.js";
const router = express.Router();

// Crear
router.post("/", async (req, res) => {
  try {
    const personal = await Personal.create(req.body);
    res.status(201).json(personal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar todos
router.get("/", async (req, res) => {
  try {
    const personales = await Personal.findAll();
    res.json(personales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modificar
router.put("/:id", async (req, res) => {
  try {
    const [updated] = await Personal.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const personal = await Personal.findByPk(req.params.id);
      res.json(personal);
    } else {
      res.status(404).json({ error: "Personal no encontrado" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Personal.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ message: "Personal eliminado" });
    } else {
      res.status(404).json({ error: "Personal no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;