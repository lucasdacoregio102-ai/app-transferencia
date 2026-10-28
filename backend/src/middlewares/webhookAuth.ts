import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const verifyPixSignature = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['x-baas-signature'] as string;
  const secret = process.env.BAAS_WEBHOOK_SECRET;

  // Em ambiente local/desenvolvimento, libera a requisição de teste se não houver assinatura HMAC
  if (process.env.NODE_ENV !== 'production' && !signature) {
    console.warn('⚠️ Modo Dev: Ignorando validação HMAC para teste local do Webhook.');
    return next();
  }

  if (!signature || !secret) {
    return res.status(401).json({ error: 'Assinatura HMAC ausente ou secreta não configurada' });
  }

  const computedHash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== computedHash) {
    return res.status(403).json({ error: 'Assinatura do webhook inválida' });
  }

  next();
};