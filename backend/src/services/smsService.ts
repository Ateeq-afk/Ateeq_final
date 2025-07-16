import { log } from '../utils/logger';
import axios from 'axios';
import twilio from 'twilio';

/**
 * SMS Service for customer notifications
 * Supports multiple providers: Twilio, AWS SNS, TextLocal, etc.
 */

interface SMSProvider {
  send(to: string, message: string, options?: any): Promise<SMSResult>;
  validateNumber(phoneNumber: string): boolean;
  getBalance?(): Promise<number>;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
  provider: string;
}

interface SMSTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  type: 'booking' | 'delivery' | 'payment' | 'general';
}

/**
 * Mock SMS Provider (for development)
 */
class MockSMSProvider implements SMSProvider {
  async send(to: string, message: string): Promise<SMSResult> {
    log.info('Mock SMS sent', { to, message });
    
    // Simulate random failures for testing
    const success = Math.random() > 0.1; // 90% success rate
    
    return {
      success,
      messageId: success ? `mock_${Date.now()}` : undefined,
      error: success ? undefined : 'Mock SMS failure',
      cost: 0.05,
      provider: 'mock'
    };
  }

  validateNumber(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  }

  async getBalance(): Promise<number> {
    return 1000; // Mock balance
  }
}

/**
 * Twilio SMS Provider
 */
class TwilioSMSProvider implements SMSProvider {
  private client: any;
  private fromNumber: string;
  private isConfigured: boolean;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || '';
    
    if (accountSid && authToken && this.fromNumber) {
      this.client = twilio(accountSid, authToken);
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
      log.warn('Twilio SMS provider not fully configured');
    }
  }

  async send(to: string, message: string): Promise<SMSResult> {
    try {
      if (!this.isConfigured) {
        throw new Error('Twilio credentials not configured');
      }

      log.info('Sending SMS via Twilio', { to, messageLength: message.length });

      const result = await this.client.messages.create({
        body: message,
        to: to,
        from: this.fromNumber
      });

      return {
        success: true,
        messageId: result.sid,
        cost: parseFloat(result.price || '0.08'),
        provider: 'twilio'
      };
    } catch (error) {
      log.error('Twilio SMS error', { error: error.message });
      return {
        success: false,
        error: error.message,
        provider: 'twilio'
      };
    }
  }

  validateNumber(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  }

  async getBalance(): Promise<number> {
    if (!this.isConfigured) return 0;
    
    try {
      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      return parseFloat(account.balance || '0');
    } catch (error) {
      log.error('Failed to fetch Twilio balance', { error });
      return 0;
    }
  }
}

/**
 * MSG91 SMS Provider (for Indian numbers)
 */
class MSG91Provider implements SMSProvider {
  private apiKey: string;
  private senderId: string;
  private templateId: string;
  private isConfigured: boolean;
  private baseUrl = 'https://control.msg91.com/api/v5';

  constructor() {
    this.apiKey = process.env.MSG91_API_KEY || '';
    this.senderId = process.env.MSG91_SENDER_ID || 'DSCRGO';
    this.templateId = process.env.MSG91_OTP_TEMPLATE_ID || '';
    
    this.isConfigured = !!(this.apiKey && this.senderId);
    if (!this.isConfigured) {
      log.warn('MSG91 SMS provider not fully configured');
    }
  }

  async send(to: string, message: string, options?: any): Promise<SMSResult> {
    try {
      if (!this.isConfigured) {
        throw new Error('MSG91 credentials not configured');
      }

      log.info('Sending SMS via MSG91', { to, messageLength: message.length });

      // For OTP messages, use OTP API
      if (options?.isOtp) {
        return await this.sendOtp(to, options.otp);
      }

      // For regular SMS
      const response = await axios.post(
        `${this.baseUrl}/flow/`,
        {
          sender: this.senderId,
          mobiles: to.replace(/\+/g, ''),
          sms: message,
          authkey: this.apiKey
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'authkey': this.apiKey
          }
        }
      );

      if (response.data.type === 'success') {
        return {
          success: true,
          messageId: response.data.request_id,
          cost: 0.03,
          provider: 'msg91'
        };
      } else {
        throw new Error(response.data.message || 'SMS sending failed');
      }
    } catch (error) {
      log.error('MSG91 SMS error', { error: error.message });
      return {
        success: false,
        error: error.message,
        provider: 'msg91'
      };
    }
  }

  private async sendOtp(to: string, otp: string): Promise<SMSResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/otp`,
        {
          mobile: to.replace(/\+/g, ''),
          otp: otp,
          authkey: this.apiKey,
          template_id: this.templateId || undefined
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'authkey': this.apiKey
          }
        }
      );

      if (response.data.type === 'success') {
        return {
          success: true,
          messageId: response.data.request_id,
          cost: 0.03,
          provider: 'msg91'
        };
      } else {
        throw new Error(response.data.message || 'OTP sending failed');
      }
    } catch (error) {
      throw error;
    }
  }

  validateNumber(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    // Indian mobile numbers
    return cleanNumber.length === 10 || (cleanNumber.length === 12 && cleanNumber.startsWith('91'));
  }

  async getBalance(): Promise<number> {
    if (!this.isConfigured) return 0;
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/balance`,
        {
          headers: {
            'authkey': this.apiKey
          }
        }
      );
      
      return parseFloat(response.data.balance || '0');
    } catch (error) {
      log.error('Failed to fetch MSG91 balance', { error });
      return 0;
    }
  }
}

/**
 * Main SMS Service
 */
class SMSService {
  private providers: Map<string, SMSProvider> = new Map();
  private templates: Map<string, SMSTemplate> = new Map();
  private primaryProvider: string;
  private fallbackProvider: string;

  constructor() {
    this.initializeProviders();
    this.initializeTemplates();
    this.primaryProvider = process.env.SMS_PRIMARY_PROVIDER || 'mock';
    this.fallbackProvider = process.env.SMS_FALLBACK_PROVIDER || 'mock';
  }

  private initializeProviders() {
    // Always include mock provider for development
    this.providers.set('mock', new MockSMSProvider());
    
    // Initialize production providers based on configuration
    if (process.env.TWILIO_ACCOUNT_SID) {
      this.providers.set('twilio', new TwilioSMSProvider());
    }
    
    if (process.env.MSG91_API_KEY) {
      this.providers.set('msg91', new MSG91Provider());
    }

    log.info('SMS providers initialized', {
      providers: Array.from(this.providers.keys()),
      primary: this.primaryProvider
    });
  }

  private initializeTemplates() {
    const templates: SMSTemplate[] = [
      {
        id: 'booking_confirmed',
        name: 'Booking Confirmation',
        template: 'Your booking {{lr_number}} from {{from_location}} to {{to_location}} has been confirmed. Track at {{tracking_url}}',
        variables: ['lr_number', 'from_location', 'to_location', 'tracking_url'],
        type: 'booking'
      },
      {
        id: 'booking_dispatched',
        name: 'Shipment Dispatched',
        template: 'Your shipment {{lr_number}} has been dispatched from {{from_location}}. Expected delivery: {{expected_date}}',
        variables: ['lr_number', 'from_location', 'expected_date'],
        type: 'booking'
      },
      {
        id: 'out_for_delivery',
        name: 'Out for Delivery',
        template: 'Your shipment {{lr_number}} is out for delivery. Our executive will contact you shortly. Contact: {{contact_number}}',
        variables: ['lr_number', 'contact_number'],
        type: 'delivery'
      },
      {
        id: 'delivered',
        name: 'Delivery Completed',
        template: 'Your shipment {{lr_number}} has been delivered successfully. Thank you for choosing DesiCargo!',
        variables: ['lr_number'],
        type: 'delivery'
      },
      {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        template: 'Payment of ₹{{amount}} is pending for booking {{lr_number}}. Please pay at {{payment_url}} or contact {{contact_number}}',
        variables: ['amount', 'lr_number', 'payment_url', 'contact_number'],
        type: 'payment'
      },
      {
        id: 'payment_received',
        name: 'Payment Confirmation',
        template: 'Payment of ₹{{amount}} received for booking {{lr_number}}. Receipt: {{receipt_url}}',
        variables: ['amount', 'lr_number', 'receipt_url'],
        type: 'payment'
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });

    log.info('SMS templates initialized', {
      templateCount: this.templates.size
    });
  }

  /**
   * Send SMS using template
   */
  async sendTemplatedSMS(
    to: string,
    templateId: string,
    variables: Record<string, string>,
    options: { priority?: 'normal' | 'high'; providerId?: string } = {}
  ): Promise<SMSResult> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Validate variables
      const missingVars = template.variables.filter(varName => !variables[varName]);
      if (missingVars.length > 0) {
        throw new Error(`Missing template variables: ${missingVars.join(', ')}`);
      }

      // Replace variables in template
      let message = template.template;
      template.variables.forEach(varName => {
        const placeholder = `{{${varName}}}`;
        message = message.replace(new RegExp(placeholder, 'g'), variables[varName]);
      });

      return await this.sendSMS(to, message, options);
    } catch (error) {
      log.error('Failed to send templated SMS', {
        to,
        templateId,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        provider: 'none'
      };
    }
  }

  /**
   * Send raw SMS
   */
  async sendSMS(
    to: string,
    message: string,
    options: { priority?: 'normal' | 'high'; providerId?: string; isOtp?: boolean; otp?: string } = {}
  ): Promise<SMSResult> {
    const providerId = options.providerId || this.selectProvider(to);
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(`SMS provider ${providerId} not found`);
    }

    // Validate phone number
    if (!provider.validateNumber(to)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        provider: providerId
      };
    }

    try {
      const result = await provider.send(to, message, options);
      
      log.info('SMS sent', {
        to,
        provider: providerId,
        success: result.success,
        messageId: result.messageId,
        cost: result.cost
      });

      return result;
    } catch (error) {
      log.error('SMS sending failed', {
        to,
        provider: providerId,
        error: error.message
      });

      // Try fallback provider if primary fails
      if (providerId === this.primaryProvider && this.fallbackProvider !== providerId) {
        log.info('Trying fallback SMS provider', {
          primary: providerId,
          fallback: this.fallbackProvider
        });

        return await this.sendSMS(to, message, { 
          ...options, 
          providerId: this.fallbackProvider 
        });
      }

      return {
        success: false,
        error: error.message,
        provider: providerId
      };
    }
  }

  /**
   * Send SMS to multiple recipients
   */
  async sendBulkSMS(
    recipients: string[],
    message: string,
    options: { priority?: 'normal' | 'high'; batchSize?: number } = {}
  ): Promise<SMSResult[]> {
    const batchSize = options.batchSize || 50;
    const results: SMSResult[] = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(recipient => 
        this.sendSMS(recipient, message, options)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason.message,
            provider: 'none'
          });
        }
      });

      // Rate limiting between batches
      if (i + batchSize < recipients.length) {
        await this.delay(1000); // 1 second delay between batches
      }
    }

    return results;
  }

  /**
   * Get available templates
   */
  getTemplates(type?: string): SMSTemplate[] {
    const templates = Array.from(this.templates.values());
    return type ? templates.filter(t => t.type === type) : templates;
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<any> {
    const providerStats = [];
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        const balance = provider.getBalance ? await provider.getBalance() : null;
        providerStats.push({
          name,
          isActive: name === this.primaryProvider,
          balance
        });
      } catch (error) {
        providerStats.push({
          name,
          isActive: name === this.primaryProvider,
          error: error.message
        });
      }
    }

    return {
      providers: providerStats,
      templates: this.templates.size,
      primaryProvider: this.primaryProvider,
      fallbackProvider: this.fallbackProvider
    };
  }

  private selectProvider(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Use MSG91 for Indian numbers if available
    if ((cleanNumber.length === 10 || cleanNumber.startsWith('91')) && 
        this.providers.has('msg91')) {
      return 'msg91';
    }
    
    // Otherwise use the primary provider
    return this.primaryProvider;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send OTP
   */
  async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const otpTemplate = process.env.SMS_OTP_TEMPLATE || 'Your DesiCargo OTP is: {otp}. Valid for 10 minutes.';
    const message = otpTemplate.replace('{otp}', otp);
    
    // Pass OTP flag for providers that have special OTP handling
    const result = await this.sendSMS(phoneNumber, message, { 
      priority: 'high',
      isOtp: true,
      otp: otp
    });
    
    return result.success;
  }
}

// Singleton instance
const smsService = new SMSService();
export default smsService;

// Booking-specific SMS helpers
export const bookingSMS = {
  async sendBookingConfirmation(customerPhone: string, bookingData: any) {
    return await smsService.sendTemplatedSMS(customerPhone, 'booking_confirmed', {
      lr_number: bookingData.lr_number,
      from_location: bookingData.from_location,
      to_location: bookingData.to_location,
      tracking_url: `${process.env.FRONTEND_URL}/track/${bookingData.lr_number}`
    });
  },

  async sendDispatchNotification(customerPhone: string, bookingData: any) {
    return await smsService.sendTemplatedSMS(customerPhone, 'booking_dispatched', {
      lr_number: bookingData.lr_number,
      from_location: bookingData.from_location,
      expected_date: bookingData.expected_delivery_date
    });
  },

  async sendOutForDelivery(customerPhone: string, bookingData: any) {
    return await smsService.sendTemplatedSMS(customerPhone, 'out_for_delivery', {
      lr_number: bookingData.lr_number,
      contact_number: process.env.DELIVERY_CONTACT_NUMBER || '+91-8888888888'
    });
  },

  async sendDeliveryConfirmation(customerPhone: string, bookingData: any) {
    return await smsService.sendTemplatedSMS(customerPhone, 'delivered', {
      lr_number: bookingData.lr_number
    });
  }
};

// Payment-specific SMS helpers
export const paymentSMS = {
  async sendPaymentReminder(customerPhone: string, paymentData: any) {
    return await smsService.sendTemplatedSMS(customerPhone, 'payment_reminder', {
      amount: paymentData.amount.toString(),
      lr_number: paymentData.lr_number,
      payment_url: `${process.env.FRONTEND_URL}/pay/${paymentData.payment_id}`,
      contact_number: process.env.PAYMENT_CONTACT_NUMBER || '+91-9999999999'
    });
  },

  async sendPaymentConfirmation(customerPhone: string, paymentData: any) {
    return await smsService.sendTemplatedSMS(customerPhone, 'payment_received', {
      amount: paymentData.amount.toString(),
      lr_number: paymentData.lr_number,
      receipt_url: `${process.env.FRONTEND_URL}/receipt/${paymentData.receipt_id}`
    });
  }
};