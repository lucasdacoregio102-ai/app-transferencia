import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Logs de monitoramento do status da conexão
redisConnection.on('connect', () => {
  console.log('⚡ Conexão com o Redis (Upstash) estabelecida com sucesso!');
});

redisConnection.on('error', (err) => {
  console.error('❌ Erro na conexão com o Redis:', err.message);
});