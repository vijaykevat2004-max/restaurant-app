import { prisma } from '../config/database.js';

export class RestaurantService {
  static async getRestaurant(restaurantId: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        branches: true,
        _count: {
          select: { users: true, orders: true },
        },
      },
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    return restaurant;
  }

  static async updateRestaurant(
    restaurantId: string,
    data: { name?: string; razorpayId?: string }
  ) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data,
    });

    return updated;
  }

  static async createBranch(restaurantId: string, name: string, address?: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const branch = await prisma.branch.create({
      data: {
        restaurantId,
        name,
        address,
      },
    });

    return branch;
  }

  static async getBranches(restaurantId: string) {
    const branches = await prisma.branch.findMany({
      where: { restaurantId },
      include: {
        _count: {
          select: { orders: true, users: true },
        },
      },
    });

    return branches;
  }

  static async updateBranch(
    branchId: string,
    restaurantId: string,
    data: { name?: string; address?: string }
  ) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, restaurantId },
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    const updated = await prisma.branch.update({
      where: { id: branchId },
      data,
    });

    return updated;
  }

  static async deleteBranch(branchId: string, restaurantId: string) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, restaurantId },
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    const activeOrders = await prisma.order.count({
      where: {
        branchId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    if (activeOrders > 0) {
      throw new Error('Cannot delete branch with active orders');
    }

    await prisma.branch.delete({
      where: { id: branchId },
    });
  }

  static async getUsers(restaurantId: string) {
    const users = await prisma.user.findMany({
      where: { restaurantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        branch: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    return users;
  }

  static async createUser(
    restaurantId: string,
    data: {
      email: string;
      password: string;
      name: string;
      role: string;
      branchId?: string;
    }
  ) {
    const { AuthService } = await import('./auth.service.js');

    const user = await AuthService.register(
      data.email,
      data.password,
      data.name,
      restaurantId,
      data.role,
      data.branchId
    );

    return user;
  }

  static async updateUser(
    userId: string,
    restaurantId: string,
    data: { name?: string; role?: string; branchId?: string }
  ) {
    const user = await prisma.user.findFirst({
      where: { id: userId, restaurantId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.branchId !== undefined) updateData.branchId = data.branchId;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        createdAt: true,
      },
    });

    return updated;
  }

  static async deleteUser(userId: string, restaurantId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, restaurantId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'OWNER') {
      throw new Error('Cannot delete owner account');
    }

    await prisma.user.delete({
      where: { id: userId },
    });
  }
}
