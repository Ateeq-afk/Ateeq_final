import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Truck, Calendar, MapPin, Tag, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useBranches } from '@/hooks/useBranches';
import { motion } from 'framer-motion';

const formSchema = z.object({
  vehicle_number: z.string().regex(/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/, {
    message: 'Invalid vehicle number format (e.g., KA01AB1234)',
  }),
  type: z.enum(['own', 'hired', 'attached']),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  status: z.enum(['active', 'maintenance', 'inactive']),
  branch_id: z.string().min(1, 'Branch is required'),
  color: z.string().optional(),
  fuel_type: z
    .enum(['diesel', 'petrol', 'cng', 'electric', 'hybrid'])
    .optional(),
  capacity: z.string().optional(),
  registration_date: z.string().optional(),
  insurance_expiry: z.string().optional(),
  fitness_expiry: z.string().optional(),
  permit_expiry: z.string().optional(),
  last_maintenance_date: z.string().optional(),
  next_maintenance_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
  vehicleId?: string; // if editing
}

export default function VehicleForm({ onCancel, onSuccess, vehicleId }: Props) {
  const { branches } = useBranches();
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingVehicle, setLoadingVehicle] = useState(!!vehicleId);
  const totalSteps = 3;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      status: 'active',
      type: 'own',
      fuel_type: 'diesel',
    },
  });
  useEffect(() => {
    if (vehicleId) {
      fetch(`http://locahost:4000/vehicles/${vehicleId}`)
        .then((res) => res.json())
        .then((data) => {
          reset(data);
        })
        .finally(() => setLoadingVehicle(false));
    }
  }, [vehicleId]);
  const onSubmitForm = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const response = await fetch(
        vehicleId
          ? `http://locahost:4000/vehicles/${vehicleId}`
          : 'http://locahost:4000/vehicles/create',
        {
          method: vehicleId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      alert(' submitting form');
      if (!response.ok) alert('error submitting form');

      onSuccess();
    } catch (err) {
      console.error('Submit error', err);
      alert('error submitting form');
    } finally {
      setSubmitting(false);
    }
  };
  const onError = (errors: any) => {
    const firstErrorField = Object.keys(errors)[0];
    const message =
      errors[firstErrorField]?.message || 'Please correct the error.';
    alert(message);
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };
  if (loadingVehicle) return <p>Loading vehicle data...</p>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-8"
    >
      <div className="mb-8">
        <Button
          variant="ghost"
          className="-ml-4 mb-4 flex items-center gap-2"
          onClick={onCancel}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold mb-2">
          {vehicleId ? 'Edit Vehicle' : 'Add Vehicle'}
        </h2>
        <p className="text-gray-600 mt-1">
          {vehicleId
            ? 'Update vehicle details'
            : 'Add a new vehicle to your fleet'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <div
                  className={`flex-1 h-1 ${
                    index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                ></div>
              )}
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  index + 1 === currentStep
                    ? 'bg-blue-500 text-white'
                    : index + 1 < currentStep
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm text-gray-600">Basic Info</span>
          <span className="text-sm text-gray-600">Details</span>
          <span className="text-sm text-gray-600">Documents</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmitForm, onError)} noValidate>
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div>
              <Label>Branch</Label>
              <Select
                defaultValue={watch('branch_id')}
                onValueChange={(val) => setValue('branch_id', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} - {branch.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branch_id && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.branch_id.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Vehicle Number</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    {...register('vehicle_number')}
                    placeholder="Enter vehicle number"
                    className="pl-10 uppercase"
                  />
                </div>
                {errors.vehicle_number && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.vehicle_number.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Type</Label>
                <Select
                  defaultValue={watch('type')}
                  onValueChange={(val) => setValue('type', val as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">Own</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="attached">Attached</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.type.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Make</Label>
                <Input
                  {...register('make')}
                  placeholder="Enter make (e.g. Tata, Mahindra)"
                />
                {errors.make && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.make.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Model</Label>
                <Input
                  {...register('model')}
                  placeholder="Enter model (e.g. Ace, Bolero)"
                />
                {errors.model && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.model.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Year</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="number"
                    {...register('year', { valueAsNumber: true })}
                    placeholder="Enter year"
                    className="pl-10"
                  />
                </div>
                {errors.year && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.year.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  defaultValue={watch('status')}
                  onValueChange={(val) => setValue('status', val as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">
                      Under Maintenance
                    </SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.status.message}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Additional Details */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Color</Label>
                <Input
                  {...register('color')}
                  placeholder="Enter vehicle color"
                />
              </div>

              <div>
                <Label>Fuel Type</Label>
                <Select
                  defaultValue={watch('fuel_type') || 'diesel'}
                  onValueChange={(value) => setValue('fuel_type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="cng">CNG</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Capacity</Label>
                <Input
                  {...register('capacity')}
                  placeholder="Enter capacity (e.g. 1 ton, 20 ft)"
                />
              </div>

              <div>
                <Label>Registration Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="date"
                    {...register('registration_date')}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Notes</Label>
                <textarea
                  {...register('notes')}
                  placeholder="Enter any additional notes about this vehicle"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Document Information */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Insurance Expiry Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="date"
                    {...register('insurance_expiry')}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Fitness Certificate Expiry</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="date"
                    {...register('fitness_expiry')}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Permit Expiry Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="date"
                    {...register('permit_expiry')}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Last Maintenance Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="date"
                    {...register('last_maintenance_date')}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Next Maintenance Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="date"
                    {...register('next_maintenance_date')}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex justify-between gap-4 mt-8">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep}>
              Previous
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}

          {currentStep < 3 ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {vehicleId ? 'Updating...' : 'Adding...'}
                </>
              ) : vehicleId ? (
                'Update Vehicle'
              ) : (
                'Add Vehicle'
              )}
            </Button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
