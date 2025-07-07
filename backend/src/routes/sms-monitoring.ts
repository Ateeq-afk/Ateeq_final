import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireOrgBranch } from '../middleware/withOrgBranch';
import smsService from '../services/smsService';
import { log } from '../utils/logger';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);
router.use(requireOrgBranch);

/**
 * Get SMS service statistics
 */
router.get('/stats', async (req: any, res) => {
  try {
    const { role } = req;
    
    // Only admins can view SMS stats
    if (role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    const stats = await smsService.getStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        templates: smsService.getTemplates(),
        endpoints: {
          send_reminder: '/api/payments/send-reminder/:bookingId',
          bulk_reminders: '/api/payments/send-bulk-reminders',
          test_sms: '/api/sms/test'
        }
      }
    });
  } catch (error) {
    log.error('Error fetching SMS stats', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch SMS statistics' });
  }
});

/**
 * Get available SMS templates
 */
router.get('/templates', async (req: any, res) => {
  try {
    const { role } = req;
    
    if (role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    const { type } = req.query;
    const templates = smsService.getTemplates(type as string);
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    log.error('Error fetching SMS templates', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch SMS templates' });
  }
});

/**
 * Test SMS sending
 */
router.post('/test', async (req: any, res) => {
  try {
    const { role } = req;
    const { phone, templateId, variables, message } = req.body;
    
    // Only admins can send test SMS
    if (role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    
    let result;
    
    if (templateId && variables) {
      // Send templated SMS
      result = await smsService.sendTemplatedSMS(phone, templateId, variables);
    } else if (message) {
      // Send raw SMS
      result = await smsService.sendSMS(phone, message);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Either (templateId + variables) or message is required' 
      });
    }
    
    res.json({
      success: true,
      data: result,
      message: result.success ? 'Test SMS sent successfully' : 'SMS sending failed'
    });
  } catch (error) {
    log.error('Error sending test SMS', { error });
    res.status(500).json({ success: false, error: 'Failed to send test SMS' });
  }
});

/**
 * Send bulk SMS (for admin notifications)
 */
router.post('/bulk', async (req: any, res) => {
  try {
    const { role } = req;
    const { recipients, message, templateId, variables } = req.body;
    
    // Only admins can send bulk SMS
    if (role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'Recipients array is required' });
    }
    
    if (!message && !templateId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either message or templateId is required' 
      });
    }
    
    let results;
    
    if (templateId && variables) {
      // Send templated SMS to all recipients
      results = await Promise.allSettled(
        recipients.map(phone => 
          smsService.sendTemplatedSMS(phone, templateId, variables)
        )
      );
    } else {
      // Send bulk SMS
      results = await smsService.sendBulkSMS(recipients, message);
    }
    
    const successCount = Array.isArray(results) 
      ? results.filter(r => r.status === 'fulfilled' && r.value.success).length
      : results.filter(r => r.success).length;
    
    const failedCount = recipients.length - successCount;
    
    res.json({
      success: true,
      data: {
        total: recipients.length,
        sent: successCount,
        failed: failedCount,
        results: Array.isArray(results) 
          ? results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
          : results
      },
      message: `Bulk SMS processed: ${successCount} sent, ${failedCount} failed`
    });
  } catch (error) {
    log.error('Error sending bulk SMS', { error });
    res.status(500).json({ success: false, error: 'Failed to send bulk SMS' });
  }
});

/**
 * Health check for SMS service
 */
router.get('/health', async (req: any, res) => {
  try {
    const stats = await smsService.getStats();
    const isHealthy = stats.providers.some(p => p.isActive && !p.error);
    
    res.status(isHealthy ? 200 : 503).json({
      success: true,
      healthy: isHealthy,
      data: {
        providers: stats.providers,
        templates: stats.templates
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      healthy: false,
      error: error instanceof Error ? error.message : 'SMS service error'
    });
  }
});

export default router;