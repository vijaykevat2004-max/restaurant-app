import { prisma } from '../config/database.js';

export class MenuService {
  static async getCategories(restaurantId: string) {
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
    });

    return categories;
  }

  static async createCategory(restaurantId: string, name: string, sortOrder?: number) {
    const category = await prisma.menuCategory.create({
      data: {
        restaurantId,
        name,
        sortOrder: sortOrder || 0,
      },
    });

    return category;
  }

  static async updateCategory(categoryId: string, restaurantId: string, data: { name?: string; sortOrder?: number }) {
    const category = await prisma.menuCategory.findFirst({
      where: { id: categoryId, restaurantId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const updated = await prisma.menuCategory.update({
      where: { id: categoryId },
      data,
    });

    return updated;
  }

  static async deleteCategory(categoryId: string, restaurantId: string) {
    const category = await prisma.menuCategory.findFirst({
      where: { id: categoryId, restaurantId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const itemsCount = await prisma.menuItem.count({
      where: { categoryId },
    });

    if (itemsCount > 0) {
      throw new Error('Cannot delete category with items');
    }

    await prisma.menuCategory.delete({
      where: { id: categoryId },
    });
  }

  static async getItems(restaurantId: string, categoryId?: string) {
    const where: Record<string, unknown> = {
      category: { restaurantId },
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item) => ({
      ...item,
      price: parseFloat(String(item.price)),
      modifiers: item.modifiers ? JSON.parse(item.modifiers) : null,
    }));
  }

  static async getMenu(restaurantId: string) {
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return categories.map((category) => ({
      ...category,
      items: category.items.map((item) => ({
        ...item,
        price: parseFloat(String(item.price)),
        modifiers: item.modifiers ? JSON.parse(item.modifiers) : null,
      })),
    }));
  }

  static async createItem(
    restaurantId: string,
    categoryId: string,
    data: {
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      isAvailable?: boolean;
      modifiers?: { name: string; price: number }[];
    }
  ) {
    const category = await prisma.menuCategory.findFirst({
      where: { id: categoryId, restaurantId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const item = await prisma.menuItem.create({
      data: {
        categoryId,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        isAvailable: data.isAvailable ?? true,
        modifiers: data.modifiers ? JSON.stringify(data.modifiers) : null,
      },
    });

    return {
      ...item,
      price: parseFloat(String(item.price)),
      modifiers: item.modifiers ? JSON.parse(item.modifiers) : null,
    };
  }

  static async updateItem(
    itemId: string,
    restaurantId: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      isAvailable?: boolean;
      modifiers?: { name: string; price: number }[];
    }
  ) {
    const item = await prisma.menuItem.findFirst({
      where: { id: itemId },
      include: { category: true },
    });

    if (!item || item.category.restaurantId !== restaurantId) {
      throw new Error('Item not found');
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.modifiers !== undefined) updateData.modifiers = JSON.stringify(data.modifiers);

    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return {
      ...updated,
      price: parseFloat(String(updated.price)),
      modifiers: updated.modifiers ? JSON.parse(updated.modifiers) : null,
    };
  }

  static async deleteItem(itemId: string, restaurantId: string) {
    const item = await prisma.menuItem.findFirst({
      where: { id: itemId },
      include: { category: true },
    });

    if (!item || item.category.restaurantId !== restaurantId) {
      throw new Error('Item not found');
    }

    await prisma.menuItem.delete({
      where: { id: itemId },
    });
  }
}
