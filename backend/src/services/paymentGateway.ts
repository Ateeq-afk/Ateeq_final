import { log } from '../utils/logger';

/**
 * Payment Gateway Service for Online Payments
 * Supports multiple payment providers: Razorpay, Stripe, PayU, etc.
 */

export interface PaymentGatewayProvider {
  createOrder(orderData: PaymentOrderData): Promise<PaymentOrderResult>;
  verifyPayment(paymentData: PaymentVerificationData): Promise<PaymentVerificationResult>;
  createRefund(refundData: RefundData): Promise<RefundResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatusResult>;
}

export interface PaymentOrderData {
  amount: number; // Amount in smallest currency unit (paise for INR)
  currency: string;
  orderId: string;
  description: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  bookingInfo: {
    bookingId: string;
    lrNumber: string;
    branch: string;
  };
  callbackUrl?: string;
  webhookUrl?: string;
}

export interface PaymentOrderResult {
  success: boolean;
  orderId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  paymentUrl?: string; // For redirect-based payments
  clientSecret?: string; // For client-side payments
  qrCode?: string; // For UPI QR payments
  error?: string;
  provider: string;
}

export interface PaymentVerificationData {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature?: string;
  status: string;
  amount: number;
}

export interface PaymentVerificationResult {
  success: boolean;
  verified: boolean;
  paymentId: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  fee?: number;
  tax?: number;
  error?: string;
  provider: string;
}

export interface RefundData {
  paymentId: string;
  amount: number;
  reason: string;
  notes?: Record<string, string>;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: 'processed' | 'pending' | 'failed';
  error?: string;
  provider: string;
}

export interface PaymentStatusResult {
  success: boolean;
  paymentId: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  amount: number;
  currency: string;
  createdAt: string;
  error?: string;
  provider: string;
}

/**
 * Razorpay Payment Gateway Provider
 */
class RazorpayProvider implements PaymentGatewayProvider {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentOrderResult> {
    try {
      if (!this.keyId || !this.keySecret) {
        throw new Error('Razorpay credentials not configured');
      }

      // Simulate Razorpay order creation
      const razorpayOrder = {
        id: `order_${Date.now()}`,
        entity: 'order',
        amount: orderData.amount,
        amount_paid: 0,
        amount_due: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.orderId,
        offer_id: null,
        status: 'created',
        attempts: 0,
        notes: {
          booking_id: orderData.bookingInfo.bookingId,
          lr_number: orderData.bookingInfo.lrNumber,
          branch: orderData.bookingInfo.branch
        },
        created_at: Math.floor(Date.now() / 1000)
      };

      log.info('Razorpay order created', {
        orderId: orderData.orderId,
        gatewayOrderId: razorpayOrder.id,
        amount: orderData.amount
      });

      return {
        success: true,
        orderId: orderData.orderId,
        gatewayOrderId: razorpayOrder.id,
        amount: orderData.amount,
        currency: orderData.currency,
        provider: 'razorpay'
      };
    } catch (error) {
      return {
        success: false,
        orderId: orderData.orderId,
        gatewayOrderId: '',
        amount: orderData.amount,
        currency: orderData.currency,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'razorpay'
      };
    }
  }

  async verifyPayment(paymentData: PaymentVerificationData): Promise<PaymentVerificationResult> {
    try {
      // Simulate payment verification
      // In real implementation, verify signature using Razorpay's crypto validation
      
      log.info('Verifying Razorpay payment', {
        gatewayOrderId: paymentData.gatewayOrderId,
        gatewayPaymentId: paymentData.gatewayPaymentId
      });

      // Mock verification - in production, use actual Razorpay signature verification
      const isSignatureValid = true; // crypto.createHmac('sha256', this.keySecret)...

      return {
        success: true,
        verified: isSignatureValid,
        paymentId: paymentData.gatewayPaymentId,
        amount: paymentData.amount,
        status: isSignatureValid ? 'success' : 'failed',
        fee: Math.round(paymentData.amount * 0.025), // 2.5% gateway fee
        tax: Math.round(paymentData.amount * 0.0045), // 18% GST on fee
        provider: 'razorpay'
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        paymentId: paymentData.gatewayPaymentId,
        amount: paymentData.amount,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Verification failed',
        provider: 'razorpay'
      };
    }
  }

  async createRefund(refundData: RefundData): Promise<RefundResult> {
    try {
      // Simulate refund creation
      const refundId = `rfnd_${Date.now()}`;
      
      log.info('Creating Razorpay refund', {
        paymentId: refundData.paymentId,
        amount: refundData.amount,
        refundId
      });

      return {
        success: true,
        refundId,
        amount: refundData.amount,
        status: 'processed',
        provider: 'razorpay'
      };
    } catch (error) {
      return {
        success: false,
        refundId: '',
        amount: refundData.amount,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Refund failed',
        provider: 'razorpay'
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    try {
      // Simulate payment status check
      return {
        success: true,
        paymentId,
        status: 'captured',
        amount: 100000, // Mock amount
        currency: 'INR',
        createdAt: new Date().toISOString(),
        provider: 'razorpay'
      };
    } catch (error) {
      return {
        success: false,
        paymentId,
        status: 'failed',
        amount: 0,
        currency: 'INR',
        createdAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Status check failed',
        provider: 'razorpay'
      };
    }
  }
}

/**
 * Stripe Payment Gateway Provider (for international payments)
 */
class StripeProvider implements PaymentGatewayProvider {
  private secretKey: string;
  private publishableKey: string;
  private webhookSecret: string;

  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY || '';
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentOrderResult> {
    try {
      if (!this.secretKey) {
        throw new Error('Stripe credentials not configured');
      }

      // Simulate Stripe PaymentIntent creation
      const paymentIntent = {
        id: `pi_${Date.now()}`,
        object: 'payment_intent',
        amount: orderData.amount,
        currency: orderData.currency.toLowerCase(),
        status: 'requires_payment_method',
        client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`
      };

      log.info('Stripe payment intent created', {
        orderId: orderData.orderId,
        gatewayOrderId: paymentIntent.id,
        amount: orderData.amount
      });

      return {
        success: true,
        orderId: orderData.orderId,
        gatewayOrderId: paymentIntent.id,
        amount: orderData.amount,
        currency: orderData.currency,
        clientSecret: paymentIntent.client_secret,
        provider: 'stripe'
      };
    } catch (error) {
      return {
        success: false,
        orderId: orderData.orderId,
        gatewayOrderId: '',
        amount: orderData.amount,
        currency: orderData.currency,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'stripe'
      };
    }
  }

  async verifyPayment(paymentData: PaymentVerificationData): Promise<PaymentVerificationResult> {
    try {
      // Simulate Stripe payment verification
      log.info('Verifying Stripe payment', {
        gatewayPaymentId: paymentData.gatewayPaymentId
      });

      return {
        success: true,
        verified: true,
        paymentId: paymentData.gatewayPaymentId,
        amount: paymentData.amount,
        status: 'success',
        fee: Math.round(paymentData.amount * 0.029 + 30), // Stripe fee: 2.9% + ₹30
        provider: 'stripe'
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        paymentId: paymentData.gatewayPaymentId,
        amount: paymentData.amount,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Verification failed',
        provider: 'stripe'
      };
    }
  }

  async createRefund(refundData: RefundData): Promise<RefundResult> {
    try {
      const refundId = `re_${Date.now()}`;
      
      return {
        success: true,
        refundId,
        amount: refundData.amount,
        status: 'processed',
        provider: 'stripe'
      };
    } catch (error) {
      return {
        success: false,
        refundId: '',
        amount: refundData.amount,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Refund failed',
        provider: 'stripe'
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    try {
      return {
        success: true,
        paymentId,
        status: 'captured',
        amount: 100000,
        currency: 'INR',
        createdAt: new Date().toISOString(),
        provider: 'stripe'
      };
    } catch (error) {
      return {
        success: false,
        paymentId,
        status: 'failed',
        amount: 0,
        currency: 'INR',
        createdAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Status check failed',
        provider: 'stripe'
      };
    }
  }
}

/**
 * Main Payment Gateway Service
 */
class PaymentGatewayService {
  private providers: Map<string, PaymentGatewayProvider> = new Map();
  private defaultProvider: string;

  constructor() {
    this.initializeProviders();
    this.defaultProvider = process.env.DEFAULT_PAYMENT_PROVIDER || 'razorpay';
  }

  private initializeProviders() {
    this.providers.set('razorpay', new RazorpayProvider());
    this.providers.set('stripe', new StripeProvider());

    log.info('Payment gateway providers initialized', {
      providers: Array.from(this.providers.keys()),
      defaultProvider: this.defaultProvider
    });
  }

  /**
   * Create payment order
   */
  async createPaymentOrder(
    orderData: PaymentOrderData,
    preferredProvider?: string
  ): Promise<PaymentOrderResult> {
    const provider = this.getProvider(preferredProvider);
    
    if (!provider) {
      throw new Error(`Payment provider ${preferredProvider || this.defaultProvider} not found`);
    }

    return await provider.createOrder(orderData);
  }

  /**
   * Verify payment
   */
  async verifyPayment(
    paymentData: PaymentVerificationData,
    provider?: string
  ): Promise<PaymentVerificationResult> {
    const gatewayProvider = this.getProvider(provider);
    
    if (!gatewayProvider) {
      throw new Error(`Payment provider ${provider || this.defaultProvider} not found`);
    }

    return await gatewayProvider.verifyPayment(paymentData);
  }

  /**
   * Create refund
   */
  async createRefund(
    refundData: RefundData,
    provider?: string
  ): Promise<RefundResult> {
    const gatewayProvider = this.getProvider(provider);
    
    if (!gatewayProvider) {
      throw new Error(`Payment provider ${provider || this.defaultProvider} not found`);
    }

    return await gatewayProvider.createRefund(refundData);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    paymentId: string,
    provider?: string
  ): Promise<PaymentStatusResult> {
    const gatewayProvider = this.getProvider(provider);
    
    if (!gatewayProvider) {
      throw new Error(`Payment provider ${provider || this.defaultProvider} not found`);
    }

    return await gatewayProvider.getPaymentStatus(paymentId);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities() {
    return {
      razorpay: {
        name: 'Razorpay',
        currencies: ['INR'],
        methods: ['card', 'upi', 'netbanking', 'wallet'],
        countries: ['IN'],
        fee: '2.5%'
      },
      stripe: {
        name: 'Stripe',
        currencies: ['INR', 'USD', 'EUR'],
        methods: ['card'],
        countries: ['global'],
        fee: '2.9% + ₹30'
      }
    };
  }

  private getProvider(providerName?: string): PaymentGatewayProvider | undefined {
    return this.providers.get(providerName || this.defaultProvider);
  }
}

// Singleton instance
const paymentGatewayService = new PaymentGatewayService();
export default paymentGatewayService;

/**
 * Utility functions for payment processing
 */
export const paymentUtils = {
  /**
   * Convert amount to smallest currency unit
   */
  toSmallestUnit(amount: number, currency: string = 'INR'): number {
    const multipliers: Record<string, number> = {
      'INR': 100, // Paise
      'USD': 100, // Cents
      'EUR': 100  // Cents
    };
    
    return Math.round(amount * (multipliers[currency] || 100));
  },

  /**
   * Convert amount from smallest currency unit
   */
  fromSmallestUnit(amount: number, currency: string = 'INR'): number {
    const divisors: Record<string, number> = {
      'INR': 100,
      'USD': 100,
      'EUR': 100
    };
    
    return amount / (divisors[currency] || 100);
  },

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'INR'): string {
    const formatters: Record<string, Intl.NumberFormat> = {
      'INR': new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'EUR': new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' })
    };
    
    return formatters[currency]?.format(amount) || `${amount} ${currency}`;
  },

  /**
   * Generate unique order ID
   */
  generateOrderId(prefix: string = 'ORD'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  },

  /**
   * Validate payment amount
   */
  validateAmount(amount: number, currency: string = 'INR'): { valid: boolean; error?: string } {
    if (amount <= 0) {
      return { valid: false, error: 'Amount must be greater than zero' };
    }

    const minimumAmounts: Record<string, number> = {
      'INR': 1, // ₹1
      'USD': 0.50, // $0.50
      'EUR': 0.50  // €0.50
    };

    const maxAmounts: Record<string, number> = {
      'INR': 1000000, // ₹10,00,000
      'USD': 15000,   // $15,000
      'EUR': 15000    // €15,000
    };

    const minAmount = minimumAmounts[currency] || 1;
    const maxAmount = maxAmounts[currency] || 1000000;

    if (amount < minAmount) {
      return { valid: false, error: `Amount must be at least ${paymentUtils.formatCurrency(minAmount, currency)}` };
    }

    if (amount > maxAmount) {
      return { valid: false, error: `Amount cannot exceed ${paymentUtils.formatCurrency(maxAmount, currency)}` };
    }

    return { valid: true };
  }
};