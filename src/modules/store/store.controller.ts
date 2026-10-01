import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { UpdateStoreDto } from './store.schema';

export const getStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let store = await prisma.store.findFirst();
    if (!store) {
      store = await prisma.store.create({ data: { name: 'My Store' } });
    }
    res.json(store);
  } catch (err) {
    next(err);
  }
};

export const updateStore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body as UpdateStoreDto;
    let store = await prisma.store.findFirst();
    if (!store) {
      store = await prisma.store.create({ data: { name: 'My Store' } });
    }
    const updated = await prisma.store.update({ where: { id: store.id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
