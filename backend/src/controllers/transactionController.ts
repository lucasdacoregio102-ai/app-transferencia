// backend/src/controllers/transactionController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTransactions = async (req: Request, res: Response) => {
  try {
    // Busca todas as transações, ordenando das mais recentes para as mais antigas
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Erro ao buscar histórico de transações:', error);
    res.status(500).json({ error: 'Erro interno ao buscar as transações.' });
  }
};