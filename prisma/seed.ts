import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.store.upsert({
    where: { id: 'store-default' },
    update: {},
    create: {
      id: 'store-default',
      name: 'CashierMu Demo Store',
      address: 'Jl. Merdeka No. 1, Jakarta',
      phone: '0812-3456-7890',
      email: 'demo@cashiermu.com',
      taxEnabled: true,
      taxRate: 0.11,
      currency: 'IDR',
      currencySymbol: 'Rp',
    },
  });

  const [branchPusat, branchCabang1] = await Promise.all([
    prisma.branch.upsert({
      where: { id: 'branch-pusat' },
      update: {},
      create: { id: 'branch-pusat', name: 'Pusat', address: 'Jl. Merdeka No. 1', phone: '0812-0001' },
    }),
    prisma.branch.upsert({
      where: { id: 'branch-cabang1' },
      update: {},
      create: { id: 'branch-cabang1', name: 'Cabang 1', address: 'Jl. Sudirman No. 5', phone: '0812-0002' },
    }),
  ]);

  const [ownerHash, cashierHash1, cashierHash2] = await Promise.all([
    bcrypt.hash('123456', 10),
    bcrypt.hash('111111', 10),
    bcrypt.hash('222222', 10),
  ]);

  await Promise.all([
    prisma.user.upsert({
      where: { email: 'budi@cashiermu.com' },
      update: {},
      create: { name: 'Budi Santoso', email: 'budi@cashiermu.com', phone: '081234567890', role: 'owner', pinHash: ownerHash, branchId: branchPusat.id },
    }),
    prisma.user.upsert({
      where: { email: 'siti@cashiermu.com' },
      update: {},
      create: { name: 'Siti Rahayu', email: 'siti@cashiermu.com', phone: '081234567891', role: 'cashier', pinHash: cashierHash1, branchId: branchPusat.id },
    }),
    prisma.user.upsert({
      where: { email: 'ahmad@cashiermu.com' },
      update: {},
      create: { name: 'Ahmad Fauzi', email: 'ahmad@cashiermu.com', phone: '081234567892', role: 'cashier', pinHash: cashierHash2, branchId: branchCabang1.id },
    }),
  ]);

  await Promise.all([
    prisma.category.upsert({ where: { id: 'cat-makanan' }, update: {}, create: { id: 'cat-makanan', name: 'Makanan', icon: 'utensils', color: '#f97316', sortOrder: 1 } }),
    prisma.category.upsert({ where: { id: 'cat-minuman' }, update: {}, create: { id: 'cat-minuman', name: 'Minuman', icon: 'coffee', color: '#3b82f6', sortOrder: 2 } }),
    prisma.category.upsert({ where: { id: 'cat-snack' }, update: {}, create: { id: 'cat-snack', name: 'Snack', icon: 'cookie', color: '#eab308', sortOrder: 3 } }),
    prisma.category.upsert({ where: { id: 'cat-rokok' }, update: {}, create: { id: 'cat-rokok', name: 'Rokok', icon: 'cigarette', color: '#6b7280', sortOrder: 4 } }),
    prisma.category.upsert({ where: { id: 'cat-lainnya' }, update: {}, create: { id: 'cat-lainnya', name: 'Lainnya', icon: 'package', color: '#8b5cf6', sortOrder: 5 } }),
  ]);

  await Promise.all([
    prisma.product.upsert({ where: { sku: 'MKN-001' }, update: {}, create: { name: 'Nasi Goreng', sku: 'MKN-001', categoryId: 'cat-makanan', buyPrice: 10000, sellPrice: 20000, stock: 50, minStock: 5, unit: 'porsi' } }),
    prisma.product.upsert({ where: { sku: 'MKN-002' }, update: {}, create: { name: 'Mie Goreng', sku: 'MKN-002', categoryId: 'cat-makanan', buyPrice: 9000, sellPrice: 18000, stock: 30, minStock: 5, unit: 'porsi' } }),
    prisma.product.upsert({ where: { sku: 'MKN-003' }, update: {}, create: { name: 'Ayam Bakar', sku: 'MKN-003', categoryId: 'cat-makanan', buyPrice: 20000, sellPrice: 35000, stock: 3, minStock: 5, unit: 'porsi' } }),
    prisma.product.upsert({ where: { sku: 'MNM-001' }, update: {}, create: { name: 'Es Teh', sku: 'MNM-001', categoryId: 'cat-minuman', buyPrice: 2000, sellPrice: 5000, stock: 100, minStock: 20, unit: 'gelas' } }),
    prisma.product.upsert({ where: { sku: 'MNM-002' }, update: {}, create: { name: 'Kopi Hitam', sku: 'MNM-002', categoryId: 'cat-minuman', buyPrice: 3000, sellPrice: 8000, stock: 80, minStock: 10, unit: 'gelas' } }),
    prisma.product.upsert({ where: { sku: 'MNM-003' }, update: {}, create: { name: 'Jus Jeruk', sku: 'MNM-003', categoryId: 'cat-minuman', buyPrice: 8000, sellPrice: 15000, stock: 0, minStock: 5, unit: 'gelas' } }),
    prisma.product.upsert({ where: { sku: 'SNK-001' }, update: {}, create: { name: 'Keripik Singkong', sku: 'SNK-001', categoryId: 'cat-snack', buyPrice: 5000, sellPrice: 10000, stock: 25, minStock: 10, unit: 'bungkus' } }),
    prisma.product.upsert({ where: { sku: 'SNK-002' }, update: {}, create: { name: 'Kacang Goreng', sku: 'SNK-002', categoryId: 'cat-snack', buyPrice: 6000, sellPrice: 12000, stock: 4, minStock: 5, unit: 'bungkus' } }),
    prisma.product.upsert({ where: { sku: 'RKK-001' }, update: {}, create: { name: 'Rokok Surya 16', sku: 'RKK-001', categoryId: 'cat-rokok', buyPrice: 22000, sellPrice: 25000, stock: 50, minStock: 10, unit: 'bungkus' } }),
    prisma.product.upsert({ where: { sku: 'LIN-001' }, update: {}, create: { name: 'Air Mineral 600ml', sku: 'LIN-001', categoryId: 'cat-lainnya', buyPrice: 2500, sellPrice: 4000, stock: 60, minStock: 20, unit: 'botol' } }),
  ]);

  console.log('✅ Seed complete!');
  console.log('');
  console.log('👤 Login credentials:');
  console.log('   Owner  → email: budi@cashiermu.com    PIN: 123456');
  console.log('   Kasir1 → email: siti@cashiermu.com    PIN: 111111');
  console.log('   Kasir2 → email: ahmad@cashiermu.com   PIN: 222222');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
