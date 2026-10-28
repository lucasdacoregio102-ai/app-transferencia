import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config();

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.RPC_URL || 'https://sepolia.base.org'),
});

// Chave privada de desenvolvimento (Account #0 padrão para testes)
const rawPrivateKey = process.env.RELAYER_PRIVATE_KEY && process.env.RELAYER_PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000'
  ? process.env.RELAYER_PRIVATE_KEY
  : '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const relayerAccount = privateKeyToAccount(rawPrivateKey as `0x${string}`);

export const walletClient = createWalletClient({
  account: relayerAccount,
  chain: baseSepolia,
  transport: http(process.env.RPC_URL || 'https://sepolia.base.org'),
});