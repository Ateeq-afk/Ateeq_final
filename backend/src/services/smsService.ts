import { log } from '../utils/logger';

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
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || '';
  }

  async send(to: string, message: string): Promise<SMSResult> {
    try {
      // Mock Twilio implementation (replace with actual Twilio SDK)
      if (!this.accountSid || !this.authToken) {
        throw new Error('Twilio credentials not configured');
      }

      log.info('Sending SMS via Twilio', { to, messageLength: message.length });

      // Simulate Twilio API call
      await this.delay(500); // Simulate network delay

      return {
        success: true,
        messageId: `twilio_${Date.now()}`,
        cost: 0.08,
        provider: 'twilio'
      };
    } catch (error) {
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * TextLocal SMS Provider (for Indian numbers)
 */
class TextLocalProvider implements SMSProvider {
  private apiKey: string;
  private sender: string;

  constructor() {
    this.apiKey = process.env.TEXTLOCAL_API_KEY || '';
    this.sender = process.env.TEXTLOCAL_SENDER || 'DESICARGO';
  }

  async send(to: string, message: string): Promise<SMSResult> {
    try {
      if (!this.apiKey) {
        throw new Error('TextLocal API key not configured');
      }

      log.info('Sending SMS via TextLocal', { to, messageLength: message.length });

      // Mock TextLocal API call
      await this.delay(300);

      return {
        success: true,
        messageId: `textlocal_${Date.now()}`,
        cost: 0.03, // Lower cost for Indian provider
        provider: 'textlocal'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'textlocal'
      };
    }
  }

  validateNumber(phoneNumber: string): boolean {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    // Indian mobile numbers
    return cleanNumber.length === 10 || (cleanNumber.length === 12 && cleanNumber.startsWith('91'));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    this.providers.set('mock', new MockSMSProvider());
    this.providers.set('twilio', new TwilioSMSProvider());
    this.providers.set('textlocal', new TextLocalProvider());

    log.info('SMS providers initialized', {
      providers: Array.from(this.providers.keys())
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
    options: { priority?: 'normal' | 'high'; providerId?: string } = {}
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
      const result = await provider.send(to, message);
      
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
    
    // Use TextLocal for Indian numbers if available
    if ((cleanNumber.length === 10 || cleanNumber.startsWith('91')) && 
        this.providers.has('textlocal')) {
      return 'textlocal';
    }
    
    return this.primaryProvider;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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