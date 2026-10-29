// backend/src/routes/transactionRoutes.ts
import { Router } from 'express';
import { getTransactions } from '../controllers/transactionController.js';

const router = Router();

// Rota base será configurada como /api/transactions no server.ts
router.get('/', getTransactions);

export default router;