import { Router } from 'express';
import { handleOfframpRequest } from '../controllers/offrampController.js';

const router = Router();

// POST /api/offramp
router.post('/offramp', handleOfframpRequest);

export default router;