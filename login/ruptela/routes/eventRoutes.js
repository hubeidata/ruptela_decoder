import { Router } from 'express';
const router = Router();

router.post('/receive', (req, res) => {
  // Lógica para eventos
  res.json({ status: 'ok' });
});

export default router;