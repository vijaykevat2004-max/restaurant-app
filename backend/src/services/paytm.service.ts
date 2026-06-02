import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';

const generateCheckSum = (params: Record<string, string>, merchantKey: string): string => {
  const sortedKeys = Object.keys(params).sort();
  let hashString = '';
  
  for (const key of sortedKeys) {
    if (params[key]) {
      hashString += `${key}=${params[key]}&`;
    }
  }
  
  hashString += `merchantKey=${merchantKey}`;
  return crypto.createHash('sha256').update(hashString).digest('hex');
};

const generateChecksum = (params: Record<string, string>, merchantKey: string): string => {
  const keys = Object.keys(params).sort();
  let paramStr = '';
  
  for (const key of keys) {
    if (params[key]) {
      paramStr += `${key}=${params[key]}&`;
    }
  }
  
  paramStr = paramStr.slice(0, -1);
  
  const hash = crypto.createHash('sha256');
  hash.update(paramStr + merchantKey);
  
  return hash.digest('hex');
};

export class PaytmService {
  static async createPayment(orderId: string, amount: number, customerEmail: string, customerMobile: string) {
    const mid = config.paytm?.mid;
    const merchantKey = config.paytm?.merchantKey;
    if (!mid || !merchantKey) {
      throw new Error('Paytm credentials not configured');
    }
    
    const isStaging = config.paytm?.env === 'staging';
    const callbackUrl = `${config.server.frontendUrl}/api/v1/payments/paytm-callback`;
    
    const params: Record<string, string> = {
      MID: mid,
      ORDER_ID: orderId,
      CUST_ID: customerEmail || 'customer@demo.com',
      MOBILE_NO: customerMobile || '7777777777',
      EMAIL: customerEmail || 'customer@demo.com',
      CHANNEL_ID: config.paytm?.channelId || 'WAP',
      TXN_AMOUNT: amount.toString(),
      WEBSITE: config.paytm?.website || 'WEBSTAGING',
      CALLBACK_URL: callbackUrl,
      INDUSTRY_TYPE_ID: 'Retail',
    };
    
    const checksum = generateChecksum(params, merchantKey);
    params['CHECKSUMHASH'] = checksum;
    
    const url = isStaging 
      ? 'https://securegw-stage.paytm.in/theia/api/v1/initiateTransaction'
      : 'https://securegw.paytm.in/theia/api/v1/initiateTransaction';
    
    return { url, params };
  }
  
  static verifyCallback(body: Record<string, string>): boolean {
    const merchantKey = config.paytm?.merchantKey;
    if (!merchantKey) return false;
    
    const paytmChecksum = body.CHECKSUMHASH;
    
    delete body.CHECKSUMHASH;
    
    const keys = Object.keys(body).sort();
    let paramStr = '';
    
    for (const key of keys) {
      if (body[key]) {
        paramStr += `${key}=${body[key]}&`;
      }
    }
    
    paramStr = paramStr.slice(0, -1);
    const hash = crypto.createHash('sha256');
    hash.update(paramStr + merchantKey);
    const calculatedChecksum = hash.digest('hex');
    
    return paytmChecksum === calculatedChecksum;
  }
  
  static async processCallback(body: Record<string, string>) {
    const { ORDERID, TXNID, STATUS, TXNAMOUNT } = body;
    
    if (STATUS === 'TXN_SUCCESS') {
      const order = await prisma.order.findFirst({
        where: { id: ORDERID },
      });
      
      if (order && order.paymentStatus !== 'COMPLETED') {
        await prisma.order.update({
          where: { id: ORDERID },
          data: {
            paymentStatus: 'COMPLETED',
            paymentId: TXNID,
            status: 'CONFIRMED',
          },
        });
        
        const wallet = await prisma.wallet.findUnique({
          where: { restaurantId: order.restaurantId },
        });
        
        if (wallet) {
          const amount = parseFloat(TXNAMOUNT);
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
              availableBalance: { increment: amount },
            },
          });
          
          await prisma.ledger.create({
            data: {
              walletId: wallet.id,
              restaurantId: order.restaurantId,
              type: 'CREDIT',
              amount,
              reference: TXNID,
              description: `Order #${order.orderNumber} payment`,
            },
          });
        }
        
        return { success: true, message: 'Payment processed' };
      }
    }
    
    return { success: false, message: 'Payment failed or already processed' };
  }
}