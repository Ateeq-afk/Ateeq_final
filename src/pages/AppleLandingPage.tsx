import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Play, 
  Check, 
  Star, 
  Menu, 
  X, 
  ChevronDown,
  Globe,
  Shield,
  Zap,
  Users,
  Award,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  Sparkles,
  TrendingUp,
  Building2,
  Truck,
  Package,
  BarChart3,
  Target,
  Layers,
  Cpu,
  Database,
  Cloud,
  Smartphone,
  MessageSquare,
  DollarSign,
  RefreshCw,
  Lock,
  Headphones,
  CheckCircle,
  ArrowUpRight,
  Briefcase,
  Calendar,
  Activity,
  Settings,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  FleetIcon,
  TrackingIcon,
  AnalyticsIcon,
  AutomationIcon,
  IntegrationIcon,
  SecurityIcon,
  IconWrapper,
  CloudIcon,
  RocketIcon,
  GrowthIcon,
  SupportIcon,
  PricingIcon
} from '@/components/ui/icons';

// Types
interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  stripePriceId: string;
  description: string;
  cta: string;
}

// Advanced animated background with particles and mesh gradients
const HeroBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set((clientX - innerWidth / 2) / innerWidth);
      mouseY.set((clientY - innerHeight / 2) / innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Primary gradient mesh */}
      <motion.div 
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 25%, rgba(236, 72, 153, 0.15) 50%, transparent 70%)',
          x: useTransform(springX, [-1, 1], [-100, 100]),
          y: useTransform(springY, [-1, 1], [-100, 100]),
        }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Secondary gradient mesh */}
      <motion.div 
        className="absolute -bottom-1/2 -right-1/2 w-[180%] h-[180%] opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.3) 0%, rgba(59, 130, 246, 0.2) 30%, rgba(168, 85, 247, 0.15) 60%, transparent 80%)',
          x: useTransform(springX, [-1, 1], [100, -100]),
          y: useTransform(springY, [-1, 1], [100, -100]),
        }}
        animate={{
          scale: [1, 0.9, 1.1, 1],
          rotate: [360, 270, 180, 90, 0],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Floating orbs */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-sm"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
};

// Premium floating navigation
const Navigation = ({ isScrolled }: { isScrolled: boolean }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <motion.header
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl px-4"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={cn(
          "relative rounded-2xl border backdrop-blur-2xl transition-all duration-700 ease-out mx-4",
          isScrolled 
            ? "bg-white/95 shadow-2xl shadow-black/10 border-gray-200/50" 
            : "bg-white/10 shadow-xl shadow-black/5 border-white/20"
        )}>
          <nav className="flex items-center justify-between px-6 py-4">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3 flex-shrink-0"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-base">DC</span>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border border-white"></div>
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "font-bold text-lg leading-none",
                  isScrolled 
                    ? "text-gray-900" 
                    : "text-gray-900"
                )}>
                  DesiCargo
                </span>
                <span className={cn(
                  "text-xs leading-none",
                  isScrolled 
                    ? "text-gray-500" 
                    : "text-gray-600"
                )}>
                  Logistics Intelligence
                </span>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {[
                { name: 'Platform', href: '#platform' },
                { name: 'Solutions', href: '#solutions' },
                { name: 'Pricing', href: '#pricing' },
                { name: 'About', href: '#about' }
              ].map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "transition-colors font-medium text-sm",
                    isScrolled 
                      ? "text-gray-700 hover:text-blue-600" 
                      : "text-gray-800 hover:text-blue-600"
                  )}
                  whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {item.name}
                </motion.a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm"
                className={cn(
                  "font-medium text-sm px-4",
                  isScrolled 
                    ? "text-gray-700 hover:text-blue-600" 
                    : "text-gray-800 hover:text-blue-600"
                )}
              >
                Sign In
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl px-5 py-2 font-semibold shadow-lg hover:shadow-xl transition-all text-sm border-0"
                >
                  Start Free Trial
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </motion.div>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </nav>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "border-t px-6 py-6 lg:hidden",
                  isScrolled ? "border-gray-200/50" : "border-white/20"
                )}
              >
                <div className="flex flex-col space-y-4">
                  {['Platform', 'Solutions', 'Pricing', 'About'].map((item) => (
                    <a 
                      key={item} 
                      href={`#${item.toLowerCase()}`} 
                      className={cn(
                        "transition-colors font-medium py-2 text-left",
                        isScrolled 
                          ? "text-gray-700 hover:text-blue-600" 
                          : "text-gray-800 hover:text-blue-600"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item}
                    </a>
                  ))}
                  <hr className={cn(
                    "my-2",
                    isScrolled ? "border-gray-200" : "border-white/20"
                  )} />
                  <div className="flex flex-col space-y-3 pt-2">
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "justify-start text-left p-2",
                        isScrolled 
                          ? "text-gray-700 hover:text-blue-600" 
                          : "text-gray-800 hover:text-blue-600"
                      )}
                    >
                      Sign In
                    </Button>
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg py-3">
                      Start Free Trial
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// World-class hero section
const HeroSection = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32">
      <HeroBackground />
      
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Badge className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200/50 px-6 py-3 text-sm font-medium rounded-full backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Introducing AI-powered logistics orchestration
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <div className="space-y-6">
            <motion.h1 
              className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.9]"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Logistics that
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                thinks ahead
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-medium"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              The world's most intelligent logistics platform. Powered by AI, designed for scale, 
              trusted by enterprises. Transform complex supply chains into competitive advantages.
            </motion.p>
          </div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-700 hover:via-blue-800 hover:to-purple-800 text-white rounded-2xl px-10 py-7 text-lg font-semibold shadow-2xl hover:shadow-blue-600/25 transition-all border-0"
                onClick={() => navigate('/signin')}
              >
                <Zap className="mr-3 h-5 w-5" />
                Start Building Now
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-gray-200 hover:border-blue-300 bg-white/80 backdrop-blur-sm rounded-2xl px-10 py-7 text-lg font-semibold hover:bg-blue-50 transition-all"
                onClick={() => setIsVideoPlaying(true)}
              >
                <Play className="mr-3 h-5 w-5" />
                Watch Platform Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Social Proof Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-8 pt-20 max-w-4xl mx-auto"
          >
            {[
              { label: "Enterprise Customers", value: "500+", icon: Building2 },
              { label: "Shipments Processed", value: "50M+", icon: Package },
              { label: "Cost Reduction", value: "40%", icon: TrendingUp },
              { label: "Global Reach", value: "25+", icon: Globe }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-8 h-12 border-2 border-gray-300 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 rounded-full mt-2"></div>
        </div>
      </motion.div>
    </section>
  );
};

// Premium platform showcase
const PlatformSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const capabilities = [
    {
      icon: <FleetIcon className="w-8 h-8" />,
      title: "AI Fleet Orchestration",
      description: "Machine learning algorithms optimize routes, predict maintenance, and reduce fuel consumption by up to 35%.",
      gradient: "blue",
      features: ["Predictive Analytics", "Real-time Optimization", "Fuel Management", "Driver Performance"]
    },
    {
      icon: <TrackingIcon className="w-8 h-8" />,
      title: "Precision Tracking",
      description: "GPS precision tracking with 99.9% accuracy, real-time alerts, and customer communication automation.",
      gradient: "green",
      features: ["Sub-meter Accuracy", "Geofencing", "Alert Management", "Customer Portal"]
    },
    {
      icon: <AnalyticsIcon className="w-8 h-8" />,
      title: "Business Intelligence",
      description: "Advanced analytics dashboard with custom KPIs, automated reporting, and predictive insights.",
      gradient: "purple",
      features: ["Custom Dashboards", "Predictive Models", "ROI Analytics", "Compliance Reports"]
    },
    {
      icon: <AutomationIcon className="w-8 h-8" />,
      title: "Workflow Automation",
      description: "End-to-end automation from booking to delivery, reducing manual work by 80% and eliminating errors.",
      gradient: "orange",
      features: ["Smart Booking", "Auto-dispatch", "Billing Automation", "Document Generation"]
    },
    {
      icon: <IntegrationIcon className="w-8 h-8" />,
      title: "Enterprise Integration",
      description: "Seamless integration with 200+ systems including ERPs, WMS, accounting software, and marketplaces.",
      gradient: "cyan",
      features: ["API-first Design", "Pre-built Connectors", "Real-time Sync", "Custom Webhooks"]
    },
    {
      icon: <SecurityIcon className="w-8 h-8" />,
      title: "Enterprise Security",
      description: "Bank-grade security with SOC 2 compliance, end-to-end encryption, and advanced threat protection.",
      gradient: "red",
      features: ["SOC 2 Certified", "End-to-end Encryption", "Role-based Access", "Audit Trails"]
    }
  ];

  return (
    <section id="platform" className="py-32 bg-gradient-to-b from-gray-50 to-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-6 py-3 mb-8 text-sm font-medium">
            <Cpu className="w-4 h-4 mr-2" />
            Platform Capabilities
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            Built for the future of
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              intelligent logistics
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto font-medium leading-relaxed">
            Every feature designed with enterprise scale in mind. From AI-powered optimization 
            to seamless integrations, we've reimagined what logistics software can be.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {capabilities.map((capability, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <Card className="p-8 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm h-full">
                <CardContent className="p-0 space-y-6 h-full flex flex-col">
                  <div className="flex items-start justify-between">
                    <IconWrapper gradient={capability.gradient as any} size="lg">
                      {capability.icon}
                    </IconWrapper>
                    <Badge variant="secondary" className="text-xs font-medium">
                      Enterprise
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                      {capability.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6 font-medium">
                      {capability.description}
                    </p>

                    <div className="space-y-3">
                      {capability.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <motion.div 
                    className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform cursor-pointer"
                    whileHover={{ x: 4 }}
                  >
                    Explore Feature
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Enterprise solutions section
const SolutionsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const solutions = [
    {
      title: "3PL & Freight Forwarders",
      description: "Complete platform for managing multi-client operations, real-time visibility, and automated billing.",
      icon: <Building2 className="w-6 h-6" />,
      benefits: ["Multi-tenant Architecture", "Client Portals", "Automated Invoicing", "Performance Analytics"],
      caseStudy: "40% operational efficiency increase"
    },
    {
      title: "E-commerce & Retail",
      description: "Seamless integration with marketplaces, automated order fulfillment, and customer experience optimization.",
      icon: <Package className="w-6 h-6" />,
      benefits: ["Marketplace Integration", "Order Automation", "Returns Management", "Customer Notifications"],
      caseStudy: "65% faster order processing"
    },
    {
      title: "Manufacturing & Distribution",
      description: "End-to-end supply chain visibility, inventory optimization, and just-in-time delivery coordination.",
      icon: <Settings className="w-6 h-6" />,
      benefits: ["Supply Chain Visibility", "Inventory Optimization", "JIT Coordination", "Quality Control"],
      caseStudy: "30% inventory reduction"
    }
  ];

  return (
    <section id="solutions" className="py-32 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-6 py-3 mb-8">
            <Target className="w-4 h-4 mr-2" />
            Industry Solutions
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            Tailored for your
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              industry needs
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8 }}
            >
              <Card className="p-8 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 h-full bg-gradient-to-b from-white to-gray-50/50">
                <CardContent className="p-0 space-y-6 h-full flex flex-col">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      {solution.icon}
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {solution.caseStudy}
                    </Badge>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {solution.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6 font-medium">
                      {solution.description}
                    </p>

                    <div className="space-y-3">
                      {solution.benefits.map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          <span className="text-gray-700 font-medium">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-6 font-semibold">
                    View Solution Details
                    <ArrowUpRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// World-class pricing section
const PricingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans: PricingPlan[] = [
    {
      id: 'growth',
      name: 'Growth',
      description: 'Perfect for growing logistics companies',
      price: billingInterval === 'month' ? 199 : 1990,
      interval: billingInterval,
      stripePriceId: billingInterval === 'month' ? 'price_growth_monthly' : 'price_growth_yearly',
      cta: 'Start Free Trial',
      features: [
        'Up to 1,000 shipments/month',
        'Advanced route optimization',
        'Real-time tracking & alerts',
        'Customer portal & notifications',
        'Basic analytics & reporting',
        'API access & integrations',
        'Email & chat support',
        'Mobile apps (iOS & Android)'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For established logistics operations',
      price: billingInterval === 'month' ? 499 : 4990,
      interval: billingInterval,
      stripePriceId: billingInterval === 'month' ? 'price_pro_monthly' : 'price_pro_yearly',
      popular: true,
      cta: 'Start Free Trial',
      features: [
        'Up to 10,000 shipments/month',
        'AI-powered predictive analytics',
        'Advanced fleet management',
        'Multi-warehouse support',
        'Custom dashboards & reports',
        'White-label customer portal',
        'Advanced API & webhooks',
        'Priority support & success manager'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large-scale operations',
      price: billingInterval === 'month' ? 1499 : 14990,
      interval: billingInterval,
      stripePriceId: billingInterval === 'month' ? 'price_enterprise_monthly' : 'price_enterprise_yearly',
      cta: 'Contact Sales',
      features: [
        'Unlimited shipments',
        'Custom AI model training',
        'Advanced security & compliance',
        'Dedicated infrastructure',
        'Custom integrations & workflows',
        'White-label solution',
        '24/7 dedicated support',
        'Implementation & training'
      ]
    }
  ];

  const handleSubscribe = async (plan: PricingPlan) => {
    if (plan.id === 'enterprise') {
      // Handle enterprise contact
      window.location.href = 'mailto:sales@desicargo.com?subject=Enterprise Plan Inquiry';
      return;
    }

    setLoadingPlan(plan.id);
    
    try {
      // Mock Stripe Checkout integration
      console.log('Redirecting to Stripe Checkout for:', plan);
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Welcome to DesiCargo ${plan.name}! Check your email for next steps.`);
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-32 bg-gradient-to-b from-gray-50 to-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <Badge className="bg-green-100 text-green-800 border-green-200 px-6 py-3 mb-8">
            <DollarSign className="w-4 h-4 mr-2" />
            Transparent Pricing
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            Scale with confidence
            <br />
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              predictable pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-12 font-medium">
            Start free, scale as you grow. Every plan includes a 30-day free trial with full platform access.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-2xl p-2 mb-16">
            <button
              onClick={() => setBillingInterval('month')}
              className={cn(
                "px-8 py-4 rounded-xl font-semibold transition-all",
                billingInterval === 'month'
                  ? "bg-white text-gray-900 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={cn(
                "px-8 py-4 rounded-xl font-semibold transition-all relative",
                billingInterval === 'year'
                  ? "bg-white text-gray-900 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Yearly
              <Badge className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-3 py-1">
                Save 20%
              </Badge>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-semibold">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <Card className={cn(
                "relative p-10 h-full transition-all duration-500 border-2",
                plan.popular
                  ? "border-blue-500 shadow-2xl shadow-blue-500/20 bg-gradient-to-b from-blue-50/50 via-white to-white"
                  : "border-gray-200 shadow-xl hover:shadow-2xl bg-white hover:border-gray-300"
              )}>
                <CardContent className="p-0 space-y-8 h-full flex flex-col">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      {plan.popular && (
                        <Star className="w-6 h-6 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <p className="text-gray-600 font-medium mb-6">{plan.description}</p>
                    
                    <div className="mb-6">
                      <span className="text-6xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600 ml-2 text-lg">
                        /{plan.interval}
                      </span>
                      {billingInterval === 'year' && plan.id !== 'enterprise' && (
                        <p className="text-sm text-green-600 mt-2 font-medium">
                          Save ${Math.round(plan.price * 12 * 0.2).toLocaleString()} annually
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loadingPlan === plan.id}
                    className={cn(
                      "w-full py-6 text-lg font-semibold rounded-xl transition-all",
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                        : "border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-50 text-gray-900 bg-white"
                    )}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {loadingPlan === plan.id ? (
                      <div className="flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2"
                        />
                        Processing...
                      </div>
                    ) : (
                      plan.cta
                    )}
                  </Button>

                  <div className="space-y-4 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-20 space-y-8"
        >
          <p className="text-gray-600 font-medium">Trusted by leading logistics companies worldwide</p>
          <div className="flex items-center justify-center space-x-12 text-gray-500">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6" />
              <span className="font-medium">SOC 2 Certified</span>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-6 h-6" />
              <span className="font-medium">Stripe Powered</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-6 h-6" />
              <span className="font-medium">99.99% Uptime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// About Us section featuring Mohammed Ateeq
const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="about" className="py-32 bg-gradient-to-b from-white to-gray-50" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 px-6 py-3 mb-8">
            <Users className="w-4 h-4 mr-2" />
            About DesiCargo
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            Built by logistics experts
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              for logistics leaders
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Founder Story */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-gray-900">
                Founded by Innovation Pioneer
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed font-medium">
                DesiCargo was founded by <strong>Mohammed Ateeq</strong>, former Senior Software Engineer at Google, 
                where he built large-scale distributed systems serving billions of users. After witnessing the 
                inefficiencies in traditional logistics operations, Mohammed set out to create the most intelligent 
                logistics platform ever built.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed font-medium">
                Drawing from his experience with Google's world-class engineering culture and cutting-edge AI research, 
                Mohammed assembled a team of ex-Google, ex-Amazon, and logistics industry veterans to reimagine 
                how supply chains should work in the digital age.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">8+</div>
                <div className="text-gray-600 font-medium">Years at Google</div>
              </div>
              <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">50M+</div>
                <div className="text-gray-600 font-medium">Users Impacted</div>
              </div>
            </div>
          </motion.div>

          {/* Visual Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-2xl">
              <CardContent className="p-0 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">MA</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900">Mohammed Ateeq</h4>
                    <p className="text-gray-600 font-medium">Founder & CEO</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className="bg-blue-100 text-blue-800 text-xs">Ex-Google</Badge>
                      <Badge className="bg-purple-100 text-purple-800 text-xs">AI Expert</Badge>
                    </div>
                  </div>
                </div>

                <blockquote className="text-lg text-gray-700 italic leading-relaxed border-l-4 border-blue-500 pl-6">
                  "At Google, I learned that the best products are invisible to users – they just work. 
                  That's exactly what we've built with DesiCargo. Complex logistics operations that feel effortless."
                </blockquote>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700 font-medium">Senior Software Engineer, Google Cloud Platform</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700 font-medium">Led teams building systems for 1B+ users</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700 font-medium">Specialized in distributed systems & machine learning</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Company Values */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24"
        >
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-16">Our Mission & Values</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-8 h-8" />,
                title: "Mission-Driven",
                description: "Democratize world-class logistics technology for businesses of all sizes across emerging markets."
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Innovation First",
                description: "Leverage cutting-edge AI and engineering excellence to solve real-world logistics challenges."
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Customer Success",
                description: "Our success is measured by the growth and efficiency gains of our customers' operations."
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                  {value.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h4>
                <p className="text-gray-600 leading-relaxed font-medium">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Enterprise testimonials
const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "CEO & Founder",
      company: "Mumbai Logistics Pvt Ltd",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
      content: "DesiCargo transformed our entire operation. We went from managing 100 shipments a day to 1,000+ with the same team. The AI routing alone saved us ₹2 crores annually.",
      rating: 5,
      metrics: "300% growth in shipment volume"
    },
    {
      name: "Priya Sharma",
      role: "Head of Operations",
      company: "Delhi Distribution Networks",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
      content: "The real-time visibility and customer portal features are game-changers. Our NPS score improved from 6 to 9.2, and customer complaints reduced by 85%.",
      rating: 5,
      metrics: "85% reduction in complaints"
    },
    {
      name: "Arjun Patel",
      role: "Logistics Director",
      company: "Gujarat Cargo Solutions",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
      content: "Best ROI we've seen from any software investment. The automation features eliminated 80% of manual work. My team now focuses on strategy instead of data entry.",
      rating: 5,
      metrics: "400% ROI in first year"
    }
  ];

  return (
    <section id="testimonials" className="py-32 bg-gradient-to-b from-gray-50 to-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-6 py-3 mb-8">
            <Star className="w-4 h-4 mr-2" />
            Customer Success Stories
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            Trusted by logistics
            <br />
            <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              leaders nationwide
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto font-medium">
            See how industry leaders are transforming their operations and achieving unprecedented growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="p-8 h-full shadow-xl hover:shadow-2xl transition-all duration-500 bg-white border-0">
                <CardContent className="p-0 space-y-6 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs font-medium">
                      {testimonial.metrics}
                    </Badge>
                  </div>
                  
                  <blockquote className="text-gray-700 text-lg leading-relaxed font-medium flex-1">
                    "{testimonial.content}"
                  </blockquote>
                  
                  <div className="flex items-center space-x-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover shadow-lg"
                    />
                    <div>
                      <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                      <div className="text-gray-600 font-medium">{testimonial.role}</div>
                      <div className="text-blue-600 text-sm font-semibold">{testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional social proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-20"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { metric: "4.9/5", label: "Customer Rating" },
              { metric: "99.9%", label: "Uptime SLA" },
              { metric: "30 sec", label: "Avg Response Time" },
              { metric: "24/7", label: "Support Coverage" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{item.metric}</div>
                <div className="text-gray-600 font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Premium footer
const FooterSection = () => {
  return (
    <footer className="bg-gray-900 text-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">DC</span>
              </div>
              <div>
                <span className="font-bold text-2xl">DesiCargo</span>
                <div className="text-gray-400 text-sm">Logistics Intelligence Platform</div>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed font-medium max-w-md">
              The world's most intelligent logistics platform. Built by ex-Google engineers, 
              trusted by enterprise customers, designed for the future of supply chain.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <Mail className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <Globe className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-white">Platform</h3>
            <ul className="space-y-4 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors font-medium">Fleet Management</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Route Optimization</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Real-time Tracking</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Analytics Dashboard</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">API & Integrations</a></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-white">Solutions</h3>
            <ul className="space-y-4 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors font-medium">3PL & Freight</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">E-commerce</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Manufacturing</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Enterprise</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">White Label</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-white">Company</h3>
            <ul className="space-y-4 text-gray-300">
              <li><a href="#about" className="hover:text-white transition-colors font-medium">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Press</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors font-medium">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-8">
              <p className="text-gray-400 text-sm">
                © 2024 DesiCargo Technologies Pvt Ltd. All rights reserved.
              </p>
              <div className="hidden lg:flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>SOC 2 Type II</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>ISO 27001</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main component
export default function AppleLandingPage() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navigation isScrolled={isScrolled} />
      <HeroSection />
      <PlatformSection />
      <SolutionsSection />
      <PricingSection />
      <AboutSection />
      <TestimonialsSection />
      <FooterSection />
    </div>
  );
}