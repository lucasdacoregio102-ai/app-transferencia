import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { cpf: '12345678900' },
    update: {},
    create: {
      cpf: '12345678900',
      email: 'comprador@exemplo.com',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    },
  });

  console.log('✅ Usuário de teste cadastrado:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });