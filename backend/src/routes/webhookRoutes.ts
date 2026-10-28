import { Router } from 'express';
import { handlePixWebhook } from '../controllers/webhookController.js';
import { verifyPixSignature } from '../middlewares/webhookAuth.js';

const router = Router();

// POST /webhooks/pix
router.post('/pix', verifyPixSignature, handlePixWebhook);

export default router;