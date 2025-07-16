import { Router } from 'express';
import { supabase } from '../supabaseClient';
import { z } from 'zod';
import { responseMiddleware } from '../utils/apiResponse';
import smsService from '../services/smsService';
import redisService from '../services/redisService';
import jwt from 'jsonwebtoken';

const router = Router();

// Apply response middleware
router.use(responseMiddleware);

// Helper function to generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const schema = z.object({ token: z.string() });

router.post('/signin', async (req, res) => {
  try {
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json(parse.error);
      return;
    }
    const { token } = parse.data;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.json({ user: data.user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile with organization context
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.sendError('Missing or invalid authorization header', 401);
    }

    const token = authHeader.substring(7);
    
    // Try Supabase token first
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return res.sendError('Invalid or expired token', 401);
    }

    // Get user profile with organization context
    const { data: userProfile, error: profileError } = await supabase
      .from('organization_users')
      .select(`
        id,
        email,
        username,
        full_name,
        role,
        branch_id,
        branch_name,
        organization_id,
        organization_name,
        organization_code,
        is_active,
        created_at,
        updated_at
      `)
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      // Fallback to basic user data if no organization profile found
      return res.sendSuccess({
        id: authData.user.id,
        email: authData.user.email,
        effectiveRole: 'authenticated',
        finalEffectiveRole: 'authenticated',
        userRole: 'authenticated',
        userEmail: authData.user.email,
        userOrganizationId: undefined,
        userBranchId: undefined,
        needsOrganizationSetup: true
      });
    }

    // Return enriched user profile
    res.sendSuccess({
      id: userProfile.id,
      email: userProfile.email,
      username: userProfile.username,
      full_name: userProfile.full_name,
      effectiveRole: userProfile.role || 'authenticated',
      finalEffectiveRole: userProfile.role || 'authenticated', 
      userRole: userProfile.role || 'authenticated',
      userEmail: userProfile.email,
      userOrganizationId: userProfile.organization_id,
      userBranchId: userProfile.branch_id,
      organizationName: userProfile.organization_name,
      organizationCode: userProfile.organization_code,
      branchName: userProfile.branch_name,
      isActive: userProfile.is_active
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return res.sendError('Failed to fetch user profile', 500);
  }
});

// OTP send endpoint
router.post('/otp/send', async (req, res) => {
  try {
    const sendOtpSchema = z.object({
      phone_number: z.string()
        .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format')
    });

    const parse = sendOtpSchema.safeParse(req.body);
    if (!parse.success) {
      return res.sendError(parse.error.errors[0].message, 400);
    }

    const { phone_number } = parse.data;

    // Rate limiting check using Redis
    const rateLimitKey = `otp_send:${phone_number}`;
    const requestCount = await redisService.incrementRateLimit(rateLimitKey, 60); // 1 minute window
    
    if (requestCount > 1) {
      const ttl = await redisService.getClient()?.ttl(`desicargo:ratelimit:${rateLimitKey}`);
      return res.sendError(`Please wait ${ttl || 60} seconds before requesting a new OTP`, 429);
    }

    // Check if OTP already exists and is still valid
    const existingOTP = await redisService.getOTP(phone_number);
    if (existingOTP) {
      // OTP already exists, don't generate a new one within the rate limit window
      return res.sendError('An OTP was recently sent. Please check your messages.', 429);
    }

    // Generate new OTP
    const otp = generateOTP();
    const expirySeconds = 600; // 10 minutes

    // Store OTP in Redis
    const stored = await redisService.setOTP(phone_number, otp, expirySeconds);
    if (!stored) {
      // Fallback to in-memory if Redis fails
      console.error('Redis storage failed, OTP feature may not work properly');
      return res.sendError('Service temporarily unavailable. Please try again.', 503);
    }

    // Send OTP via SMS service
    const sent = await smsService.sendOtp(phone_number, otp);
    
    if (!sent) {
      // Clean up OTP if SMS fails
      await redisService.deleteOTP(phone_number);
      return res.sendError('Failed to send OTP. Please try again.', 500);
    }

    // Log OTP to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP] Sent to ${phone_number}: ${otp}`);
    }

    res.sendSuccess({
      message: 'OTP sent successfully',
      expires_in: expirySeconds
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return res.sendError('Failed to send OTP', 500);
  }
});

// OTP verify endpoint
router.post('/otp/verify', async (req, res) => {
  try {
    const verifyOtpSchema = z.object({
      phone_number: z.string()
        .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format'),
      otp: z.string().length(6, 'OTP must be 6 digits')
    });

    const parse = verifyOtpSchema.safeParse(req.body);
    if (!parse.success) {
      return res.sendError(parse.error.errors[0].message, 400);
    }

    const { phone_number, otp } = parse.data;

    // Get stored OTP from Redis
    const storedOTPData = await redisService.getOTP(phone_number);
    if (!storedOTPData) {
      return res.sendError('OTP not found or expired', 400);
    }

    // Check attempts
    if (storedOTPData.attempts >= 3) {
      await redisService.deleteOTP(phone_number);
      return res.sendError('Too many failed attempts. Please request a new OTP.', 400);
    }

    // Verify OTP
    if (storedOTPData.otp !== otp) {
      await redisService.incrementOTPAttempts(phone_number);
      return res.sendError('Invalid OTP', 400);
    }

    // OTP is valid, delete it
    await redisService.deleteOTP(phone_number);

    // Check if user exists with this phone number
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, phone_number')
      .eq('phone_number', phone_number)
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      isNewUser = true;
      
      // Generate a unique email if not provided (using phone number)
      const email = `${phone_number.replace(/\+/g, '')}@otp.desicargo.com`;
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        phone: phone_number,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          phone_number,
          login_method: 'otp'
        }
      });

      if (authError) {
        console.error('Failed to create auth user:', authError);
        return res.sendError('Failed to create user', 500);
      }

      userId = authData.user.id;

      // Create user in public.users table
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          phone_number,
          username: phone_number,
          full_name: '',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) {
        console.error('Failed to create user profile:', createError);
        // Note: Auth user is created but profile failed - handle this case in production
      }
    }

    // Generate JWT token for the user
    // Note: In production, use proper JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret';
    const token = jwt.sign(
      { 
        sub: userId,
        phone_number,
        aud: 'authenticated',
        role: 'authenticated'
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Get user profile
    const { data: userProfile } = await supabase
      .from('organization_users')
      .select(`
        id,
        email,
        username,
        full_name,
        role,
        branch_id,
        branch_name,
        organization_id,
        organization_name,
        organization_code,
        is_active
      `)
      .eq('id', userId)
      .single();

    res.sendSuccess({
      token,
      user: userProfile || {
        id: userId,
        phone_number,
        email: existingUser?.email || `${phone_number.replace(/\+/g, '')}@otp.desicargo.com`,
        needsOrganizationSetup: !userProfile
      },
      isNewUser
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.sendError('Failed to verify OTP', 500);
  }
});

export default router;
