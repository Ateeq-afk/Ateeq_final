import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  AccessibleField, 
  AccessibleButton, 
  ScreenReaderOnly, 
  LiveRegion,
  FocusTrap 
} from './accessibility-helpers';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';
import { Label } from './label';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Example form schema with accessibility in mind
const accessibleFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  country: z.string().min(1, 'Please select a country'),
  bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  newsletter: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof accessibleFormSchema>;

interface AccessibleFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function AccessibleForm({ onSubmit, loading = false, className = '' }: AccessibleFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [announcement, setAnnouncement] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    watch,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(accessibleFormSchema),
    mode: 'onChange'
  });

  const watchedPassword = watch('password', '');

  const handleFormSubmit = async (data: FormData) => {
    try {
      setSubmitStatus('idle');
      setAnnouncement('Submitting form...');
      await onSubmit(data);
      setSubmitStatus('success');
      setAnnouncement('Form submitted successfully!');
      reset();
    } catch (error) {
      setSubmitStatus('error');
      setAnnouncement('Form submission failed. Please try again.');
    }
  };

  const getFieldStatus = (fieldName: keyof FormData) => {
    if (errors[fieldName]) return 'error';
    if (touchedFields[fieldName] && !errors[fieldName]) return 'success';
    return 'neutral';
  };

  const PasswordStrengthIndicator = ({ password }: { password: string }) => {
    const getStrength = () => {
      if (!password) return { score: 0, label: 'No password', color: 'gray' };
      if (password.length < 4) return { score: 1, label: 'Very weak', color: 'red' };
      if (password.length < 6) return { score: 2, label: 'Weak', color: 'orange' };
      if (password.length < 8) return { score: 3, label: 'Fair', color: 'yellow' };
      if (password.length < 12) return { score: 4, label: 'Good', color: 'green' };
      return { score: 5, label: 'Strong', color: 'blue' };
    };

    const strength = getStrength();

    return (
      <div className="mt-2" role="status" aria-live="polite">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                {
                  'bg-red-500': strength.color === 'red',
                  'bg-orange-500': strength.color === 'orange',
                  'bg-yellow-500': strength.color === 'yellow',
                  'bg-green-500': strength.color === 'green',
                  'bg-blue-500': strength.color === 'blue',
                  'bg-gray-300': strength.color === 'gray',
                }
              )}
              style={{ width: `${(strength.score / 5) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="text-xs text-gray-600 min-w-fit">
            {strength.label}
          </span>
        </div>
        <ScreenReaderOnly>
          Password strength: {strength.label}
        </ScreenReaderOnly>
      </div>
    );
  };

  return (
    <Card className={cn('max-w-2xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Create Account
        </CardTitle>
        <p className="text-gray-600 text-center">
          Fill out this form to create your account. All fields marked with an asterisk (*) are required.
        </p>
      </CardHeader>
      
      <CardContent>
        <FocusTrap enabled={loading}>
          <form 
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-6"
            noValidate
            aria-describedby="form-instructions"
          >
            <div id="form-instructions" className="sr-only">
              Use the Tab key to navigate between fields. Press Enter to submit the form.
            </div>

            {/* Full Name */}
            <AccessibleField
              id="fullName"
              label="Full Name"
              required
              error={errors.fullName?.message}
              hint="Enter your first and last name"
            >
              <div className="relative">
                <Input
                  {...register('fullName')}
                  type="text"
                  autoComplete="name"
                  className={cn(
                    getFieldStatus('fullName') === 'error' && 'border-red-500 focus:ring-red-500',
                    getFieldStatus('fullName') === 'success' && 'border-green-500 focus:ring-green-500'
                  )}
                />
                {getFieldStatus('fullName') === 'success' && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" aria-hidden="true" />
                )}
                {getFieldStatus('fullName') === 'error' && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" aria-hidden="true" />
                )}
              </div>
            </AccessibleField>

            {/* Email */}
            <AccessibleField
              id="email"
              label="Email Address"
              required
              error={errors.email?.message}
              hint="We'll use this to send you account updates"
            >
              <div className="relative">
                <Input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={cn(
                    getFieldStatus('email') === 'error' && 'border-red-500 focus:ring-red-500',
                    getFieldStatus('email') === 'success' && 'border-green-500 focus:ring-green-500'
                  )}
                />
                {getFieldStatus('email') === 'success' && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" aria-hidden="true" />
                )}
                {getFieldStatus('email') === 'error' && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" aria-hidden="true" />
                )}
              </div>
            </AccessibleField>

            {/* Password */}
            <AccessibleField
              id="password"
              label="Password"
              required
              error={errors.password?.message}
              hint="Must be at least 8 characters long"
            >
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={cn(
                    'pr-12',
                    getFieldStatus('password') === 'error' && 'border-red-500 focus:ring-red-500',
                    getFieldStatus('password') === 'success' && 'border-green-500 focus:ring-green-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={watchedPassword} />
            </AccessibleField>

            {/* Confirm Password */}
            <AccessibleField
              id="confirmPassword"
              label="Confirm Password"
              required
              error={errors.confirmPassword?.message}
              hint="Re-enter your password to confirm"
            >
              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={cn(
                    'pr-12',
                    getFieldStatus('confirmPassword') === 'error' && 'border-red-500 focus:ring-red-500',
                    getFieldStatus('confirmPassword') === 'success' && 'border-green-500 focus:ring-green-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </AccessibleField>

            {/* Phone Number */}
            <AccessibleField
              id="phoneNumber"
              label="Phone Number"
              required
              error={errors.phoneNumber?.message}
              hint="Enter a 10-digit phone number without spaces or dashes"
            >
              <Input
                {...register('phoneNumber')}
                type="tel"
                autoComplete="tel"
                placeholder="1234567890"
                maxLength={10}
                className={cn(
                  getFieldStatus('phoneNumber') === 'error' && 'border-red-500 focus:ring-red-500',
                  getFieldStatus('phoneNumber') === 'success' && 'border-green-500 focus:ring-green-500'
                )}
              />
            </AccessibleField>

            {/* Country */}
            <AccessibleField
              id="country"
              label="Country"
              required
              error={errors.country?.message}
            >
              <Select {...register('country')}>
                <SelectTrigger 
                  className={cn(
                    getFieldStatus('country') === 'error' && 'border-red-500 focus:ring-red-500',
                    getFieldStatus('country') === 'success' && 'border-green-500 focus:ring-green-500'
                  )}
                >
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="ca">Canada</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="in">India</SelectItem>
                  <SelectItem value="au">Australia</SelectItem>
                </SelectContent>
              </Select>
            </AccessibleField>

            {/* Bio (Optional) */}
            <AccessibleField
              id="bio"
              label="Bio"
              error={errors.bio?.message}
              hint="Tell us a little about yourself (optional, max 500 characters)"
            >
              <Textarea
                {...register('bio')}
                placeholder="A brief description about yourself..."
                maxLength={500}
                rows={4}
                className="resize-none"
              />
            </AccessibleField>

            {/* Checkboxes */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-gray-700">
                Preferences
              </legend>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    {...register('agreeToTerms')}
                    aria-describedby="terms-error"
                    className={errors.agreeToTerms ? 'border-red-500' : ''}
                  />
                  <div className="flex-1">
                    <Label htmlFor="agreeToTerms" className="text-sm">
                      I agree to the{' '}
                      <a 
                        href="/terms" 
                        className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a 
                        href="/privacy" 
                        className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Privacy Policy
                      </a>
                      <span className="text-red-500 ml-1" aria-label="required">*</span>
                    </Label>
                    {errors.agreeToTerms && (
                      <p id="terms-error" className="text-sm text-red-600 mt-1" role="alert">
                        {errors.agreeToTerms.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="newsletter"
                    {...register('newsletter')}
                  />
                  <Label htmlFor="newsletter" className="text-sm">
                    Subscribe to our newsletter for updates and special offers
                  </Label>
                </div>
              </div>
            </fieldset>

            {/* Submit Button */}
            <div className="pt-6">
              <AccessibleButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !isValid}
                className="w-full"
                ariaDescribedBy="submit-status"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </AccessibleButton>
              
              <div id="submit-status" className="mt-2 text-center">
                {submitStatus === 'success' && (
                  <Badge variant="default" className="bg-green-600">
                    ✓ Account created successfully!
                  </Badge>
                )}
                {submitStatus === 'error' && (
                  <Badge variant="destructive">
                    ✗ Failed to create account. Please try again.
                  </Badge>
                )}
              </div>
            </div>
          </form>
        </FocusTrap>

        {/* Live region for announcements */}
        <LiveRegion priority="polite">
          {announcement}
        </LiveRegion>
      </CardContent>
    </Card>
  );
}