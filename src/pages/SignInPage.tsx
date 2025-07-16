import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Shield, CheckCircle2, Globe, Users, Package, TrendingUp, Chrome, Phone, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const emailFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const otpRequestSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number'),
});

const otpVerifySchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;
type OtpRequestValues = z.infer<typeof otpRequestSchema>;
type OtpVerifyValues = z.infer<typeof otpVerifySchema>;

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumberForOtp, setPhoneNumberForOtp] = useState('');
  const navigate = useNavigate();
  useTheme();

  // Email/Password form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // OTP Request form
  const otpRequestForm = useForm<OtpRequestValues>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: {
      phoneNumber: '',
    },
  });

  // OTP Verify form
  const otpVerifyForm = useForm<OtpVerifyValues>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: {
      phoneNumber: '',
      otp: '',
    },
  });

  const onEmailSubmit = async (data: EmailFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.emailLogin(data.email, data.password);
      
      if (response.user) {
        localStorage.setItem('authToken', response.session?.access_token || '');
        localStorage.setItem('userData', JSON.stringify(response.user));
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Sign in failed', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpRequest = async (data: OtpRequestValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.requestOtp(data.phoneNumber);
      setPhoneNumberForOtp(data.phoneNumber);
      otpVerifyForm.setValue('phoneNumber', data.phoneNumber);
      setOtpSent(true);
    } catch (err) {
      console.error('OTP request failed', err);
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (data: OtpVerifyValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.verifyOtp(data.phoneNumber, data.otp);
      
      if (response.token) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('OTP verification failed', err);
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.googleLogin();
      // Redirect will be handled by Supabase
    } catch (err) {
      console.error('Google login failed', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-brand-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:opacity-30"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:opacity-30"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 dark:opacity-30"></div>
      </div>
      
      {/* Left Side - Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mb-10">
            <motion.div 
              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-blue-600 dark:from-brand-500 dark:to-blue-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Truck className="h-7 w-7" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold bg-gradient-to-r from-brand-600 via-brand-500 to-blue-600 dark:from-brand-400 dark:to-blue-500 text-transparent bg-clip-text">
                DesiCargo
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Enterprise Logistics Platform</span>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-10 text-lg">
              Sign in to access your logistics dashboard
            </p>
          </motion.div>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'password' | 'otp')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="password">Email & Password</TabsTrigger>
              <TabsTrigger value="otp">Mobile OTP</TabsTrigger>
            </TabsList>
            
            <TabsContent value="password">
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium text-sm">Email address</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-brand-600" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@company.com"
                  className="pl-12 pr-4 py-3 h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200 rounded-xl"
                  {...emailForm.register('email')}
                />
              </div>
              {emailForm.formState.errors.email && (
                <motion.p 
                  className="text-sm text-red-500 mt-1 flex items-center gap-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                  {emailForm.formState.errors.email.message}
                </motion.p>
              )}
            </motion.div>
            
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium text-sm">Password</Label>
                <Link to="/forgot-password" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-brand-600" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="pl-12 pr-12 py-3 h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200 rounded-xl"
                  {...emailForm.register('password')}
                />
                <button 
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {emailForm.formState.errors.password && (
                <motion.p 
                  className="text-sm text-red-500 mt-1 flex items-center gap-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                  {emailForm.formState.errors.password.message}
                </motion.p>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-brand-600 via-brand-500 to-blue-600 hover:from-brand-700 hover:via-brand-600 hover:to-blue-700 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-300 font-medium text-base rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </motion.div>
              </form>
            </TabsContent>
            
            <TabsContent value="otp">
              {!otpSent ? (
                <form onSubmit={otpRequestForm.handleSubmit(handleOtpRequest)} className="space-y-6">
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Label htmlFor="phoneNumber" className="text-gray-700 dark:text-gray-300 font-medium text-sm">Mobile Number</Label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-brand-600" />
                      <Input 
                        id="phoneNumber" 
                        type="tel" 
                        placeholder="+91 98765 43210"
                        className="pl-12 pr-4 py-3 h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200 rounded-xl"
                        {...otpRequestForm.register('phoneNumber')}
                      />
                    </div>
                    {otpRequestForm.formState.errors.phoneNumber && (
                      <motion.p 
                        className="text-sm text-red-500 mt-1 flex items-center gap-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                        {otpRequestForm.formState.errors.phoneNumber.message}
                      </motion.p>
                    )}
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-brand-600 via-brand-500 to-blue-600 hover:from-brand-700 hover:via-brand-600 hover:to-blue-700 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-300 font-medium text-base rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send OTP
                          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              ) : (
                <form onSubmit={otpVerifyForm.handleSubmit(handleOtpVerify)} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-4"
                  >
                    OTP sent to {phoneNumberForOtp}
                  </motion.div>
                  
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Label htmlFor="otp" className="text-gray-700 dark:text-gray-300 font-medium text-sm">Enter OTP</Label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-brand-600" />
                      <Input 
                        id="otp" 
                        type="text" 
                        placeholder="123456"
                        maxLength={6}
                        className="pl-12 pr-4 py-3 h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200 rounded-xl font-mono text-lg tracking-wider"
                        {...otpVerifyForm.register('otp')}
                      />
                    </div>
                    {otpVerifyForm.formState.errors.otp && (
                      <motion.p 
                        className="text-sm text-red-500 mt-1 flex items-center gap-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                        {otpVerifyForm.formState.errors.otp.message}
                      </motion.p>
                    )}
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-brand-600 via-brand-500 to-blue-600 hover:from-brand-700 hover:via-brand-600 hover:to-blue-700 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-300 font-medium text-base rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify & Sign In
                          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        otpRequestForm.reset();
                        otpVerifyForm.reset();
                        setError(null);
                      }}
                      className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors"
                    >
                      Change phone number
                    </button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Social Login Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">Or continue with</span>
            </div>
          </div>
          
          {/* Google Login Button */}
          <motion.div 
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-11 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          </motion.div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold transition-colors">
                Start free trial
              </Link>
            </p>
          </div>
          
          {/* Trust Indicators */}
          <motion.div 
            className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>SOC 2 Compliant</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Right Side - Hero */}
      <div className="hidden lg:block lg:w-[55%] bg-gradient-to-br from-brand-600 via-blue-600 to-purple-700 dark:from-brand-800 dark:via-blue-900 dark:to-purple-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        </div>
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7, type: "spring" }}
            className="text-center max-w-2xl"
          >
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Transform Your
              <span className="block bg-gradient-to-r from-blue-200 to-purple-200 text-transparent bg-clip-text">
                Logistics Operations
              </span>
            </h2>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              Join 10,000+ businesses streamlining their supply chain with our enterprise-grade logistics platform.
            </p>
          </motion.div>
          
          {/* Feature Cards */}
          <motion.div 
            className="grid grid-cols-2 gap-6 max-w-2xl w-full"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Global Network</h3>
              <p className="text-blue-100 text-sm">Connected logistics across 50+ cities</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Smart Tracking</h3>
              <p className="text-blue-100 text-sm">Real-time updates at every step</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Team Collaboration</h3>
              <p className="text-blue-100 text-sm">Unified platform for all stakeholders</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Analytics & Insights</h3>
              <p className="text-blue-100 text-sm">Data-driven logistics optimization</p>
            </div>
          </motion.div>
          
          {/* Stats */}
          <motion.div 
            className="flex items-center justify-center gap-12 mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-sm text-blue-200">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-sm text-blue-200">Support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">5M+</div>
              <div className="text-sm text-blue-200">Shipments</div>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between text-white/60 text-sm">
          <span>© 2025 DesiCargo. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
}