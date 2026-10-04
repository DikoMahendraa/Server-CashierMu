import prisma from '../config/database';

export async function generateInvoiceNumber(storeId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${dateStr}-`;

  // Find the highest existing invoice number with today's prefix.
  // Using MAX via findFirst+orderBy is immune to the count+1 race: even if previous
  // inserts rolled back, their invoice numbers were never committed, so they won't
  // appear here. Retrying on P2002 handles the rare concurrent-insert race.
  const last = await prisma.transaction.findFirst({
    where: {
      storeId,
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let seq = 1;
  if (last) {
    const lastSeq = parseInt(last.invoiceNumber.slice(prefix.length), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}
