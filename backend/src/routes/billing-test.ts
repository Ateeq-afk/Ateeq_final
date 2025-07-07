// Simple billing test route without TypeScript strict checking
// @ts-nocheck
import { Router } from 'express';

const router = Router();

// Basic test route
router.get('/test', (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Billing API test endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test endpoint failed',
      details: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'billing-api',
    timestamp: new Date().toISOString()
  });
});

export default router;