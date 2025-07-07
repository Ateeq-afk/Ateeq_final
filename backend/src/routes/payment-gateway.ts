import express from 'express';
import { z } from 'zod';
import { supabase } from '../supabaseClient';
import { authenticate } from '../middleware/auth';
import { requireOrgBranch } from '../middleware/withOrgBranch';
import paymentGatewayService, { paymentUtils } from '../services/paymentGateway';
import { paymentSMS } from '../services/smsService';
import { log } from '../utils/logger';
import { asyncHandler } from '../utils/apiResponse';

const router = express.Router();

// Apply auth middleware to protected routes only
router.use(authenticate);

// Validation schemas
const createPaymentOrderSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  provider: z.enum(['razorpay', 'stripe']).optional(),
  customerInfo: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10)
  }),
  callbackUrl: z.string().url().optional(),
  description: z.string().optional()
});

const verifyPaymentSchema = z.object({
  orderId: z.string(),
  gatewayOrderId: z.string(),
  gatewayPaymentId: z.string(),
  signature: z.string().optional(),
  status: z.string(),
  provider: z.enum(['razorpay', 'stripe']).optional()
});

const refundPaymentSchema = z.object({
  paymentId: z.string(),
  amount: z.number().positive(),
  reason: z.string().min(1),
  provider: z.enum(['razorpay', 'stripe']).optional()
});

/**
 * Get payment gateway configuration
 */
router.get('/config', asyncHandler(async (req, res) => {
  const providers = paymentGatewayService.getAvailableProviders();
  const capabilities = paymentGatewayService.getProviderCapabilities();
  
  res.json({
    success: true,
    data: {
      providers,
      capabilities,
      defaultProvider: process.env.DEFAULT_PAYMENT_PROVIDER || 'razorpay',
      supportedCurrencies: ['INR', 'USD', 'EUR'],
      minimumAmounts: {
        INR: 1,
        USD: 0.50,
        EUR: 0.50
      }
    }
  });
}));

/**
 * Create payment order for a booking
 */
router.post('/create-order', requireOrgBranch, asyncHandler(async (req: any, res) => {
  const { orgId, branchId, user } = req;
  
  const parse = createPaymentOrderSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: parse.error.errors
    });
  }
  
  const { bookingId, amount, currency, provider, customerInfo, callbackUrl, description } = parse.data;
  
  try {
    // Validate booking exists and belongs to organization
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        lr_number,
        freight_amount,
        payment_mode,
        payment_status,
        organization_id,
        branch_id,
        from_branch:branches!from_branch(name),
        sender:customers!sender_id(name, phone, email)
      `)
      .eq('id', bookingId)
      .eq('organization_id', orgId)
      .single();
    
    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Validate payment amount matches booking amount
    if (Math.abs(amount - booking.freight_amount) > 0.01) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount does not match booking amount',
        bookingAmount: booking.freight_amount,
        requestedAmount: amount
      });
    }
    
    // Check if booking is already paid
    if (booking.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Booking is already paid'
      });
    }
    
    // Validate amount
    const amountValidation = paymentUtils.validateAmount(amount, currency);
    if (!amountValidation.valid) {
      return res.status(400).json({
        success: false,
        error: amountValidation.error
      });
    }
    
    // Generate unique order ID
    const orderId = paymentUtils.generateOrderId('PAY');
    
    // Prepare order data
    const orderData = {
      amount: paymentUtils.toSmallestUnit(amount, currency),
      currency,
      orderId,
      description: description || `Payment for booking ${booking.lr_number}`,
      customerInfo,
      bookingInfo: {
        bookingId: booking.id,
        lrNumber: booking.lr_number,
        branch: booking.from_branch?.name || 'Unknown'
      },
      callbackUrl,
      webhookUrl: `${process.env.API_URL || 'http://localhost:4000'}/api/payment-gateway/webhook`
    };
    
    // Create payment order
    const orderResult = await paymentGatewayService.createPaymentOrder(orderData, provider);
    
    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment order',
        details: orderResult.error
      });
    }
    
    // Store payment order in database
    const { data: paymentOrder, error: insertError } = await supabase
      .from('payment_orders')
      .insert({
        order_id: orderId,
        gateway_order_id: orderResult.gatewayOrderId,
        booking_id: bookingId,
        amount: amount,
        currency: currency,
        provider: orderResult.provider,
        status: 'created',
        customer_info: customerInfo,
        organization_id: orgId,
        branch_id: branchId,
        created_by: user.id,
        gateway_response: orderResult
      })
      .select()
      .single();
    
    if (insertError) {
      log.error('Failed to store payment order', { orderId, error: insertError });
      return res.status(500).json({
        success: false,
        error: 'Failed to store payment order'
      });
    }
    
    // Return order details for frontend
    res.status(201).json({
      success: true,
      data: {
        orderId: orderResult.orderId,
        gatewayOrderId: orderResult.gatewayOrderId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        provider: orderResult.provider,
        paymentUrl: orderResult.paymentUrl,
        clientSecret: orderResult.clientSecret,
        qrCode: orderResult.qrCode,
        bookingInfo: {
          lrNumber: booking.lr_number,
          amount: booking.freight_amount
        },
        // Add gateway-specific configuration for frontend
        gatewayConfig: provider === 'razorpay' ? {
          key: process.env.RAZORPAY_KEY_ID,
          name: 'DesiCargo',
          description: orderData.description,
          image: `${process.env.FRONTEND_URL || 'https://app.desicargo.com'}/logo.png`,
          prefill: {
            name: customerInfo.name,
            email: customerInfo.email,
            contact: customerInfo.phone
          },
          theme: {
            color: '#007AFF'
          }
        } : undefined
      }
    });
    
  } catch (error) {
    log.error('Payment order creation failed', { 
      bookingId, 
      amount, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * Verify payment after completion
 */
router.post('/verify', requireOrgBranch, asyncHandler(async (req: any, res) => {
  const { orgId, user } = req;
  
  const parse = verifyPaymentSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: parse.error.errors
    });
  }
  
  const { orderId, gatewayOrderId, gatewayPaymentId, signature, status, provider } = parse.data;
  
  try {
    // Get payment order from database
    const { data: paymentOrder, error: orderError } = await supabase
      .from('payment_orders')
      .select(`
        *,
        booking:bookings!booking_id(
          id,
          lr_number,
          freight_amount,
          sender:customers!sender_id(name, phone, email)
        )
      `)
      .eq('order_id', orderId)
      .eq('organization_id', orgId)
      .single();
    
    if (orderError || !paymentOrder) {
      return res.status(404).json({
        success: false,
        error: 'Payment order not found'
      });
    }
    
    // Verify payment with gateway
    const verificationResult = await paymentGatewayService.verifyPayment({
      gatewayOrderId,
      gatewayPaymentId,
      signature,
      status,
      amount: paymentUtils.toSmallestUnit(paymentOrder.amount, paymentOrder.currency)
    }, provider || paymentOrder.provider);
    
    if (!verificationResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Payment verification failed',
        details: verificationResult.error
      });
    }
    
    // Update payment order status
    const paymentStatus = verificationResult.verified && verificationResult.status === 'success' 
      ? 'success' 
      : 'failed';\n    \n    const { error: updateOrderError } = await supabase\n      .from('payment_orders')\n      .update({\n        status: paymentStatus,\n        gateway_payment_id: gatewayPaymentId,\n        verification_result: verificationResult,\n        verified_at: new Date().toISOString(),\n        updated_at: new Date().toISOString()\n      })\n      .eq('id', paymentOrder.id);\n    \n    if (updateOrderError) {\n      log.error('Failed to update payment order', { orderId, error: updateOrderError });\n    }\n    \n    // If payment is successful, create payment record and update booking\n    if (paymentStatus === 'success') {\n      // Create payment record\n      const { data: payment, error: paymentError } = await supabase\n        .from('payments')\n        .insert({\n          payment_number: `PAY-${orderId}`,\n          booking_id: paymentOrder.booking_id,\n          amount: paymentOrder.amount,\n          payment_mode: 'online',\n          payment_status: 'paid',\n          payment_date: new Date().toISOString(),\n          gateway_payment_id: gatewayPaymentId,\n          gateway_provider: paymentOrder.provider,\n          gateway_fee: verificationResult.fee ? paymentUtils.fromSmallestUnit(verificationResult.fee, paymentOrder.currency) : 0,\n          gateway_tax: verificationResult.tax ? paymentUtils.fromSmallestUnit(verificationResult.tax, paymentOrder.currency) : 0,\n          organization_id: orgId,\n          branch_id: paymentOrder.branch_id,\n          created_by: user.id,\n          notes: `Online payment via ${paymentOrder.provider}`\n        })\n        .select()\n        .single();\n      \n      if (paymentError) {\n        log.error('Failed to create payment record', { orderId, error: paymentError });\n      } else {\n        // Update booking payment status\n        await supabase\n          .from('bookings')\n          .update({\n            payment_status: 'paid',\n            updated_at: new Date().toISOString()\n          })\n          .eq('id', paymentOrder.booking_id);\n        \n        // Send payment confirmation SMS\n        if (paymentOrder.booking?.sender?.phone) {\n          try {\n            await paymentSMS.sendPaymentConfirmation(paymentOrder.booking.sender.phone, {\n              amount: paymentOrder.amount.toString(),\n              lr_number: paymentOrder.booking.lr_number,\n              receipt_url: `${process.env.FRONTEND_URL || 'https://app.desicargo.com'}/receipt/${payment.payment_number}`\n            });\n          } catch (smsError) {\n            log.warn('Failed to send payment confirmation SMS', { orderId, error: smsError });\n          }\n        }\n        \n        // Log successful payment\n        log.info('Online payment successful', {\n          orderId,\n          bookingId: paymentOrder.booking_id,\n          lrNumber: paymentOrder.booking?.lr_number,\n          amount: paymentOrder.amount,\n          provider: paymentOrder.provider,\n          gatewayPaymentId\n        });\n      }\n    }\n    \n    res.json({\n      success: true,\n      data: {\n        orderId,\n        paymentId: gatewayPaymentId,\n        status: paymentStatus,\n        verified: verificationResult.verified,\n        amount: paymentOrder.amount,\n        currency: paymentOrder.currency,\n        provider: paymentOrder.provider,\n        bookingInfo: {\n          lrNumber: paymentOrder.booking?.lr_number\n        }\n      }\n    });\n    \n  } catch (error) {\n    log.error('Payment verification failed', {\n      orderId,\n      error: error instanceof Error ? error.message : 'Unknown error'\n    });\n    \n    res.status(500).json({\n      success: false,\n      error: 'Internal server error'\n    });\n  }\n}));\n\n/**\n * Get payment order status\n */\nrouter.get('/order/:orderId', requireOrgBranch, asyncHandler(async (req: any, res) => {\n  const { orderId } = req.params;\n  const { orgId } = req;\n  \n  const { data: paymentOrder, error } = await supabase\n    .from('payment_orders')\n    .select(`\n      *,\n      booking:bookings!booking_id(\n        lr_number,\n        freight_amount\n      )\n    `)\n    .eq('order_id', orderId)\n    .eq('organization_id', orgId)\n    .single();\n  \n  if (error || !paymentOrder) {\n    return res.status(404).json({\n      success: false,\n      error: 'Payment order not found'\n    });\n  }\n  \n  res.json({\n    success: true,\n    data: paymentOrder\n  });\n}));\n\n/**\n * Create refund\n */\nrouter.post('/refund', requireOrgBranch, asyncHandler(async (req: any, res) => {\n  const { orgId, user } = req;\n  \n  const parse = refundPaymentSchema.safeParse(req.body);\n  if (!parse.success) {\n    return res.status(400).json({\n      success: false,\n      error: 'Validation failed',\n      details: parse.error.errors\n    });\n  }\n  \n  const { paymentId, amount, reason, provider } = parse.data;\n  \n  try {\n    // Get payment record\n    const { data: payment, error: paymentError } = await supabase\n      .from('payments')\n      .select(`\n        *,\n        booking:bookings!booking_id(\n          lr_number,\n          sender:customers!sender_id(phone)\n        )\n      `)\n      .eq('gateway_payment_id', paymentId)\n      .eq('organization_id', orgId)\n      .single();\n    \n    if (paymentError || !payment) {\n      return res.status(404).json({\n        success: false,\n        error: 'Payment not found'\n      });\n    }\n    \n    if (payment.payment_status !== 'paid') {\n      return res.status(400).json({\n        success: false,\n        error: 'Payment is not in paid status'\n      });\n    }\n    \n    // Create refund with gateway\n    const refundResult = await paymentGatewayService.createRefund({\n      paymentId,\n      amount: paymentUtils.toSmallestUnit(amount, payment.currency || 'INR'),\n      reason,\n      notes: {\n        booking_lr: payment.booking?.lr_number || '',\n        refunded_by: user.id\n      }\n    }, provider || payment.gateway_provider);\n    \n    if (!refundResult.success) {\n      return res.status(500).json({\n        success: false,\n        error: 'Refund creation failed',\n        details: refundResult.error\n      });\n    }\n    \n    // Create refund record\n    const { data: refundRecord, error: refundRecordError } = await supabase\n      .from('payment_refunds')\n      .insert({\n        refund_id: refundResult.refundId,\n        payment_id: payment.id,\n        amount: amount,\n        reason: reason,\n        status: refundResult.status,\n        gateway_provider: payment.gateway_provider,\n        organization_id: orgId,\n        created_by: user.id,\n        gateway_response: refundResult\n      })\n      .select()\n      .single();\n    \n    if (refundRecordError) {\n      log.error('Failed to create refund record', { paymentId, error: refundRecordError });\n    }\n    \n    // Update payment status if full refund\n    if (amount >= payment.amount) {\n      await supabase\n        .from('payments')\n        .update({\n          payment_status: 'refunded',\n          updated_at: new Date().toISOString()\n        })\n        .eq('id', payment.id);\n      \n      // Update booking payment status\n      await supabase\n        .from('bookings')\n        .update({\n          payment_status: 'refunded',\n          updated_at: new Date().toISOString()\n        })\n        .eq('id', payment.booking_id);\n    }\n    \n    log.info('Refund created', {\n      paymentId,\n      refundId: refundResult.refundId,\n      amount,\n      reason\n    });\n    \n    res.json({\n      success: true,\n      data: {\n        refundId: refundResult.refundId,\n        amount,\n        status: refundResult.status,\n        provider: payment.gateway_provider\n      }\n    });\n    \n  } catch (error) {\n    log.error('Refund creation failed', {\n      paymentId,\n      error: error instanceof Error ? error.message : 'Unknown error'\n    });\n    \n    res.status(500).json({\n      success: false,\n      error: 'Internal server error'\n    });\n  }\n}));\n\n/**\n * Webhook handler for payment gateway notifications\n */\nrouter.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {\n  const signature = req.headers['x-razorpay-signature'] || req.headers['stripe-signature'];\n  const provider = req.headers['x-gateway-provider'] || 'razorpay';\n  \n  try {\n    // In production, verify webhook signature here\n    const webhookData = req.body;\n    \n    log.info('Webhook received', {\n      provider,\n      event: webhookData.event || 'unknown',\n      signature: signature ? 'present' : 'missing'\n    });\n    \n    // Process webhook based on provider and event type\n    // This would handle payment status updates, failed payments, etc.\n    \n    res.status(200).json({ success: true });\n  } catch (error) {\n    log.error('Webhook processing failed', {\n      provider,\n      error: error instanceof Error ? error.message : 'Unknown error'\n    });\n    \n    res.status(400).json({ success: false, error: 'Webhook processing failed' });\n  }\n}));\n\n/**\n * Get payment statistics (admin only)\n */\nrouter.get('/stats', requireOrgBranch, asyncHandler(async (req: any, res) => {\n  const { orgId, role } = req;\n  \n  if (role !== 'admin') {\n    return res.status(403).json({\n      success: false,\n      error: 'Admin access required'\n    });\n  }\n  \n  const { data: stats } = await supabase\n    .rpc('get_payment_gateway_stats', {\n      org_id: orgId\n    });\n  \n  res.json({\n    success: true,\n    data: stats || {\n      totalOrders: 0,\n      successfulPayments: 0,\n      failedPayments: 0,\n      totalAmount: 0,\n      refunds: 0,\n      byProvider: {},\n      recentTransactions: []\n    }\n  });\n}));\n\nexport default router;