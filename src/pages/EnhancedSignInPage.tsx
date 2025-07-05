import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Shield, 
  CheckCircle2, Globe, Users, Package, TrendingUp, Github, Chrome,
  AlertCircle, Info, Fingerprint, Smartphone, KeyRound, Clock,
  Zap, BarChart3
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof formSchema>;

export default function EnhancedSignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [lastLoginTime, setLastLoginTime] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const watchedPassword = watch('password');

  // Check for session expiry message
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('session') === 'expired') {
      setSessionExpired(true);
      setTimeout(() => setSessionExpired(false), 5000);
    }
  }, [location]);

  // Lockout timer countdown
  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setTimeout(() => {
        setLockoutTimer(lockoutTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (lockoutTimer === 0 && isLocked) {
      setIsLocked(false);
      setLoginAttempts(0);
    }
  }, [lockoutTimer, isLocked]);

  // Load saved email and last login time if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedLastLogin = localStorage.getItem('lastLoginTime');
    if (savedEmail) {
      setValue('email', savedEmail);
      setRememberMe(true);
    }
    if (savedLastLogin) {
      setLastLoginTime(savedLastLogin);
    }
  }, [setValue]);

  // Calculate password strength
  useEffect(() => {
    if (watchedPassword) {
      let strength = 0;
      if (watchedPassword.length >= 8) strength += 25;
      if (watchedPassword.length >= 12) strength += 25;
      if (/[a-z]/.test(watchedPassword) && /[A-Z]/.test(watchedPassword)) strength += 25;
      if (/[0-9]/.test(watchedPassword)) strength += 12.5;
      if (/[^A-Za-z0-9]/.test(watchedPassword)) strength += 12.5;
      setPasswordStrength(strength);
    }
  }, [watchedPassword]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const formatLastLoginTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const onSubmit = async (data: FormValues) => {
    if (isLocked) {
      setError(`Account locked. Please wait ${lockoutTimer} seconds.`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        // Lock account after 5 failed attempts
        if (newAttempts >= 5) {
          setIsLocked(true);
          setLockoutTimer(300); // 5 minutes lockout
          setError('Too many failed attempts. Account locked for 5 minutes.');
        } else {
          setError(`${error.message} (${5 - newAttempts} attempts remaining)`);
        }
        
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', data.email);
          localStorage.setItem('lastLoginTime', new Date().toISOString());
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('lastLoginTime');
        }
        
        // Store session with extended expiry if remember me is checked
        if (rememberMe) {
          // This would typically be handled server-side
          sessionStorage.setItem('extendedSession', 'true');
        }
        
        toast({
          title: "Welcome back!",
          description: "Signed in successfully.",
        });
        
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Sign in failed', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = watch('email');
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
      }
    } catch (err) {
      console.error('Password reset error:', err);
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = () => {
    toast({
      title: "Coming Soon",
      description: "Biometric authentication will be available in the next update.",
    });
  };

  const handleMobileAppLogin = () => {
    toast({
      title: "Download Our App",
      description: "Scan the QR code with your mobile app to sign in.",
    });
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
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              Sign in to access your logistics dashboard
            </p>
          </motion.div>

          {/* Session Expired Alert */}
          <AnimatePresence>
            {sessionExpired && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/30 dark:border-orange-800">
                  <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertTitle className="text-orange-800 dark:text-orange-300">Session Expired</AlertTitle>
                  <AlertDescription className="text-orange-700 dark:text-orange-400">
                    Your session has expired. Please sign in again to continue.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Last Login Info */}
          {lastLoginTime && rememberMe && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Clock className="h-4 w-4" />
                <span>Last login: {formatLastLoginTime(lastLoginTime)}</span>
              </div>
            </motion.div>
          )}
          
          <AnimatePresence>
            {error && (
              <motion.div 
                className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  disabled={isLoading || isLocked}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <motion.p 
                  className="text-sm text-red-500 mt-1 flex items-center gap-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.email.message}
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
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-brand-600" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="pl-12 pr-12 py-3 h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200 rounded-xl"
                  disabled={isLoading || isLocked}
                  onFocus={() => setShowPasswordStrength(true)}
                  onBlur={() => setShowPasswordStrength(false)}
                  {...register('password')}
                />
                <button 
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.p 
                  className="text-sm text-red-500 mt-1 flex items-center gap-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.password.message}
                </motion.p>
              )}
              
              {/* Password Strength Indicator */}
              <AnimatePresence>
                {showPasswordStrength && watchedPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2"
                  >
                    <div className="space-y-1">
                      <Progress value={passwordStrength} className="h-2">
                        <div
                          className={cn("h-full transition-all", getPasswordStrengthColor())}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </Progress>
                      <p className={cn(
                        "text-xs font-medium",
                        passwordStrength < 50 ? "text-red-600 dark:text-red-400" : 
                        passwordStrength < 75 ? "text-yellow-600 dark:text-yellow-400" : 
                        "text-green-600 dark:text-green-400"
                      )}>
                        Password strength: {getPasswordStrengthText()}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Remember Me Checkbox */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading || isLocked}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remember me for 30 days
                </Label>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-brand-600 via-brand-500 to-blue-600 hover:from-brand-700 hover:via-brand-600 hover:to-blue-700 text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-300 font-medium text-base rounded-xl group"
                disabled={isLoading || isLocked}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : isLocked ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Locked ({lockoutTimer}s)
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
          
          {/* Alternative Login Methods */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">Or continue with</span>
            </div>
          </div>
          
          {/* Social and Alternative Login Buttons */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="h-11 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl"
                disabled={isLoading || isLocked}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="h-11 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl"
                disabled={isLoading || isLocked}
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="h-11 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl"
                onClick={handleBiometricLogin}
                disabled={isLoading || isLocked}
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                Biometric
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="h-11 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl"
                onClick={handleMobileAppLogin}
                disabled={isLoading || isLocked}
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Mobile App
              </Button>
            </div>
          </motion.div>
          
          <div className="mt-8 space-y-4">
            <p className="text-center text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold transition-colors">
                Start free trial
              </Link>
            </p>
            <p className="text-center text-gray-600 dark:text-gray-400">
              Organization user?{' '}
              <Link to="/signin/organization" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold transition-colors">
                Sign in with organization
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
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-1">
                <KeyRound className="h-4 w-4" />
                <span>2FA Enabled</span>
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
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Real-time Chat</h3>
              <p className="text-blue-100 text-sm">Collaborate instantly with your team</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Enhanced Security</h3>
              <p className="text-blue-100 text-sm">2FA, biometrics, and session management</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
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