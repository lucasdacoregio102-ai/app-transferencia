import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const handleOfframpRequest = async (req: Request, res: Response) => {
  try {
    const { cpf, pixKey, pixKeyType, amount, burnTxHash } = req.body;

    console.log(`💸 Solicitação de Off-Ramp recebida - CPF: ${cpf} | Valor: R$ ${amount}`);

    // 1. Validação básica de campos obrigatórios
    if (!cpf || !pixKey || !amount || amount <= 0) {
      return res.status(400).json({
        error: 'Campos obrigatórios ausentes: cpf, pixKey, amount',
      });
    }

    // 2. Busca o usuário no PostgreSQL
    const user = await prisma.user.findUnique({
      where: { cpf },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado para o CPF informado' });
    }

    // 3. Simulação do Pix Out no parceiro BaaS (geração do EndToEndId)
    // Em produção, aqui seria feita a chamada HTTP para a API do banco (ex: Stark Bank, Celcoin, Ebanx)
    const pixOutEndToEnd = `E${Date.now()}${crypto.randomBytes(4).toString('hex')}`;

    console.log(`🔄 Pagamento Pix disparado via BaaS [E2E: ${pixOutEndToEnd}]`);

    // 4. Registra a transação de saída no PostgreSQL
    const transaction = await prisma.transaction.create({
      data: {
        type: 'PIX_OUT',
        status: 'COMPLETED',
        amount: Number(amount),
        pixEndToEnd: pixOutEndToEnd,
        onchainHash: burnTxHash || null,
      },
    });

    return res.status(200).json({
      success: true,
      transactionId: transaction.id,
      pixEndToEnd: pixOutEndToEnd,
      amount: amount,
      status: 'COMPLETED',
      message: 'Saque processado com sucesso e Pix enviado ao destinatário',
    });
  } catch (error) {
    console.error('❌ Erro ao processar solicitação de Off-Ramp:', error);
    return res.status(500).json({ error: 'Erro interno ao processar o saque Off-Ramp' });
  }
};