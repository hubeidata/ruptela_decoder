import { Router } from 'express';
import { handleGpsData } from '../controller/gpsController.js';
const router = Router();

router.post('/data', handleGpsData);

export default router;