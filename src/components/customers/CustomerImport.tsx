import React, { useState } from 'react';
import { Upload, AlertTriangle, CheckCircle2, X, Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomers } from '@/hooks/useCustomers';
import { useBranches } from '@/hooks/useBranches';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerImport({ onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const { createCustomer } = useCustomers();
  const { branches } = useBranches();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    // Check file type
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    // Read file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Validate headers
        const requiredHeaders = ['name', 'mobile', 'type'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          setError(`Missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }
        
        // Parse data
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim());
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          // Validate required fields
          if (!row.name || !row.mobile || !row.type) {
            continue;
          }
          
          // Validate type
          if (row.type !== 'individual' && row.type !== 'company') {
            row.type = 'individual';
          }
          
          data.push(row);
        }
        
        setPreview(data);
        setError(null);
        setStep('preview');
      } catch (err) {
        console.error('Failed to parse CSV:', err);
        setError('Failed to parse CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      setStep('importing');
      
      // Import customers
      for (const customer of preview) {
        // Find branch by name if provided
        let branchId = null;
        if (customer.branch) {
          const branch = branches.find(b => 
            b.name.toLowerCase() === customer.branch.toLowerCase() ||
            b.code.toLowerCase() === customer.branch.toLowerCase()
          );
          if (branch) {
            branchId = branch.id;
          }
        }
        
        await createCustomer({
          name: customer.name,
          mobile: customer.mobile,
          type: customer.type,
          gst: customer.gst || null,
          branch_id: branchId || branches[0]?.id,
          email: customer.email || null,
          address: customer.address || null,
          city: customer.city || null,
          state: customer.state || null,
          pincode: customer.pincode || null,
          credit_limit: customer.credit_limit ? parseFloat(customer.credit_limit) : 0,
          payment_terms: customer.payment_terms || null
        });
      }
      
      setStep('complete');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Failed to import customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to import customers');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['name', 'mobile', 'type', 'gst', 'email', 'address', 'city', 'state', 'pincode', 'branch', 'credit_limit', 'payment_terms'];
    const csv = [
      headers.join(','),
      'John Doe,9876543210,individual,,john@example.com,123 Main St,Mumbai,Maharashtra,400001,Mumbai HQ,5000,net30',
      'ABC Company,9876543211,company,GSTIN1234567890,contact@abc.com,456 Business Park,Delhi,Delhi,110001,Delhi Branch,10000,net45'
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Import Customers</h2>
          <p className="text-gray-600 mt-1">Upload a CSV file to import multiple customers</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Import Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-blue-800 font-medium">CSV Format Requirements</p>
              <p className="text-blue-600 text-sm mt-1">
                Your CSV file must include the following columns: name, mobile, and type (individual/company).
                Optional columns: gst, email, address, city, state, pincode, branch, credit_limit, payment_terms.
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Upload CSV File</h3>
              <p className="text-gray-500 mt-1 mb-4 max-w-md">
                Drag and drop your CSV file here, or click to browse
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="max-w-xs"
              />
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Preview ({preview.length} customers)</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setStep('upload')}
                  className="flex items-center gap-1"
                >
                  <Upload className="h-4 w-4" />
                  Change File
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Name</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Mobile</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Type</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">GST</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Email</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Branch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {preview.map((customer, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{customer.name}</td>
                      <td className="px-4 py-2 text-sm">{customer.mobile}</td>
                      <td className="px-4 py-2 text-sm">{customer.type}</td>
                      <td className="px-4 py-2 text-sm">{customer.gst || '-'}</td>
                      <td className="px-4 py-2 text-sm">{customer.email || '-'}</td>
                      <td className="px-4 py-2 text-sm">{customer.branch || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={preview.length === 0}>
              Import {preview.length} Customers
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Importing Customers</h3>
          <p className="text-gray-500 mt-1">Please wait while we import your customers...</p>
        </div>
      )}

      {step === 'complete' && (
        <div className="py-12 flex flex-col items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Import Complete</h3>
          <p className="text-gray-500 mt-1">Successfully imported {preview.length} customers</p>
        </div>
      )}
    </div>
  );
}