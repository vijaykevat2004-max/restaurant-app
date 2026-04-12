import { prisma } from '../config/database.js';
import { WalletService } from './wallet.service.js';
import { PayoutStatus } from '../types/index.js';

export class PayoutService {
  static async createPayout(restaurantId: string, amount: number) {
    const wallet = await WalletService.getWallet(restaurantId);

    const availableBalance = parseFloat(String(wallet.availableBalance));

    if (availableBalance < amount) {
      throw new Error('Insufficient balance for payout');
    }

    if (amount < 100) {
      throw new Error('Minimum payout amount is 100');
    }

    const payout = await prisma.payout.create({
      data: {
        restaurantId,
        amount,
        status: 'PENDING',
      },
    });

    await WalletService.debit(
      restaurantId,
      amount,
      `Payout initiated - ${payout.id.slice(0, 8)}`,
      payout.id
    );

    return payout;
  }

  static async getPayout(payoutId: string, restaurantId: string) {
    const payout = await prisma.payout.findFirst({
      where: { id: payoutId, restaurantId },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    return {
      ...payout,
      amount: parseFloat(String(payout.amount)),
    };
  }

  static async getPayouts(
    restaurantId: string,
    options: { page?: number; limit?: number; status?: PayoutStatus } = {}
  ) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { restaurantId };

    if (status) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);

    return {
      payouts: payouts.map((p) => ({
        ...p,
        amount: parseFloat(String(p.amount)),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updatePayoutStatus(
    payoutId: string,
    status: PayoutStatus,
    razorpayId?: string,
    errorMessage?: string
  ) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    const data: Record<string, unknown> = { status };

    if (razorpayId) {
      data.razorpayId = razorpayId;
    }

    if (errorMessage) {
      data.errorMessage = errorMessage;
    }

    if (status === 'COMPLETED' || status === 'FAILED') {
      data.processedAt = new Date();
    }

    if (status === 'FAILED') {
      await WalletService.credit(
        payout.restaurantId,
        parseFloat(String(payout.amount)),
        `Payout failed - ${payout.id.slice(0, 8)}`,
        payout.id
      );
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data,
    });

    return {
      ...updatedPayout,
      amount: parseFloat(String(updatedPayout.amount)),
    };
  }
}
