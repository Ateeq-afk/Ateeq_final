import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth';

const organizationSchema = z.object({
  organizationCode: z.string()
    .min(1, 'Organization code is required')
    .regex(/^[a-z0-9-]+$/, 'Organization code must contain only lowercase letters, numbers, and hyphens'),
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type OrganizationForm = z.infer<typeof organizationSchema>;
type LoginForm = z.infer<typeof loginSchema>;

export function OrganizationSignIn() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'organization' | 'login'>('organization');
  const [organizationData, setOrganizationData] = useState<{
    organization_id: string;
    organization_name: string;
    code: string;
  } | null>(null);

  const orgForm = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organizationCode: '',
    },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onOrganizationSubmit = async (values: OrganizationForm) => {
    try {
      setIsLoading(true);
      const data = await authService.checkOrganization(values.organizationCode);
      setOrganizationData(data);
      
      // Clear the login form when moving to login step
      loginForm.reset({
        username: '',
        password: '',
      });
      
      setStep('login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to verify organization',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onLoginSubmit = async (values: LoginForm) => {
    if (!organizationData) return;

    try {
      setIsLoading(true);
      
      const data = await authService.organizationLogin(
        organizationData.code,
        values.username,
        values.password
      );

      // Store auth data
      await signIn(data);
      
      toast({
        title: 'Success',
        description: 'Welcome back!',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to sign in',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToOrganization = () => {
    setStep('organization');
    setOrganizationData(null);
    loginForm.reset({
      username: '',
      password: '',
    });
  };

  // Ensure form is cleared when step changes
  useEffect(() => {
    if (step === 'login') {
      loginForm.reset({
        username: '',
        password: '',
      });
    }
  }, [step, loginForm]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">
            {step === 'organization' ? 'Enter Organization' : `Sign in to ${organizationData?.organization_name}`}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'organization' 
              ? 'Enter your organization code to continue'
              : 'Enter your username and password'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'organization' ? (
            <Form {...orgForm}>
              <form onSubmit={orgForm.handleSubmit(onOrganizationSubmit)} className="space-y-4">
                <FormField
                  control={orgForm.control}
                  name="organizationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="e.g., acme-logistics"
                          disabled={isLoading}
                          className="lowercase"
                          onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue
                      <LogIn className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...loginForm}>
              <form 
                key={`login-${organizationData?.code}`}
                onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
                className="space-y-4"
                autoComplete="off"
              >
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter your username"
                          disabled={isLoading}
                          autoComplete="off"
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter your password"
                          disabled={isLoading}
                          autoComplete="current-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleBackToOrganization}
                    disabled={isLoading}
                  >
                    Back to Organization
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}