import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.schema';

export const listCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await prisma.category.create({ data: req.body as CreateCategoryDto });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params['id']);
    const category = await prisma.category.update({
      where: { id },
      data: req.body as UpdateCategoryDto,
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params['id']);
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      res.status(400).json({ message: 'Cannot delete category with linked products' });
      return;
    }
    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
