import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const paymentQueue = new Queue('payment-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Repete até 3 vezes em caso de falha de rede/RPC
    backoff: {
      type: 'exponential',
      delay: 2000, // Espera 2s, 4s, 8s entre tentativas
    },
    removeOnComplete: true, // Limpa da memória após sucesso
  },
});