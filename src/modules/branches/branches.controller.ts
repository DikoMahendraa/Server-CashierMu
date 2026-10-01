import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { CreateBranchDto, UpdateBranchDto } from './branches.schema';

export const listBranches = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(branches);
  } catch (err) {
    next(err);
  }
};

export const createBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branch = await prisma.branch.create({ data: req.body as CreateBranchDto });
    res.status(201).json(branch);
  } catch (err) {
    next(err);
  }
};

export const updateBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params['id']);
    const branch = await prisma.branch.update({
      where: { id },
      data: req.body as UpdateBranchDto,
    });
    res.json(branch);
  } catch (err) {
    next(err);
  }
};

export const toggleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params['id']);
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) { res.status(404).json({ message: 'Branch not found' }); return; }
    const updated = await prisma.branch.update({
      where: { id },
      data: { isActive: !branch.isActive },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
