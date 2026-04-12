import { prisma } from '../config/database.js';
import { LedgerType } from '../types/index.js';

export class WalletService {
  static async getWallet(restaurantId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { restaurantId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { restaurantId },
      });
    }

    return wallet;
  }

  static async getBalance(restaurantId: string) {
    const wallet = await this.getWallet(restaurantId);

    return {
      availableBalance: parseFloat(String(wallet.availableBalance)),
      pendingBalance: parseFloat(String(wallet.pendingBalance)),
      totalBalance: parseFloat(String(wallet.availableBalance)) + parseFloat(String(wallet.pendingBalance)),
    };
  }

  static async credit(
    restaurantId: string,
    amount: number,
    description: string,
    reference?: string,
    metadata?: Record<string, unknown>
  ) {
    const wallet = await this.getWallet(restaurantId);

    const transaction = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { increment: amount },
        },
      });

      const ledger = await tx.ledger.create({
        data: {
          walletId: wallet.id,
          restaurantId,
          type: 'CREDIT',
          amount,
          description,
          reference,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      return { wallet: updatedWallet, ledger };
    });

    return transaction;
  }

  static async debit(
    restaurantId: string,
    amount: number,
    description: string,
    reference?: string,
    metadata?: Record<string, unknown>
  ) {
    const wallet = await this.getWallet(restaurantId);

    const availableBalance = parseFloat(String(wallet.availableBalance));

    if (availableBalance < amount) {
      throw new Error('Insufficient balance');
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: amount },
        },
      });

      const ledger = await tx.ledger.create({
        data: {
          walletId: wallet.id,
          restaurantId,
          type: 'DEBIT',
          amount,
          description,
          reference,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      return { wallet: updatedWallet, ledger };
    });

    return transaction;
  }

  static async moveToPending(restaurantId: string, amount: number, reference: string) {
    const wallet = await this.getWallet(restaurantId);

    return prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: amount },
          pendingBalance: { increment: amount },
        },
      });

      await tx.ledger.create({
        data: {
          walletId: wallet.id,
          restaurantId,
          type: 'DEBIT',
          amount,
          description: 'Payment pending verification',
          reference,
        },
      });

      return updatedWallet;
    });
  }

  static async confirmPending(restaurantId: string, amount: number, reference: string) {
    const wallet = await this.getWallet(restaurantId);

    return prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          pendingBalance: { decrement: amount },
        },
      });

      await tx.ledger.create({
        data: {
          walletId: wallet.id,
          restaurantId,
          type: 'CREDIT',
          amount,
          description: 'Payment confirmed',
          reference,
        },
      });

      return updatedWallet;
    });
  }

  static async getTransactions(
    restaurantId: string,
    options: { page?: number; limit?: number; type?: LedgerType } = {}
  ) {
    const { page = 1, limit = 20, type } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { restaurantId };

    if (type) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      prisma.ledger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ledger.count({ where }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        ...t,
        amount: parseFloat(String(t.amount)),
        metadata: t.metadata ? JSON.parse(t.metadata) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
