import React, { useState, useEffect } from 'react';
import { FileText, X, Calendar, Upload, Download, Printer, Trash, Plus, Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVehicles } from '@/hooks/useVehicles';
import { motion } from 'framer-motion';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { Badge } from '@/components/ui/badge';

interface Props {
  vehicleId: string;
  onClose: () => void;
}

interface Document {
  id: string;
  name: string;
  number: string;
  issuedDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  fileUrl?: string;
}

export default function VehicleDocuments({ vehicleId, onClose }: Props) {
  const { vehicles } = useVehicles();
  const [vehicle, setVehicle] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const { showSuccess, showError } = useNotificationSystem();
  
  const [newDocument, setNewDocument] = useState({
    name: '',
    number: '',
    issuedDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    file: null as File | null
  });

  // Mock documents
  const mockDocuments: Document[] = [
    {
      id: '1',
      name: 'Registration Certificate',
      number: 'RC123456789',
      issuedDate: '2022-01-15',
      expiryDate: '2027-01-14',
      status: 'valid'
    },
    {
      id: '2',
      name: 'Insurance Policy',
      number: 'INS987654321',
      issuedDate: '2023-11-01',
      expiryDate: '2024-10-31',
      status: 'valid'
    },
    {
      id: '3',
      name: 'Pollution Certificate',
      number: 'PUC654321',
      issuedDate: '2023-12-01',
      expiryDate: '2024-05-31',
      status: 'valid'
    },
    {
      id: '4',
      name: 'Fitness Certificate',
      number: 'FC123789',
      issuedDate: '2023-06-15',
      expiryDate: '2024-06-14',
      status: 'expiring_soon'
    }
  ];

  useEffect(() => {
    if (vehicles.length > 0 && vehicleId) {
      const foundVehicle = vehicles.find(v => v.id === vehicleId);
      if (foundVehicle) {
        setVehicle(foundVehicle);
        
        // In a real app, we would fetch documents from the API
        // For now, use mock data
        setTimeout(() => {
          setDocuments(mockDocuments);
          setLoading(false);
        }, 500);
      }
    }
  }, [vehicles, vehicleId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewDocument(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewDocument(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewDocument(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      // Validate form
      if (!newDocument.name || !newDocument.number || !newDocument.issuedDate || !newDocument.expiryDate) {
        showError('Validation Error', 'Please fill in all required fields');
        return;
      }
      
      // In a real app, we would upload the file and create the document
      // For now, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add new document to the list
      const newDoc: Document = {
        id: Date.now().toString(),
        name: newDocument.name,
        number: newDocument.number,
        issuedDate: newDocument.issuedDate,
        expiryDate: newDocument.expiryDate,
        status: 'valid',
        fileUrl: newDocument.file ? URL.createObjectURL(newDocument.file) : undefined
      };
      
      setDocuments(prev => [...prev, newDoc]);
      showSuccess('Document Added', 'Document has been successfully added');
      
      // Reset form
      setNewDocument({
        name: '',
        number: '',
        issuedDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        file: null
      });
      
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add document:', error);
      showError('Upload Failed', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      // In a real app, we would delete the document from the API
      // For now, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove document from the list
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      showSuccess('Document Deleted', 'Document has been successfully deleted');
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
      showError('Delete Failed', 'Failed to delete document. Please try again.');
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'valid':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Valid</Badge>;
      case 'expiring_soon':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Expiring Soon</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Expired</Badge>;
      default:
        return null;
    }
  };

  if (!vehicle || loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 p-8">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Vehicle Documents</h2>
              <p className="text-gray-600">{vehicle.vehicle_number} - {vehicle.make} {vehicle.model}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Document Button */}
          {!showAddForm && (
            <div className="mb-6">
              <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Document
              </Button>
            </div>
          )}
          
          {/* Add Document Form */}
          {showAddForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 rounded-xl p-6 border border-blue-100 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-blue-900">Add New Document</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowAddForm(false)}
                  className="h-8 w-8 text-blue-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={handleAddDocument} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-blue-900">Document Type</Label>
                    <Select 
                      value={newDocument.name} 
                      onValueChange={(value) => handleSelectChange('name', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Registration Certificate">Registration Certificate</SelectItem>
                        <SelectItem value="Insurance Policy">Insurance Policy</SelectItem>
                        <SelectItem value="Pollution Certificate">Pollution Certificate</SelectItem>
                        <SelectItem value="Fitness Certificate">Fitness Certificate</SelectItem>
                        <SelectItem value="Tax Receipt">Tax Receipt</SelectItem>
                        <SelectItem value="Permit">Permit</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="number" className="text-blue-900">Document Number</Label>
                    <Input
                      id="number"
                      name="number"
                      placeholder="Enter document number"
                      value={newDocument.number}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="issuedDate" className="text-blue-900">Issue Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                      <Input
                        id="issuedDate"
                        name="issuedDate"
                        type="date"
                        value={newDocument.issuedDate}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="expiryDate" className="text-blue-900">Expiry Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                      <Input
                        id="expiryDate"
                        name="expiryDate"
                        type="date"
                        value={newDocument.expiryDate}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="file" className="text-blue-900">Upload Document</Label>
                    <div className="mt-2 border-2 border-dashed border-blue-200 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="file" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-blue-500 mb-2" />
                          <p className="text-sm text-blue-700 mb-1">
                            {newDocument.file ? newDocument.file.name : 'Click to upload or drag and drop'}
                          </p>
                          <p className="text-xs text-blue-600">PDF, JPG, PNG (max. 5MB)</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Add Document
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
          
          {/* Documents List */}
          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Documents Found</h3>
                <p className="text-gray-600 mt-1">Add your first document to get started</p>
                <Button onClick={() => setShowAddForm(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
            ) : (
              documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                          {getStatusBadge(doc.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Number: {doc.number}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Issued: {new Date(doc.issuedDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className={
                              doc.status === 'expired' 
                                ? 'text-red-600' 
                                : doc.status === 'expiring_soon' 
                                ? 'text-yellow-600' 
                                : ''
                            }>
                              Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Printer className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Print</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setDocumentToDelete(doc.id)}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Document Preview (if available) */}
                  {doc.fileUrl && (
                    <div className="mt-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="aspect-[16/9] bg-gray-100 rounded flex items-center justify-center">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </motion.div>
      
      {/* Delete Confirmation Dialog */}
      {documentToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Document</h3>
                <p className="text-gray-600">Are you sure you want to delete this document? This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setDocumentToDelete(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteDocument(documentToDelete)}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}