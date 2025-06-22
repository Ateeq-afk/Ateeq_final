import React, { useState } from 'react';
import { Download, X, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Article } from '@/types';

interface Props {
  articles: Article[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ArticleExport({ articles, onClose, onSuccess }: Props) {
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'config' | 'exporting' | 'complete'>('config');
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
    name: true,
    description: true,
    base_rate: true,
    branch: true,
    hsn_code: true,
    tax_rate: true,
    unit_of_measure: true,
    min_quantity: true,
    is_fragile: true,
    requires_special_handling: true,
    notes: true
  });

  const toggleField = (field: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const selectAll = () => {
    const allSelected = Object.values(selectedFields).every(Boolean);
    const newValue = !allSelected;
    
    const newFields: Record<string, boolean> = {};
    Object.keys(selectedFields).forEach(field => {
      newFields[field] = newValue;
    });
    
    setSelectedFields(newFields);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setStep('exporting');
      
      // Get selected fields
      const fields = Object.entries(selectedFields)
        .filter(([_, selected]) => selected)
        .map(([field]) => field);
      
      // Create CSV content
      let content = fields.join(',') + '\n';
      
      articles.forEach(article => {
        const row = fields.map(field => {
          if (field === 'branch') {
            return article.branch_name || '';
          }
          return article[field] !== undefined ? article[field] : '';
        });
        content += row.join(',') + '\n';
      });
      
      // Create download link
      const blob = new Blob([content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `articles_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Simulate delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep('complete');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Failed to export articles:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Export Articles</h2>
          <p className="text-gray-600 mt-1">Export {articles.length} articles to a file</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {step === 'config' && (
        <>
          <div className="space-y-6">
            <div>
              <Label>Export Format</Label>
              <Select value={format} onValueChange={(value: 'csv' | 'excel') => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Choose the format for your exported data
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Fields to Export</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAll}
                  className="text-xs"
                >
                  {Object.values(selectedFields).every(Boolean) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                {Object.entries(selectedFields).map(([field, selected]) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`field-${field}`} 
                      checked={selected}
                      onCheckedChange={() => toggleField(field)}
                    />
                    <Label 
                      htmlFor={`field-${field}`}
                      className="text-sm font-normal cursor-pointer capitalize"
                    >
                      {field.replace(/_/g, ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={!Object.values(selectedFields).some(Boolean) || articles.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export {articles.length} Articles
            </Button>
          </div>
        </>
      )}

      {step === 'exporting' && (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Exporting Articles</h3>
          <p className="text-gray-500 mt-1">Please wait while we prepare your file...</p>
        </div>
      )}

      {step === 'complete' && (
        <div className="py-12 flex flex-col items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Export Complete</h3>
          <p className="text-gray-500 mt-1">Your file has been downloaded successfully</p>
        </div>
      )}
    </div>
  );
}