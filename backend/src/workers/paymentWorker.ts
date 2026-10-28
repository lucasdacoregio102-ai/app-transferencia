import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { PrismaClient } from '@prisma/client';
import { parseUnits } from 'viem';
import { walletClient, publicClient } from '../config/viem.js';
import { pixEscrowABI } from '../config/abi.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const paymentWorker = new Worker(
  'payment-processing',
  async (job: Job) => {
    console.log(`⚙️ Processando job ID ${job.id} [Tipo: ${job.name}]`);

    // --------- PROCESSAMENTO DE ON-RAMP ---------
    if (job.name === 'process-onramp') {
      const { endToEndId, valor, cpfPayer } = job.data;

      const user = await prisma.user.findUnique({ where: { cpf: cpfPayer } });
      if (!user) throw new Error(`Usuário não encontrado para CPF: ${cpfPayer}`);

      const amountInUSDC = parseUnits(valor.toString(), 6);
      const contractAddress = process.env.PIX_ESCROW_CONTRACT_ADDRESS as `0x${string}`;

      // 1. Envia transação para o Smart Contract via Viem
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: pixEscrowABI,
        functionName: 'createEscrow',
        args: [endToEndId, user.walletAddress as `0x${string}`, amountInUSDC],
      });

      // 2. Aguarda a confirmação da transação na blockchain
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      // 3. Registra a transação no banco PostgreSQL
      await prisma.transaction.create({
        data: {
          type: 'PIX_IN',
          status: 'COMPLETED',
          amount: valor,
          pixEndToEnd: endToEndId,
          onchainHash: txHash,
        },
      });

      console.log(`✅ Job On-Ramp concluído! Bloco: ${receipt.blockNumber} | Hash: ${txHash}`);
    }

    // --------- PROCESSAMENTO DE OFF-RAMP ---------
    if (job.name === 'process-offramp') {
      const { amount, burnTxHash } = job.data;
      const pixOutEndToEnd = `E${Date.now()}${crypto.randomBytes(4).toString('hex')}`;

      await prisma.transaction.create({
        data: {
          type: 'PIX_OUT',
          status: 'COMPLETED',
          amount: Number(amount),
          pixEndToEnd: pixOutEndToEnd,
          onchainHash: burnTxHash || null,
        },
      });

      console.log(`✅ Job Off-Ramp concluído! Pix Out EndToEnd: ${pixOutEndToEnd}`);
    }
  },
  { connection: redisConnection }
);

paymentWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} falhou: ${err.message}`);
});