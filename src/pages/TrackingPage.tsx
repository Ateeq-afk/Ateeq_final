import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Package, MapPin, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TrackingPage() {
  const { lrNumber } = useParams<{ lrNumber?: string }>();
  const navigate = useNavigate();
  const [searchLR, setSearchLR] = useState(lrNumber || '');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLR.trim()) return;
    
    setLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      if (searchLR === 'LR123456' || lrNumber === 'LR123456') {
        setTrackingData({
          lrNumber: 'LR123456',
          status: 'in_transit',
          sender: 'ABC Enterprises, Mumbai',
          receiver: 'XYZ Corp, Delhi',
          fromBranch: 'Mumbai HQ',
          toBranch: 'Delhi Branch',
          bookingDate: '2023-12-15',
          expectedDelivery: '2023-12-18',
          currentLocation: 'Jaipur Hub',
          article: 'Cloth Bundle',
          quantity: 5,
          weight: '25 kg'
        });
      } else {
        setError('No shipment found with this LR number');
        setTrackingData(null);
      }
      setLoading(false);
    }, 1000);
  };
  
  // Auto-search if LR number is provided in URL
  React.useEffect(() => {
    if (lrNumber && !trackingData) {
      handleSearch(new Event('submit') as any);
    }
  }, [lrNumber]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="-ml-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipment Tracking</h1>
            <p className="text-gray-600 mt-1">Track your shipment status and delivery information</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Input
                value={searchLR}
                onChange={(e) => setSearchLR(e.target.value)}
                placeholder="Enter LR Number"
                className="pl-4 pr-4 py-2 rounded-lg"
              />
            </div>
            <Button type="submit" disabled={loading || !searchLR.trim()}>
              {loading ? 'Searching...' : 'Track'}
            </Button>
          </form>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          
          {trackingData && (
            <div className="mt-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">LR #{trackingData.lrNumber}</h2>
                    <p className="text-gray-600">Booked on {trackingData.bookingDate}</p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {trackingData.status === 'delivered' ? 'Delivered' : 
                   trackingData.status === 'in_transit' ? 'In Transit' : 'Booked'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-4">Shipment Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Article</p>
                        <p className="font-medium">{trackingData.article} • {trackingData.quantity} units • {trackingData.weight}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Route</p>
                        <p className="font-medium">{trackingData.fromBranch} → {trackingData.toBranch}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Expected Delivery</p>
                        <p className="font-medium">{trackingData.expectedDelivery}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-4">Customer Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Sender</p>
                      <p className="font-medium">{trackingData.sender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Receiver</p>
                      <p className="font-medium">{trackingData.receiver}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-6">Tracking Timeline</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="relative flex items-start gap-4 mb-8">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center z-10">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="font-medium text-gray-900">Booking Created</h4>
                      <p className="text-sm text-gray-500">{trackingData.bookingDate}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Booking created at {trackingData.fromBranch}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative flex items-start gap-4 mb-8">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center z-10">
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="font-medium text-gray-900">In Transit</h4>
                      <p className="text-sm text-gray-500">2023-12-16</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Shipment in transit from {trackingData.fromBranch} to {trackingData.toBranch}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center z-10">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="font-medium text-gray-900">Delivery Pending</h4>
                      <p className="text-sm text-gray-500">Expected: {trackingData.expectedDelivery}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Shipment will be delivered to {trackingData.receiver}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {!trackingData && !loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900">Track Your Shipment</h3>
              <p className="text-gray-600 mt-2 max-w-md mx-auto">
                Enter your LR number above to track your shipment and get real-time updates on its status.
              </p>
              <p className="text-gray-500 mt-4 text-sm">
                Try using sample LR number: LR123456
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}