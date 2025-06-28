import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Truck, Building2, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { createOrganization } from '@/services/api';

const formSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  displayName: z.string().min(2, 'Display name is required'),
  clientCode: z.string().min(2, 'Client code is required').max(10, 'Client code must be 10 characters or less'),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateOrganizationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      displayName: '',
      clientCode: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const org = await createOrganization(data.name);
      
      setSuccess(true);
      
      // Redirect to sign in page after 3 seconds
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
    } catch (err) {
      console.error('Organization creation failed', err);
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-500 dark:to-brand-700 flex items-center justify-center text-white shadow-md">
            <Truck className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-400 dark:to-brand-600 text-transparent bg-clip-text">
              DesiCargo
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">K2K Logistics</span>
          </div>
        </div>
        
        <Card className="p-8 shadow-lg border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white text-center">Create New Organization</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">Set up your logistics company on DesiCargo</p>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {success ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Organization Created!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your organization has been created successfully. Redirecting to sign in...
              </p>
              <Button 
                onClick={() => navigate('/signin')}
                className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-md"
              >
                Go to Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Organization Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    id="name" 
                    placeholder="Enter organization name"
                    className="pl-10 py-2 h-12"
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-gray-700 dark:text-gray-300">Display Name</Label>
                <Input 
                  id="displayName" 
                  placeholder="Enter display name"
                  className="py-2 h-12"
                  {...register('displayName')}
                />
                {errors.displayName && (
                  <p className="text-sm text-red-500 mt-1">{errors.displayName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientCode" className="text-gray-700 dark:text-gray-300">Client Code</Label>
                <Input 
                  id="clientCode" 
                  placeholder="Enter client code (e.g. ACME)"
                  className="py-2 h-12"
                  {...register('clientCode')}
                />
                {errors.clientCode && (
                  <p className="text-sm text-red-500 mt-1">{errors.clientCode.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Organization
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          )}
          
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/signin" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}