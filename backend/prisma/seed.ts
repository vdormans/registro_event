import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const correo = process.env.SEED_ADMIN_EMAIL ?? 'admin@empresa.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';
  const nombre = process.env.SEED_ADMIN_NOMBRE ?? 'Administrador Principal';
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);

  const existing = await prisma.usuario.findUnique({ where: { correo } });
  if (existing) {
    console.log(`⚠️  El administrador ${correo} ya existe. Seed omitido.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);

  await prisma.usuario.create({
    data: { nombre, correo, passwordHash, rol: 'ADMIN' },
  });

  console.log(`✅ Administrador creado: ${correo}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
