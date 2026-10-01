import prisma from '../config/database';

export async function generateInvoiceNumber(branchId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const count = await prisma.transaction.count({
    where: {
      branchId,
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
  });

  const seq = String(count + 1).padStart(4, '0');
  return `INV-${dateStr}-${seq}`;
}
