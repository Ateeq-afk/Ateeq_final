import React, { useState } from 'react';
import { Upload, AlertTriangle, CheckCircle2, X, Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useArticles } from '@/hooks/useArticles';
import { useBranches } from '@/hooks/useBranches';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ArticleImport({ onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const { createArticle } = useArticles();
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
        const requiredHeaders = ['name', 'base_rate'];
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
          if (!row.name || !row.base_rate) {
            continue;
          }
          
          // Convert numeric fields
          row.base_rate = parseFloat(row.base_rate);
          if (isNaN(row.base_rate)) {
            row.base_rate = 0;
          }
          
          if (row.tax_rate) {
            row.tax_rate = parseFloat(row.tax_rate);
            if (isNaN(row.tax_rate)) {
              row.tax_rate = 0;
            }
          }
          
          if (row.min_quantity) {
            row.min_quantity = parseInt(row.min_quantity);
            if (isNaN(row.min_quantity)) {
              row.min_quantity = 1;
            }
          }
          
          // Convert boolean fields
          if (row.is_fragile) {
            row.is_fragile = row.is_fragile.toLowerCase() === 'true' || row.is_fragile === '1';
          }
          
          if (row.requires_special_handling) {
            row.requires_special_handling = row.requires_special_handling.toLowerCase() === 'true' || row.requires_special_handling === '1';
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
      
      // Import articles
      for (const article of preview) {
        // Find branch by name if provided
        let branchId = null;
        if (article.branch) {
          const branch = branches.find(b => 
            b.name.toLowerCase() === article.branch.toLowerCase() ||
            b.code.toLowerCase() === article.branch.toLowerCase()
          );
          if (branch) {
            branchId = branch.id;
          }
        }
        
        await createArticle({
          name: article.name,
          description: article.description || '',
          base_rate: article.base_rate,
          branch_id: branchId || branches[0]?.id,
          hsn_code: article.hsn_code || '',
          tax_rate: article.tax_rate || 0,
          unit_of_measure: article.unit_of_measure || '',
          min_quantity: article.min_quantity || 1,
          is_fragile: article.is_fragile || false,
          requires_special_handling: article.requires_special_handling || false,
          notes: article.notes || ''
        });
      }
      
      setStep('complete');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Failed to import articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to import articles');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['name', 'description', 'base_rate', 'branch', 'hsn_code', 'tax_rate', 'unit_of_measure', 'min_quantity', 'is_fragile', 'requires_special_handling', 'notes'];
    const csv = [
      headers.join(','),
      'Cloth Bundle,Standard cloth bundles,100,Mumbai HQ,6302,18,bundle,1,false,false,Handle with care',
      'Garments,Ready-made garments,200,Delhi Branch,6309,12,pcs,1,true,true,Fragile items'
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'article_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Import Articles</h2>
          <p className="text-gray-600 mt-1">Upload a CSV file to import multiple articles</p>
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
                Your CSV file must include the following columns: name and base_rate.
                Optional columns: description, branch, hsn_code, tax_rate, unit_of_measure, min_quantity, is_fragile, requires_special_handling, notes.
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
                <h3 className="font-medium text-gray-900">Preview ({preview.length} articles)</h3>
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
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Description</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-2">Base Rate</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Branch</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">HSN Code</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-2">Tax Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {preview.map((article, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{article.name}</td>
                      <td className="px-4 py-2 text-sm">{article.description || '-'}</td>
                      <td className="px-4 py-2 text-sm text-right">₹{article.base_rate.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm">{article.branch || '-'}</td>
                      <td className="px-4 py-2 text-sm">{article.hsn_code || '-'}</td>
                      <td className="px-4 py-2 text-sm text-right">{article.tax_rate || '0'}%</td>
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
              Import {preview.length} Articles
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Importing Articles</h3>
          <p className="text-gray-500 mt-1">Please wait while we import your articles...</p>
        </div>
      )}

      {step === 'complete' && (
        <div className="py-12 flex flex-col items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Import Complete</h3>
          <p className="text-gray-500 mt-1">Successfully imported {preview.length} articles</p>
        </div>
      )}
    </div>
  );
}