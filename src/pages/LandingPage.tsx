import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Package, ArrowRight, CheckCircle, Users, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Check if user is on mobile
  const isMobile = window.innerWidth < 768;

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
      icon: <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      title: 'Fleet Management',
      description: 'Efficiently manage your entire fleet with real-time tracking and maintenance scheduling.'
    },
    {
      icon: <Package className="h-6 w-6 text-green-600 dark:text-green-400" />,
      title: 'Booking Management',
      description: 'Create and track bookings with ease, from pickup to delivery.'
    },
    {
      icon: <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
      title: 'Customer Management',
      description: 'Maintain detailed customer profiles and preferences for personalized service.'
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      title: 'Advanced Analytics',
      description: 'Gain insights with comprehensive reports and analytics dashboards.'
    },
    {
      icon: <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />,
      title: 'Secure Platform',
      description: 'Enterprise-grade security to protect your business data.'
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      title: 'Proof of Delivery',
      description: 'Digital POD with signature capture and photo evidence.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-500 dark:to-brand-700 flex items-center justify-center text-white shadow-md">
              <Truck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-400 dark:to-brand-600 text-transparent bg-clip-text">
                DesiCargo
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">K2K Logistics</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hidden md:flex"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
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
              className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-md"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section 
        className="pt-32 pb-20 md:pt-40 md:pb-32 px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div className="md:w-1/2 text-center md:text-left" variants={itemVariants}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-brand-700 to-blue-600 dark:from-brand-500 dark:to-blue-400 text-transparent bg-clip-text leading-tight">
                Streamline Your Logistics Operations
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto md:mx-0">
                DesiCargo provides a comprehensive solution for managing your entire logistics workflow from booking to delivery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-lg"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/signin')}
                  className="border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-900/30"
                >
                  Sign In
                </Button>
              </div>
            </motion.div>
            <motion.div 
              className="md:w-1/2 relative"
              variants={itemVariants}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-brand-500 rounded-3xl blur-3xl opacity-20 dark:opacity-30 transform -rotate-6"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img 
                    src="https://images.pexels.com/photos/7706458/pexels-photo-7706458.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Logistics Dashboard" 
                    className="w-full h-auto rounded-t-3xl"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Powerful Dashboard</h3>
                    <p className="text-gray-600 dark:text-gray-300">Get a complete overview of your logistics operations in one place.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-brand-700 to-blue-600 dark:from-brand-500 dark:to-blue-400 text-transparent bg-clip-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Comprehensive Logistics Management
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Everything you need to manage your logistics business efficiently in one platform.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={featureVariants}
                initial="hidden"
                animate="visible"
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-brand-700 to-blue-600 dark:from-brand-500 dark:to-blue-400 text-transparent bg-clip-text">
              Trusted by Logistics Companies
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              See what our customers have to say about DesiCargo.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-4">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">AB</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Amit Bansal</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CEO, Express Logistics</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "DesiCargo has transformed our logistics operations. The platform is intuitive and has helped us reduce operational costs by 30%."
              </p>
            </motion.div>

            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-4">
                  <span className="text-green-600 dark:text-green-400 font-bold">SP</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Sunita Patel</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Operations Manager, FastTrack Cargo</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "The real-time tracking and POD features have significantly improved our customer satisfaction. Our clients love the transparency."
              </p>
            </motion.div>

            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-4">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">RK</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Rajesh Kumar</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Director, Global Freight Solutions</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "We've been able to scale our operations across multiple branches seamlessly with DesiCargo. The analytics help us make data-driven decisions."
              </p>
            </motion.div>
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
                <li><a href="#" className="hover:text-brand-400 transition-colors">About Us</a></li>
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