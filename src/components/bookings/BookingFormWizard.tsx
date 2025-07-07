import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Truck, 
  User, 
  Calendar, 
  IndianRupee, 
  Loader2, 
  FileText, 
  Info, 
  AlertTriangle, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  X,
  MapPin,
  Receipt,
  Settings
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { bookingService } from "@/services/bookings";
import { cn } from "@/lib/utils";

// Import existing form steps components (we'll create these)
import { BasicInformationStep } from './wizard-steps/BasicInformationStep';
import { RouteInformationStep } from './wizard-steps/RouteInformationStep';
import { ContactInformationStep } from './wizard-steps/ContactInformationStep';
import { ArticleDetailsStep } from './wizard-steps/ArticleDetailsStep';
import { FreightCalculationStep } from './wizard-steps/FreightCalculationStep';
import { ServicesInvoiceStep } from './wizard-steps/ServicesInvoiceStep';

// Validation schema (simplified for wizard)
const bookingSchema = z.object({
  // Basic Information
  lr_number: z.string().optional(),
  booking_type: z.enum(['paid', 'tbb', 'fob']).default('paid'),
  payment_mode: z.enum(['cash', 'credit', 'advance']).default('cash'),
  
  // Route Information
  from_location: z.string().min(1, 'From location is required'),
  to_location: z.string().min(1, 'To location is required'),
  
  // Contact Information  
  sender_name: z.string().min(1, 'Sender name is required'),
  sender_mobile: z.string().min(10, 'Valid mobile number required'),
  receiver_name: z.string().min(1, 'Receiver name is required'),
  receiver_mobile: z.string().min(10, 'Valid mobile number required'),
  
  // Article Details
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  actual_weight: z.number().min(0.1, 'Weight must be greater than 0'),
  charged_weight: z.number().optional(),
  description: z.string().min(1, 'Description is required'),
  
  // Freight Calculation
  freight_per_qty: z.number().min(0, 'Freight cannot be negative'),
  total_freight: z.number().min(0, 'Total freight cannot be negative'),
  
  // Optional fields
  customer_id: z.string().optional(),
  invoice_no: z.string().optional(),
  remarks: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormWizardProps {
  onClose: () => void;
  onBookingCreated?: (booking: any) => void;
  initialData?: Partial<BookingFormData>;
}

const WIZARD_STEPS = [
  {
    id: 'basic',
    title: 'Basic Information',
    icon: Info,
    description: 'Booking type and payment details',
    color: 'blue'
  },
  {
    id: 'route',
    title: 'Route Details',
    icon: MapPin,
    description: 'Source and destination',
    color: 'green'
  },
  {
    id: 'contacts',
    title: 'Contact Information',
    icon: User,
    description: 'Sender and receiver details',
    color: 'purple'
  },
  {
    id: 'articles',
    title: 'Article Details',
    icon: Package,
    description: 'Items being shipped',
    color: 'orange'
  },
  {
    id: 'freight',
    title: 'Freight Calculation',
    icon: IndianRupee,
    description: 'Pricing and charges',
    color: 'red'
  },
  {
    id: 'services',
    title: 'Services & Invoice',
    icon: Receipt,
    description: 'Additional services and billing',
    color: 'indigo'
  }
];

export const BookingFormWizard: React.FC<BookingFormWizardProps> = ({
  onClose,
  onBookingCreated,
  initialData = {}
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      booking_type: 'paid',
      payment_mode: 'cash',
      quantity: 1,
      actual_weight: 0,
      freight_per_qty: 0,
      total_freight: 0,
      ...initialData,
    },
    mode: 'onBlur'
  });

  const { watch, trigger, getValues, formState: { errors, isValid } } = form;

  // Calculate progress
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  // Validate current step
  const validateCurrentStep = async () => {
    const currentStepId = WIZARD_STEPS[currentStep].id;
    let fieldsToValidate: (keyof BookingFormData)[] = [];

    switch (currentStepId) {
      case 'basic':
        fieldsToValidate = ['booking_type', 'payment_mode'];
        break;
      case 'route':
        fieldsToValidate = ['from_location', 'to_location'];
        break;
      case 'contacts':
        fieldsToValidate = ['sender_name', 'sender_mobile', 'receiver_name', 'receiver_mobile'];
        break;
      case 'articles':
        fieldsToValidate = ['quantity', 'actual_weight', 'description'];
        break;
      case 'freight':
        fieldsToValidate = ['freight_per_qty', 'total_freight'];
        break;
      case 'services':
        // Optional step validation
        fieldsToValidate = [];
        break;
    }

    if (fieldsToValidate.length > 0) {
      const isStepValid = await trigger(fieldsToValidate);
      
      if (isStepValid) {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
      }
      
      return isStepValid;
    }
    
    return true;
  };

  // Navigation handlers
  const handleNext = async () => {
    const isStepValid = await validateCurrentStep();
    
    if (isStepValid && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else if (!isStepValid) {
      toast({
        title: "Please complete required fields",
        description: "Fill in all required information before proceeding",
        variant: "destructive"
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = async (stepIndex: number) => {
    // Allow clicking on previous steps or next step if current is valid
    if (stepIndex <= currentStep || (stepIndex === currentStep + 1 && await validateCurrentStep())) {
      setCurrentStep(stepIndex);
    }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    setIsDraftSaving(true);
    try {
      const formData = getValues();
      // Save to localStorage as draft
      localStorage.setItem('booking_draft', JSON.stringify({
        ...formData,
        savedAt: new Date().toISOString(),
        currentStep
      }));
      
      toast({
        title: "Draft Saved",
        description: "Your booking has been saved as a draft",
      });
    } catch (error) {
      toast({
        title: "Failed to save draft",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsDraftSaving(false);
    }
  };

  // Submit booking
  const handleSubmit = async () => {
    const isFormValid = await trigger();
    
    if (!isFormValid) {
      toast({
        title: "Please complete all required fields",
        description: "Check all steps for validation errors",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = getValues();
      const result = await bookingService.createBooking(formData);
      
      if (result.success) {
        toast({
          title: "Booking Created Successfully",
          description: `LR Number: ${result.data.lr_number}`,
        });
        
        // Clear draft
        localStorage.removeItem('booking_draft');
        
        onBookingCreated?.(result.data);
        onClose();
      } else {
        throw new Error(result.error || 'Failed to create booking');
      }
    } catch (error) {
      toast({
        title: "Failed to create booking",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('booking_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        form.reset(draft);
        setCurrentStep(draft.currentStep || 0);
        
        toast({
          title: "Draft Loaded",
          description: "Your previous booking draft has been restored",
        });
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [form]);

  const renderStepContent = () => {
    const stepId = WIZARD_STEPS[currentStep].id;
    
    switch (stepId) {
      case 'basic':
        return <BasicInformationStep form={form} />;
      case 'route':
        return <RouteInformationStep form={form} />;
      case 'contacts':
        return <ContactInformationStep form={form} />;
      case 'articles':
        return <ArticleDetailsStep form={form} />;
      case 'freight':
        return <FreightCalculationStep form={form} />;
      case 'services':
        return <ServicesInvoiceStep form={form} />;
      default:
        return null;
    }
  };

  const currentStepData = WIZARD_STEPS[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                `bg-${currentStepData.color}-100 text-${currentStepData.color}-600`
              )}>
                <StepIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentStepData.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {currentStepData.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Step {currentStep + 1} of {WIZARD_STEPS.length}
              </span>
              <span className="text-gray-600">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Step Navigation */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.has(index);
              const isCurrent = index === currentStep;
              const isAccessible = index <= currentStep || completedSteps.has(index);
              
              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && handleStepClick(index)}
                  disabled={!isAccessible}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    "border border-transparent",
                    isCurrent && `bg-${step.color}-100 text-${step.color}-700 border-${step.color}-200`,
                    isCompleted && !isCurrent && "bg-green-100 text-green-700 border-green-200",
                    !isCurrent && !isCompleted && isAccessible && "hover:bg-gray-100 text-gray-600",
                    !isAccessible && "opacity-50 cursor-not-allowed text-gray-400"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline whitespace-nowrap">
                    {step.title}
                  </span>
                  {isCompleted && <CheckCircle className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isDraftSaving}
                className="text-gray-600"
              >
                {isDraftSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < WIZARD_STEPS.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isValid}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Create Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};