import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Calendar, 
  Package, 
  Truck, 
  Clock, 
  IndianRupee, 
  Edit, 
  Download, 
  Printer, 
  Share2,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBookings } from '@/hooks/useBookings';
import { useArticles } from '@/hooks/useArticles';
import { motion } from 'framer-motion';
import type { Customer } from '@/types';

interface Props {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
}

export default function CustomerDetails({ customer, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const { bookings } = useBookings();
  const { articles, getCustomerRates } = useArticles();
  const [customerRates, setCustomerRates] = useState<any[]>([]);

  // Filter bookings for this customer
  const customerBookings = bookings.filter(
    booking => booking.sender_id === customer.id || booking.receiver_id === customer.id
  );

  // Load customer rates
  React.useEffect(() => {
    const loadRates = async () => {
      try {
        const rates = await getCustomerRates(customer.id);
        setCustomerRates(rates);
      } catch (err) {
        console.error('Failed to load customer rates:', err);
      }
    };
    
    loadRates();
  }, [customer.id, getCustomerRates]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalBookings = customerBookings.length;
    const asSender = customerBookings.filter(b => b.sender_id === customer.id).length;
    const asReceiver = customerBookings.filter(b => b.receiver_id === customer.id).length;
    const totalSpend = customerBookings
      .filter(b => b.sender_id === customer.id && b.payment_type === 'Paid')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const pendingPayment = customerBookings
      .filter(b => b.receiver_id === customer.id && b.payment_type === 'To Pay' && b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    return {
      totalBookings,
      asSender,
      asReceiver,
      totalSpend,
      pendingPayment
    };
  }, [customerBookings, customer.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            customer.type === 'individual' 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-purple-100 text-purple-600'
          }`}>
            {customer.type === 'individual' ? (
              <User className="h-6 w-6" />
            ) : (
              <Building2 className="h-6 w-6" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
            <div className="flex items-center gap-2 text-gray-500">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                customer.type === 'individual'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {customer.type}
              </span>
              {customer.branch_name && (
                <span className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  {customer.branch_name}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button onClick={onEdit} className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          Edit Customer
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="rates">Custom Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Mobile Number</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{customer.mobile}</p>
                  </div>
                </div>
                
                {customer.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{customer.email}</p>
                    </div>
                  </div>
                )}
                
                {customer.address && (
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{customer.address}</p>
                        {(customer.city || customer.state) && (
                          <p className="text-gray-600">
                            {customer.city}{customer.city && customer.state && ', '}{customer.state} {customer.pincode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {customer.gst && (
                  <div>
                    <p className="text-sm text-gray-600">GST Number</p>
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{customer.gst}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600">Customer Since</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{new Date(customer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {customer.payment_terms && (
                  <div>
                    <p className="text-sm text-gray-600">Payment Terms</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {customer.payment_terms === 'immediate' ? 'Immediate' : 
                         customer.payment_terms === 'net15' ? 'Net 15 Days' :
                         customer.payment_terms === 'net30' ? 'Net 30 Days' :
                         customer.payment_terms === 'net45' ? 'Net 45 Days' :
                         customer.payment_terms === 'net60' ? 'Net 60 Days' : 
                         customer.payment_terms}
                      </p>
                    </div>
                  </div>
                )}
                
                {customer.credit_limit > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Credit Limit</p>
                    <div className="flex items-center gap-2 mt-1">
                      <IndianRupee className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">₹{customer.credit_limit.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h4 className="text-sm font-medium text-blue-700 mb-2">Total Bookings</h4>
              <p className="text-3xl font-bold text-blue-900">{stats.totalBookings}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="bg-white rounded-lg p-2">
                  <p className="text-xs text-gray-600">As Sender</p>
                  <p className="text-sm font-medium">{stats.asSender}</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <p className="text-xs text-gray-600">As Receiver</p>
                  <p className="text-sm font-medium">{stats.asReceiver}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <h4 className="text-sm font-medium text-green-700 mb-2">Total Spend</h4>
              <p className="text-3xl font-bold text-green-900">₹{stats.totalSpend.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-2">
                From {stats.asSender} bookings as sender
              </p>
            </div>
            
            <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
              <h4 className="text-sm font-medium text-yellow-700 mb-2">Pending Payment</h4>
              <p className="text-3xl font-bold text-yellow-900">₹{stats.pendingPayment.toLocaleString()}</p>
              <p className="text-sm text-yellow-600 mt-2">
                From {stats.asReceiver} bookings as receiver
              </p>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            {customerBookings.length > 0 ? (
              <div className="space-y-4">
                {customerBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {booking.sender_id === customer.id ? 'Sent a shipment' : 'Received a shipment'}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'in_transit'
                            ? 'bg-blue-100 text-blue-800'
                            : booking.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        LR #{booking.lr_number} - {booking.article?.name || 'Unknown Article'} ({booking.quantity} {booking.uom})
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{booking.from_branch_details?.name} → {booking.to_branch_details?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3.5 w-3.5" />
                          <span>₹{booking.total_amount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-900">No activity yet</h4>
                <p className="text-gray-500 mt-1">This customer hasn't made any bookings yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Booking History</h3>
              <p className="text-gray-600 mt-1">All bookings associated with this customer</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">LR Number</th>
                    <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Date</th>
                    <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Route</th>
                    <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Role</th>
                    <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Status</th>
                    <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerBookings.length > 0 ? (
                    customerBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-blue-600">{booking.lr_number}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {booking.from_branch_details?.name} → {booking.to_branch_details?.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.sender_id === customer.id
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {booking.sender_id === customer.id ? 'Sender' : 'Receiver'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'in_transit'
                              ? 'bg-blue-100 text-blue-800'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div>
                            <div className="font-medium">₹{booking.total_amount}</div>
                            <div className="text-xs text-gray-500">{booking.payment_type}</div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-gray-900">No bookings found</h4>
                        <p className="text-gray-500 mt-1">This customer hasn't made any bookings yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rates" className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Custom Article Rates</h3>
                  <p className="text-gray-600 mt-1">Special pricing for this customer</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRates(customer.id)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Manage Rates
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Article</th>
                    <th className="text-left text-sm font-medium text-gray-600 px-6 py-4">Description</th>
                    <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Base Rate</th>
                    <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Custom Rate</th>
                    <th className="text-right text-sm font-medium text-gray-600 px-6 py-4">Discount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerRates.length > 0 ? (
                    customerRates.map((rate) => {
                      const article = articles.find(a => a.id === rate.article_id);
                      if (!article) return null;
                      
                      const discount = ((article.base_rate - rate.rate) / article.base_rate) * 100;
                      
                      return (
                        <tr key={rate.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Package className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="font-medium">{article.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {article.description || 'No description'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            ₹{article.base_rate.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            ₹{rate.rate.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              discount > 0
                                ? 'bg-green-100 text-green-800'
                                : discount < 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {discount > 0 ? '-' : discount < 0 ? '+' : ''}
                              {Math.abs(discount).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-gray-900">No custom rates</h4>
                        <p className="text-gray-500 mt-1">This customer is using standard rates</p>
                        <Button 
                          onClick={() => setShowRates(customer.id)} 
                          variant="outline"
                          className="mt-4"
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          Set Custom Rates
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}