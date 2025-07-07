import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight, Search, Navigation, Zap } from 'lucide-react';

interface RouteInformationStepProps {
  form: UseFormReturn<any>;
}

// Common Indian cities for quick selection
const COMMON_LOCATIONS = [
  'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad'
];

export const RouteInformationStep: React.FC<RouteInformationStepProps> = ({ form }) => {
  const { register, watch, setValue, formState: { errors } } = form;
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  
  const fromLocation = watch('from_location');
  const toLocation = watch('to_location');

  const filteredFromLocations = COMMON_LOCATIONS.filter(city =>
    city.toLowerCase().includes(fromSearch.toLowerCase())
  );

  const filteredToLocations = COMMON_LOCATIONS.filter(city =>
    city.toLowerCase().includes(toSearch.toLowerCase())
  );

  const handleSwapLocations = () => {
    const currentFrom = fromLocation;
    const currentTo = toLocation;
    setValue('from_location', currentTo);
    setValue('to_location', currentFrom);
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-green-600" />
          <h3 className="font-medium text-green-900">Route Configuration</h3>
        </div>
        <p className="text-sm text-green-700">
          Define the pickup and delivery locations for this shipment. Make sure the locations are accurate for proper routing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* From Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
              From Location
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="from_location">Source City/Location</Label>
              <div className="relative">
                <Input
                  id="from_location"
                  {...register('from_location')}
                  placeholder="Enter pickup location"
                  value={fromLocation || ''}
                  onChange={(e) => {
                    setValue('from_location', e.target.value);
                    setFromSearch(e.target.value);
                  }}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.from_location && (
                <p className="text-sm text-red-600 mt-1">{errors.from_location.message}</p>
              )}
            </div>

            {/* Quick city selection for FROM */}
            {fromSearch && filteredFromLocations.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Quick Select:</Label>
                <div className="flex flex-wrap gap-2">
                  {filteredFromLocations.slice(0, 6).map((city) => (
                    <Button
                      key={city}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setValue('from_location', city);
                        setFromSearch('');
                      }}
                      className="text-xs h-7"
                    >
                      {city}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* To Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-3 w-3 bg-red-500 rounded-full"></div>
              To Location
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="to_location">Destination City/Location</Label>
              <div className="relative">
                <Input
                  id="to_location"
                  {...register('to_location')}
                  placeholder="Enter delivery location"
                  value={toLocation || ''}
                  onChange={(e) => {
                    setValue('to_location', e.target.value);
                    setToSearch(e.target.value);
                  }}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.to_location && (
                <p className="text-sm text-red-600 mt-1">{errors.to_location.message}</p>
              )}
            </div>

            {/* Quick city selection for TO */}
            {toSearch && filteredToLocations.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Quick Select:</Label>
                <div className="flex flex-wrap gap-2">
                  {filteredToLocations.slice(0, 6).map((city) => (
                    <Button
                      key={city}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setValue('to_location', city);
                        setToSearch('');
                      }}
                      className="text-xs h-7"
                    >
                      {city}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Route Visual & Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-lg flex-1">
              <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-900">
                {fromLocation || 'Select pickup location'}
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <ArrowRight className="h-6 w-6 text-gray-400" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapLocations}
                disabled={!fromLocation || !toLocation}
                className="h-8 w-8 p-0 rounded-full"
                title="Swap locations"
              >
                <Zap className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3 bg-red-50 px-4 py-3 rounded-lg flex-1">
              <div className="h-3 w-3 bg-red-500 rounded-full"></div>
              <span className="font-medium text-red-900">
                {toLocation || 'Select delivery location'}
              </span>
            </div>
          </div>

          {fromLocation && toLocation && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Route: {fromLocation} → {toLocation}
                </span>
                <Badge variant="default" className="bg-green-600 text-xs">
                  Confirmed
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Routes (if applicable) */}
      <Card className="bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-700">Popular Routes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              'Delhi → Mumbai',
              'Mumbai → Bangalore',
              'Chennai → Hyderabad',
              'Pune → Delhi'
            ].map((route) => (
              <Button
                key={route}
                variant="ghost"
                size="sm"
                onClick={() => {
                  const [from, to] = route.split(' → ');
                  setValue('from_location', from);
                  setValue('to_location', to);
                }}
                className="text-xs h-8 justify-start"
              >
                {route}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};