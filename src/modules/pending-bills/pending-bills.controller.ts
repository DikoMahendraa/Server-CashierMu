import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { CreatePendingBillDto, UpdatePendingBillDto } from './pending-bills.schema';

export const listPendingBills = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branchId = typeof req.query['branchId'] === 'string' ? req.query['branchId'] : undefined;
    const bills = await prisma.pendingBill.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { savedAt: 'desc' },
    });
    res.json(bills);
  } catch (err) {
    next(err);
  }
};

export const createPendingBill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body as CreatePendingBillDto;
    const bill = await prisma.pendingBill.create({
      data: { ...data, userId: req.user!.userId },
    });
    res.status(201).json(bill);
  } catch (err) {
    next(err);
  }
};

export const updatePendingBill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params['id']);
    const bill = await prisma.pendingBill.update({
      where: { id },
      data: req.body as UpdatePendingBillDto,
    });
    res.json(bill);
  } catch (err) {
    next(err);
  }
};

export const deletePendingBill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params['id']);
    await prisma.pendingBill.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
