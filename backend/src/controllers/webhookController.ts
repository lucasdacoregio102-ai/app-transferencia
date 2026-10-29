import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { paymentQueue } from '../queues/paymentQueue.js';

const prisma = new PrismaClient();

export const handlePixWebhook = async (req: Request, res: Response) => {
  try {
    const { endToEndId, valor, cpfPayer, status } = req.body;

    if (status !== 'CONCLUIDO') {
      return res.status(200).json({ message: 'Evento ignorado' });
    }

    const user = await prisma.user.findUnique({ where: { cpf: cpfPayer } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado para este CPF' });
    }

// Adiciona a tarefa na fila do BullMQ com retenção de histórico para o Bull-Board
await paymentQueue.add(
  'process-onramp',
  {
    endToEndId,
    valor,
    cpfPayer,
  },
  {
    removeOnComplete: {
      count: 100, // Mantém os últimos 100 jobs concluídos visíveis no painel
    },
    removeOnFail: {
      count: 100, // Mantém os últimos 100 jobs com falha no painel
    },
  }
);
    console.log(`📥 Webhook recebido e enfileirado para o E2E: ${endToEndId}`);

    // Resposta imediata HTTP 202 (Accepted)
    return res.status(202).json({
      success: true,
      message: 'Transação recebida e enviada para processamento em segundo plano',
    });
  } catch (error) {
    console.error('❌ Erro ao enfileirar transação:', error);
    return res.status(500).json({ error: 'Erro interno ao processar a fila de mensagens' });
  }
};