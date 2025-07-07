import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Truck, Package, ArrowRight, CheckCircle, Users, BarChart3, Shield, Clock, Globe, Zap, Star, Menu, X, ChevronRight, Building2, MapPin, Phone, Mail, Sparkles, TrendingUp, Award, Headphones, Rocket, Target, Heart, ShieldCheck, FileCheck, UserCheck, Cpu, Cloud, Smartphone, MessageSquare, Calendar, DollarSign, BarChart, Briefcase, Layers, CheckSquare, Activity, Lock, Database, RefreshCw, Settings, ArrowUpRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { scrollY } = useScroll();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });
  
  const headerBackground = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.95)']
  );
  const headerBackgroundDark = useTransform(
    scrollY,
    [0, 100],
    ['rgba(17, 24, 39, 0)', 'rgba(17, 24, 39, 0.95)']
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX - window.innerWidth / 2) / 50);
      mouseY.set((e.clientY - window.innerHeight / 2) / 50);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3 + i * 0.1,
        duration: 0.5
      }
    })
  };

  const features = [
    {
      icon: <Truck className="h-6 w-6" />,
      title: 'Smart Fleet Management',
      description: 'AI-powered fleet optimization with real-time GPS tracking, predictive maintenance alerts, and automated route planning to maximize efficiency.',
      color: 'blue',
      stats: '35% reduction in fuel costs'
    },
    {
      icon: <Package className="h-6 w-6" />,
      title: 'Intelligent Booking System',
      description: 'Streamline operations with automated booking workflows, smart pricing algorithms, and instant customer notifications.',
      color: 'green',
      stats: '60% faster booking process'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'CRM & Customer Portal',
      description: 'Build lasting relationships with comprehensive customer profiles, self-service portals, and personalized communication tools.',
      color: 'purple',
      stats: '4.8/5 customer satisfaction'
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Business Intelligence',
      description: 'Make data-driven decisions with real-time analytics, custom reports, and predictive insights powered by machine learning.',
      color: 'amber',
      stats: '200+ KPI metrics tracked'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Bank-Grade Security',
      description: 'Rest easy with 256-bit encryption, SOC 2 compliance, automated backups, and multi-factor authentication.',
      color: 'red',
      stats: '99.99% uptime guarantee'
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: 'Digital POD & Documentation',
      description: 'Paperless operations with e-signatures, photo evidence, automated invoicing, and instant delivery confirmations.',
      color: 'indigo',
      stats: '100% paperless workflow'
    }
  ];

  const additionalFeatures = [
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: 'Mobile First Design',
      description: 'Native mobile apps for drivers and customers'
    },
    {
      icon: <Cloud className="h-5 w-5" />,
      title: 'Cloud Infrastructure',
      description: 'Scalable cloud platform with global CDN'
    },
    {
      icon: <Cpu className="h-5 w-5" />,
      title: 'AI & Automation',
      description: 'Smart automation for repetitive tasks'
    },
    {
      icon: <RefreshCw className="h-5 w-5" />,
      title: 'Real-time Sync',
      description: 'Instant updates across all devices'
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Role-Based Access',
      description: 'Granular permissions and access control'
    },
    {
      icon: <Headphones className="h-5 w-5" />,
      title: '24/7 Support',
      description: 'Round-the-clock customer assistance'
    }
  ];

  const stats = [
    { value: '2M+', label: 'Shipments Delivered', icon: <Package className="h-5 w-5" />, trend: '+23%' },
    { value: '99.99%', label: 'Platform Uptime', icon: <Activity className="h-5 w-5" />, trend: 'SLA' },
    { value: '500+', label: 'Cities Covered', icon: <MapPin className="h-5 w-5" />, trend: '+45' },
    { value: '15K+', label: 'Happy Clients', icon: <Heart className="h-5 w-5" />, trend: '+18%' }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'CEO, FastTrack Logistics',
      company: 'Enterprise Client',
      image: '👨‍💼',
      quote: 'DesiCargo transformed our operations completely. We\'ve seen a 40% increase in efficiency and our customers love the real-time tracking. The ROI was evident within the first quarter.',
      rating: 5,
      metrics: ['40% efficiency gain', '3x faster deliveries', '₹2Cr saved annually']
    },
    {
      name: 'Priya Sharma',
      role: 'Operations Head, QuickShip',
      company: 'Growing Business',
      image: '👩‍💼',
      quote: 'The automation features are game-changing. What used to take hours now happens in minutes. Our team can focus on growth instead of manual tasks.',
      rating: 5,
      metrics: ['90% time saved', '5x team productivity', 'Zero paper usage']
    },
    {
      name: 'Amit Patel',
      role: 'Founder, City Express',
      company: 'Small Business',
      image: '👨‍💼',
      quote: 'As a small business, we needed something affordable yet powerful. DesiCargo delivered on both fronts. The customer support is exceptional.',
      rating: 5,
      metrics: ['₹50K monthly savings', '24/7 support access', '2-hour setup time']
    },
    {
      name: 'Sarah Johnson',
      role: 'Logistics Manager, GlobalTech',
      company: 'International Client',
      image: '👩‍💼',
      quote: 'The multi-branch support and analytics capabilities are exactly what we needed for our pan-India operations. Highly recommended!',
      rating: 5,
      metrics: ['15 branches connected', 'Real-time insights', 'Unified dashboard']
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '₹9,999',
      period: 'month',
      description: 'Perfect for small logistics businesses',
      features: [
        'Up to 100 bookings/month',
        'Basic fleet management (10 vehicles)',
        'Customer management portal',
        'Email & chat support',
        'Mobile app for drivers',
        'Basic analytics dashboard',
        'Invoice generation',
        '7-day data backup'
      ],
      highlighted: false,
      badge: null,
      savings: null
    },
    {
      name: 'Professional',
      price: '₹24,999',
      period: 'month',
      description: 'For growing logistics companies',
      features: [
        'Up to 1000 bookings/month',
        'Advanced fleet management (50 vehicles)',
        'Multi-branch support',
        'Priority phone & chat support',
        'API access & webhooks',
        'Advanced analytics & custom reports',
        'White-label mobile apps',
        'Automated billing & GST',
        'Real-time notifications',
        '30-day data backup'
      ],
      highlighted: true,
      badge: 'Most Popular',
      savings: 'Save ₹30,000/year'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large-scale operations',
      features: [
        'Unlimited bookings',
        'Unlimited fleet size',
        'Custom integrations & features',
        'Dedicated account manager',
        '24/7 phone, chat & on-site support',
        'SLA guarantee (99.99% uptime)',
        'On-premise deployment option',
        'Advanced security features',
        'Custom training programs',
        'Unlimited data retention'
      ],
      highlighted: false,
      badge: null,
      savings: null
    }
  ];

  const processSteps = [
    {
      number: '01',
      title: 'Sign Up & Setup',
      description: 'Create your account and configure your business profile in minutes',
      icon: <UserCheck className="h-6 w-6" />
    },
    {
      number: '02',
      title: 'Add Your Fleet',
      description: 'Import vehicles, drivers, and set up your operational parameters',
      icon: <Truck className="h-6 w-6" />
    },
    {
      number: '03',
      title: 'Start Booking',
      description: 'Begin accepting bookings and watch your business grow',
      icon: <Rocket className="h-6 w-6" />
    },
    {
      number: '04',
      title: 'Track & Optimize',
      description: 'Monitor performance and optimize operations with AI insights',
      icon: <TrendingUp className="h-6 w-6" />
    }
  ];

  const faqs = [
    {
      question: 'How quickly can I get started with DesiCargo?',
      answer: 'You can be up and running in less than 2 hours! Our onboarding team will guide you through the setup process, import your existing data, and provide training to your team.'
    },
    {
      question: 'Is my data secure with DesiCargo?',
      answer: 'Absolutely! We use bank-grade 256-bit encryption, maintain SOC 2 compliance, and perform regular security audits. Your data is backed up across multiple data centers with 99.99% uptime guarantee.'
    },
    {
      question: 'Can I integrate DesiCargo with my existing systems?',
      answer: 'Yes! We offer REST APIs, webhooks, and pre-built integrations with popular accounting software, GPS providers, and communication platforms. Our team can also build custom integrations.'
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'We offer 24/7 support through multiple channels - phone, chat, email, and WhatsApp. Enterprise customers get a dedicated account manager and on-site support when needed.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950">
      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50"
        style={{
          backgroundColor: theme === 'dark' ? headerBackgroundDark : headerBackground
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-500 dark:to-brand-700 flex items-center justify-center text-white shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Truck className="h-5 w-5" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-400 dark:to-brand-600 text-transparent bg-clip-text">
                  DesiCargo
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">K2K Logistics</span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">How it Works</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">Testimonials</a>
              <button onClick={() => navigate('/about')} className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">About</button>
            </nav>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hidden md:flex"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/signin')}
                className="hidden md:flex"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-md hidden sm:flex"
              >
                Get Started
              </Button>
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.nav 
              className="lg:hidden pt-4 pb-2 border-t border-gray-200 dark:border-gray-800 mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col gap-2">
                <a href="#features" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Features</a>
                <a href="#how-it-works" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">How it Works</a>
                <a href="#pricing" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Pricing</a>
                <a href="#testimonials" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Testimonials</a>
                <button onClick={() => navigate('/about')} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors w-full text-left">About</button>
                <div className="flex gap-2 px-4 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/signin')}
                    className="flex-1"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate('/signup')}
                    className="flex-1 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </motion.nav>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-brand-950 dark:to-blue-950" />
          <motion.div 
            className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-br from-brand-400/20 to-blue-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, -50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="container mx-auto max-w-7xl relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div className="lg:w-1/2 text-center lg:text-left" variants={itemVariants}>
              <motion.div 
                className="inline-flex items-center gap-2 mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <Badge className="bg-gradient-to-r from-brand-100 to-blue-100 text-brand-700 dark:from-brand-900/30 dark:to-blue-900/30 dark:text-brand-400 border-0 px-4 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  #1 Logistics Platform in India
                </Badge>
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400 border-0 px-3 py-1.5">
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                  40% Growth
                </Badge>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.1]">
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 text-transparent bg-clip-text">
                  Transform Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-brand-600 via-blue-600 to-purple-600 dark:from-brand-400 dark:via-blue-400 dark:to-purple-400 text-transparent bg-clip-text">
                  Logistics Business
                </span>
              </h1>
              
              <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Join <span className="font-semibold text-brand-600 dark:text-brand-400">15,000+ businesses</span> using DesiCargo's AI-powered platform to deliver <span className="font-semibold">2M+ packages</span> monthly with 99.9% reliability.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="xl" 
                    onClick={() => navigate('/signup')}
                    className="bg-gradient-to-r from-brand-600 via-brand-500 to-blue-600 hover:from-brand-700 hover:via-brand-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl group px-8 py-6 text-lg font-semibold"
                  >
                    Start 14-Day Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    size="xl"
                    onClick={() => setIsVideoPlaying(true)}
                    className="border-2 border-gray-300 dark:border-gray-600 hover:border-brand-500 dark:hover:border-brand-400 px-8 py-6 text-lg font-semibold group"
                  >
                    <Play className="mr-2 h-5 w-5 group-hover:text-brand-600 dark:group-hover:text-brand-400" />
                    Watch Demo
                  </Button>
                </motion.div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Setup in 2 Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Cancel Anytime</span>
                </div>
              </div>

              {/* Customer Avatars */}
              <motion.div 
                className="mt-8 flex items-center gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-brand-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-white">4.9/5</span> from 2,000+ reviews
                  </p>
                </div>
              </motion.div>
            </motion.div>
            <motion.div 
              className="lg:w-1/2 relative w-full max-w-2xl"
              variants={itemVariants}
              style={{
                transform: `translateX(${springX}px) translateY(${springY}px)`,
              }}
            >
              <div className="relative">
                {/* Floating Elements */}
                <motion.div 
                  className="absolute -top-10 -left-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 hidden lg:block"
                  animate={{
                    y: [0, -20, 0],
                    rotate: [-5, 5, -5]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Live Tracking</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PKG-2024-1234</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute -bottom-10 -right-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 hidden lg:block"
                  animate={{
                    y: [0, 20, 0],
                    rotate: [5, -5, 5]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Revenue Growth</p>
                      <p className="text-xs text-green-600 dark:text-green-400">+45% this month</p>
                    </div>
                  </div>
                </motion.div>

                {/* Main Dashboard Preview */}
                <motion.div 
                  className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="bg-gradient-to-r from-brand-600 to-blue-600 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-400"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                        <div className="h-3 w-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="text-white/80 text-sm font-medium">DesiCargo Dashboard</div>
                    </div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">2.4K</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">98%</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">On-time</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">₹2.1M</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">4.9★</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                      </div>
                    </div>
                    
                    {/* Chart Preview */}
                    <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Delivery Performance</h4>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          +12% vs last month
                        </Badge>
                      </div>
                      <div className="h-32 flex items-end gap-2">
                        {[65, 80, 45, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-brand-500 to-brand-400 dark:from-brand-600 dark:to-brand-500 rounded-t"
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Order #1234 Delivered</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Mumbai to Delhi • 2 mins ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Vehicle MH-01-1234 Dispatched</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">25 packages • 5 mins ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 text-transparent bg-clip-text">
              Trusted by India's Leading Logistics Companies
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our platform powers logistics operations across the country with unmatched reliability
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="relative group"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index, type: "spring", stiffness: 100 }}
                whileHover={{ y: -5 }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-brand-200 dark:hover:border-brand-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-100 to-blue-100 dark:from-brand-900/30 dark:to-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {stat.icon}
                    </div>
                    {stat.trend && (
                      <Badge className={cn(
                        "text-xs font-medium",
                        stat.trend.includes('+') 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      )}>
                        {stat.trend}
                      </Badge>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {stat.value}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Trust Indicators */}
          <motion.div 
            className="mt-16 flex flex-wrap items-center justify-center gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">ISO 27001 Certified</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Award className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Best Logistics Platform 2024</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <ShieldCheck className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">SOC 2 Type II Compliant</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <Badge className="bg-gradient-to-r from-brand-100 to-blue-100 text-brand-700 dark:from-brand-900/30 dark:to-blue-900/30 dark:text-brand-400 mb-4 px-4 py-1.5">
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                Complete Solution Suite
              </Badge>
            </motion.div>
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-brand-700 to-blue-700 dark:from-white dark:via-brand-400 dark:to-blue-400 text-transparent bg-clip-text"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              Everything You Need to Scale
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              From single truck operations to multi-city fleets, our comprehensive platform grows with your business
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => {
              const colorClasses = {
                blue: 'from-blue-500 to-cyan-500',
                green: 'from-green-500 to-emerald-500',
                purple: 'from-purple-500 to-pink-500',
                amber: 'from-amber-500 to-orange-500',
                red: 'from-red-500 to-rose-500',
                indigo: 'from-indigo-500 to-purple-500'
              };
              
              const bgColorClasses = {
                blue: 'bg-blue-50 dark:bg-blue-900/20',
                green: 'bg-green-50 dark:bg-green-900/20',
                purple: 'bg-purple-50 dark:bg-purple-900/20',
                amber: 'bg-amber-50 dark:bg-amber-900/20',
                red: 'bg-red-50 dark:bg-red-900/20',
                indigo: 'bg-indigo-50 dark:bg-indigo-900/20'
              };
              
              return (
                <motion.div
                  key={index}
                  custom={index}
                  variants={featureVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Card className="relative h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:border-brand-300 dark:hover:border-brand-600 transition-all duration-300 shadow-lg hover:shadow-2xl rounded-3xl overflow-hidden">
                    <CardContent className="p-8">
                      <div className={`h-16 w-16 rounded-2xl ${bgColorClasses[feature.color as keyof typeof bgColorClasses]} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center text-white shadow-lg`}>
                          {feature.icon}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                        {feature.description}
                      </p>
                      {feature.stats && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            {feature.stats}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Additional Features Grid */}
          <motion.div 
            className="mt-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-center mb-12 text-gray-900 dark:text-white">
              Plus Everything Else You Need
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {additionalFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  className="text-center group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all duration-300">
                    <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 shadow-sm">
                      {feature.icon}
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400 mb-4 px-4 py-1.5">
                <Rocket className="h-3.5 w-3.5 mr-1.5" />
                Quick Setup Process
              </Badge>
            </motion.div>
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 text-transparent bg-clip-text"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              Get Started in 4 Simple Steps
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              From signup to your first delivery - be operational in less than 2 hours
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-24 left-16 right-16 h-0.5 bg-gradient-to-r from-brand-200 via-blue-200 to-purple-200 dark:from-brand-700 dark:via-blue-700 dark:to-purple-700" />
            
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="text-center">
                  {/* Step Number */}
                  <motion.div 
                    className="relative z-10 mx-auto mb-6"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-brand-100 to-blue-100 dark:from-brand-900/30 dark:to-blue-900/30 flex items-center justify-center relative">
                      <div className="h-20 w-20 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg">
                        <span className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-blue-600 text-transparent bg-clip-text">
                          {step.number}
                        </span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-white shadow-md">
                        {step.icon}
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Content */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 h-full"
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
          >
            <Button
              size="xl"
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-brand-600 via-brand-500 to-blue-600 hover:from-brand-700 hover:via-brand-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl px-8 py-6 text-lg font-semibold group"
            >
              Start Your Free Trial Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400 px-4 py-1.5">
              <DollarSign className="h-3.5 w-3.5 mr-1.5" />
              Flexible Pricing Plans
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-brand-700 to-green-700 dark:from-white dark:via-brand-400 dark:to-green-400 text-transparent bg-clip-text">
              Investment That Pays for Itself
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Choose the perfect plan for your business. Upgrade, downgrade, or cancel anytime.
            </p>
          </motion.div>

          {/* Pricing Toggle */}
          <motion.div 
            className="flex items-center justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1 flex items-center">
              <button className="px-6 py-2 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium shadow-sm">
                Monthly
              </button>
              <button className="px-6 py-2 rounded-full text-gray-600 dark:text-gray-400 font-medium">
                Annual <span className="text-green-600 dark:text-green-400 text-sm ml-1">(Save 20%)</span>
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className={`relative ${plan.highlighted ? 'lg:scale-105 z-10' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-5 left-0 right-0 flex justify-center">
                    <Badge className="bg-gradient-to-r from-brand-600 to-blue-600 text-white border-0 px-4 py-1.5 shadow-lg">
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <Card className={`h-full rounded-3xl overflow-hidden ${plan.highlighted ? 'border-2 border-brand-500 shadow-2xl bg-gradient-to-br from-white to-brand-50/20 dark:from-gray-800 dark:to-brand-950/20' : 'border-gray-200 dark:border-gray-700 shadow-lg'}`}>
                  <CardContent className="p-8">
                    {/* Plan Header */}
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{plan.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                    </div>
                    
                    {/* Pricing */}
                    <div className="mb-8">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                        {plan.period && <span className="text-gray-600 dark:text-gray-400 text-lg">/{plan.period}</span>}
                      </div>
                      {plan.savings && (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">{plan.savings}</p>
                      )}
                    </div>
                    
                    {/* CTA Button */}
                    <Button 
                      size="lg"
                      className={`w-full mb-8 font-semibold ${plan.highlighted 
                        ? 'bg-gradient-to-r from-brand-600 via-brand-500 to-blue-600 hover:from-brand-700 hover:via-brand-600 hover:to-blue-700 text-white shadow-lg' 
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'}`}
                      onClick={() => navigate(plan.name === 'Enterprise' ? '/contact' : '/signup')}
                    >
                      {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                    
                    {/* Features */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Everything in {plan.name}:</p>
                      {plan.features.map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.05 * idx }}
                          className="flex items-start gap-3"
                        >
                          <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Money Back Guarantee */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-3 bg-green-50 dark:bg-green-900/20 rounded-full px-6 py-3">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-green-700 dark:text-green-300 font-medium">
                30-day money-back guarantee • No questions asked
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-400 px-4 py-1.5">
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Customer Success Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 text-transparent bg-clip-text">
              Loved by Logistics Leaders
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Join thousands of companies that trust DesiCargo to power their logistics operations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {testimonials.slice(0, 2).map((testimonial, index) => (
              <motion.div 
                key={index}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
                  <CardContent className="p-8">
                    {/* Quote */}
                    <div className="mb-6">
                      <div className="text-6xl text-brand-200 dark:text-brand-800 mb-4">“</div>
                      <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                        {testimonial.quote}
                      </p>
                    </div>
                    
                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                      {testimonial.metrics.map((metric, idx) => (
                        <div key={idx} className="text-center">
                          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                            {metric}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Author */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-100 to-blue-100 dark:from-brand-900/30 dark:to-blue-900/30 flex items-center justify-center text-2xl">
                          {testimonial.image}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                          <p className="text-xs text-brand-600 dark:text-brand-400">{testimonial.company}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Smaller Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.slice(2).map((testimonial, index) => (
              <motion.div 
                key={index + 2}
                className="group"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-100 to-blue-100 dark:from-brand-900/30 dark:to-blue-900/30 flex items-center justify-center text-lg">
                        {testimonial.image}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{testimonial.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">
              <Globe className="h-3 w-3 mr-1" />
              Seamless Integrations
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-brand-700 to-blue-600 dark:from-brand-500 dark:to-blue-400 text-transparent bg-clip-text">
              Works With Your Existing Tools
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Connect DesiCargo with your favorite business tools and streamline your workflow.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'WhatsApp', icon: '💬' },
              { name: 'Google Maps', icon: '🗺️' },
              { name: 'Excel Export', icon: '📊' },
              { name: 'SMS Gateway', icon: '📱' },
              { name: 'Payment Gateway', icon: '💳' },
              { name: 'GPS Tracking', icon: '📍' },
              { name: 'Email Service', icon: '📧' },
              { name: 'API Access', icon: '🔌' }
            ].map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="text-4xl mb-3">{integration.icon}</div>
                <p className="font-medium text-gray-900 dark:text-white">{integration.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-600 to-blue-600 dark:from-brand-800 dark:to-blue-900">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-2/3">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Ready to Transform Your Logistics Operations?
              </motion.h2>
              <motion.p 
                className="text-lg text-blue-100 mb-8 max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Join thousands of logistics companies that trust DesiCargo for their daily operations.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                size="xl" 
                onClick={() => navigate('/signup')}
                className="bg-white text-brand-600 hover:bg-blue-50 shadow-lg"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-brand-700 to-blue-600 dark:from-brand-500 dark:to-blue-400 text-transparent bg-clip-text">
              Get in Touch
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Have questions? Our team is here to help you get started.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 mb-4">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Call Us</h3>
              <p className="text-gray-600 dark:text-gray-400">+91 98765 43210</p>
              <p className="text-gray-600 dark:text-gray-400">Mon-Sat 9AM-6PM</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email Us</h3>
              <p className="text-gray-600 dark:text-gray-400">support@desicargo.com</p>
              <p className="text-gray-600 dark:text-gray-400">sales@desicargo.com</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 mb-4">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Visit Us</h3>
              <p className="text-gray-600 dark:text-gray-400">123 Logistics Park</p>
              <p className="text-gray-600 dark:text-gray-400">Mumbai, MH 400001</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white shadow-md">
                  <Truck className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white">
                    DesiCargo
                  </span>
                  <span className="text-xs text-gray-400">K2K Logistics</span>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Comprehensive logistics management solution for modern businesses.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 text-white">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-brand-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 text-white">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-brand-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors">Guides</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 text-white">Company</h3>
              <ul className="space-y-2">
                <li><button onClick={() => navigate('/about')} className="hover:text-brand-400 transition-colors">About Us</button></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-brand-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500">© 2025 DesiCargo. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}