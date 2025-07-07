import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Heart, Users, Award, Globe, Shield, Rocket, CheckCircle, Building2, Calendar, TrendingUp, Mail, Phone, MapPin, Linkedin, Twitter, Star, Briefcase, BookOpen, Lightbulb, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';

export default function AboutPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const milestones = [
    {
      year: '2018',
      title: 'The Beginning',
      description: 'Started with a vision to digitize India\'s logistics industry',
      icon: <Rocket className="h-5 w-5" />
    },
    {
      year: '2019',
      title: 'First 100 Clients',
      description: 'Reached our first milestone of 100 active logistics companies',
      icon: <Users className="h-5 w-5" />
    },
    {
      year: '2020',
      title: 'Pan-India Expansion',
      description: 'Expanded operations to cover 100+ cities across India',
      icon: <Globe className="h-5 w-5" />
    },
    {
      year: '2021',
      title: 'AI Integration',
      description: 'Launched AI-powered route optimization and predictive analytics',
      icon: <Lightbulb className="h-5 w-5" />
    },
    {
      year: '2022',
      title: '1 Million Deliveries',
      description: 'Celebrated processing our 1 millionth successful delivery',
      icon: <Award className="h-5 w-5" />
    },
    {
      year: '2024',
      title: 'Industry Leader',
      description: 'Recognized as India\'s #1 logistics management platform',
      icon: <Star className="h-5 w-5" />
    }
  ];

  const values = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: 'Customer First',
      description: 'Every decision we make starts with how it will benefit our customers.',
      color: 'red'
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Innovation',
      description: 'We constantly push boundaries to bring cutting-edge solutions to logistics.',
      color: 'blue'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Trust & Security',
      description: 'We protect your data with bank-grade security and complete transparency.',
      color: 'green'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Collaboration',
      description: 'We work together with our partners to create win-win solutions.',
      color: 'purple'
    }
  ];

  const team = [
    {
      name: 'Rahul Sharma',
      role: 'Founder & CEO',
      bio: 'Former logistics head at a Fortune 500 company with 15+ years of industry experience.',
      image: '👨‍💼',
      linkedin: '#'
    },
    {
      name: 'Priya Mehta',
      role: 'Co-founder & CTO',
      bio: 'Tech visionary with expertise in AI/ML and scalable cloud architectures.',
      image: '👩‍💼',
      linkedin: '#'
    },
    {
      name: 'Amit Patel',
      role: 'VP of Sales',
      bio: 'Sales strategist who has helped 500+ logistics companies transform digitally.',
      image: '👨‍💼',
      linkedin: '#'
    },
    {
      name: 'Sarah Khan',
      role: 'Head of Customer Success',
      bio: 'Passionate about ensuring every customer achieves their business goals.',
      image: '👩‍💼',
      linkedin: '#'
    }
  ];

  const stats = [
    { value: '15K+', label: 'Active Customers' },
    { value: '500+', label: 'Cities Covered' },
    { value: '2M+', label: 'Monthly Deliveries' },
    { value: '98%', label: 'Customer Retention' }
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <Button
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section 
        className="pt-20 pb-32 px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div variants={itemVariants}>
            <Badge className="mb-6 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              <Building2 className="h-3 w-3 mr-1" />
              Our Story
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-brand-700 to-blue-600 dark:from-brand-500 dark:to-blue-400 text-transparent bg-clip-text"
            variants={itemVariants}
          >
            Building the Future of Logistics
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed"
            variants={itemVariants}
          >
            We're on a mission to revolutionize India's logistics industry by making it more efficient, transparent, and accessible for businesses of all sizes.
          </motion.p>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            variants={itemVariants}
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <h3 className="text-4xl md:text-5xl font-bold text-brand-600 dark:text-brand-400 mb-2">
                  {stat.value}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -top-4 -left-4 h-20 w-20 bg-brand-100 dark:bg-brand-900/30 rounded-full blur-xl" />
              <Card className="relative h-full border-brand-200 dark:border-brand-700">
                <CardContent className="p-8">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white mb-6">
                    <Target className="h-7 w-7" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Our Mission</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    To empower every logistics business in India with cutting-edge technology that simplifies operations, reduces costs, and delivers exceptional customer experiences. We believe that efficient logistics is the backbone of a thriving economy.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -top-4 -right-4 h-20 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-xl" />
              <Card className="relative h-full border-blue-200 dark:border-blue-700">
                <CardContent className="p-8">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white mb-6">
                    <Rocket className="h-7 w-7" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Our Vision</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    To become the most trusted logistics platform globally, setting new standards for efficiency and innovation. We envision a world where distance is no barrier to business, and every package reaches its destination on time, every time.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-700 to-blue-600 dark:from-brand-500 dark:to-blue-400 text-transparent bg-clip-text">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From a small startup to India's leading logistics platform
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-brand-200 via-brand-400 to-brand-600 dark:from-brand-700 dark:via-brand-500 dark:to-brand-300" />
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-8 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <Card className="inline-block">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-3">
                          {index % 2 !== 0 && (
                            <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                              {milestone.icon}
                            </div>
                          )}
                          <div className={index % 2 === 0 ? 'text-right' : 'text-left'}>
                            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{milestone.year}</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{milestone.title}</h3>
                          </div>
                          {index % 2 === 0 && (
                            <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                              {milestone.icon}
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Center dot */}
                  <div className="relative z-10">
                    <div className="h-4 w-4 rounded-full bg-brand-500 dark:bg-brand-400 ring-4 ring-white dark:ring-gray-800" />
                  </div>
                  
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-700 to-blue-600 dark:from-brand-500 dark:to-blue-400 text-transparent bg-clip-text">
              Our Core Values
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const colorClasses = {
                red: 'from-red-500 to-rose-500',
                blue: 'from-blue-500 to-cyan-500',
                green: 'from-green-500 to-emerald-500',
                purple: 'from-purple-500 to-pink-500'
              };

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group"
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className={`h-16 w-16 mx-auto rounded-full bg-gradient-to-br ${colorClasses[value.color as keyof typeof colorClasses]} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        {value.icon}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-700 to-blue-600 dark:from-brand-500 dark:to-blue-400 text-transparent bg-clip-text">
              Meet Our Leadership
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The visionaries driving DesiCargo's success
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card className="h-full text-center hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-100 to-blue-100 dark:from-brand-900/30 dark:to-blue-900/30 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300">
                      {member.image}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{member.name}</h3>
                    <p className="text-brand-600 dark:text-brand-400 font-medium mb-3">{member.role}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{member.bio}</p>
                    <a
                      href={member.linkedin}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="text-sm">Connect</span>
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-r from-brand-600 to-blue-600 dark:from-brand-800 dark:to-blue-900">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Join Our Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Be part of the logistics revolution. Transform your business with DesiCargo today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/signup')}
                className="bg-white text-brand-600 hover:bg-blue-50"
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/contact')}
                className="border-white text-white hover:bg-white/10"
              >
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-700 to-blue-600 dark:from-brand-500 dark:to-blue-400 text-transparent bg-clip-text">
              Our Offices
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Visit us at any of our locations across India
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mumbai (HQ)</h3>
              <p className="text-gray-600 dark:text-gray-400">
                123 Logistics Park<br />
                Andheri East, Mumbai 400093<br />
                <a href="tel:+919876543210" className="text-brand-600 dark:text-brand-400 hover:underline">+91 98765 43210</a>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delhi NCR</h3>
              <p className="text-gray-600 dark:text-gray-400">
                456 Tech Hub<br />
                Sector 62, Noida 201301<br />
                <a href="tel:+911123456789" className="text-brand-600 dark:text-brand-400 hover:underline">+91 11 2345 6789</a>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Bangalore</h3>
              <p className="text-gray-600 dark:text-gray-400">
                789 Innovation Center<br />
                Koramangala, Bangalore 560034<br />
                <a href="tel:+918023456789" className="text-brand-600 dark:text-brand-400 hover:underline">+91 80 2345 6789</a>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 border-t border-gray-800">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">DesiCargo</span>
                <span className="text-xs text-gray-400 ml-2">K2K Logistics</span>
              </div>
            </div>
            
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="mailto:info@desicargo.com" className="hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            
            <p className="text-sm text-gray-500">
              © 2025 DesiCargo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}