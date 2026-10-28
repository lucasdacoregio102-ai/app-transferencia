import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webhookRoutes from './routes/webhookRoutes.js';
import offrampRoutes from './routes/offrampRoutes.js';
import { serverAdapter } from './config/bullBoard.js';
import { basicAuth } from './middlewares/authMiddleware.js';
import './workers/paymentWorker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota do Bull-Board protegida por Basic Auth
app.use('/admin/queues', basicAuth, serverAdapter.getRouter());

// Rotas públicas da aplicação
app.use('/webhooks', webhookRoutes);
app.use('/api', offrampRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🔒 Painel protegido disponível em: http://localhost:${PORT}/admin/queues`);
});