import React, { useState, useMemo } from 'react';
import {
  Tag,
  Search,
  ArrowUpDown,
  Plus,
  Minus,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Article } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useArticles } from '@/hooks/useArticles';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

interface Props {
  onClose: () => void;
}

type Step = 'select' | 'adjust' | 'preview' | 'complete';
type AdjustType = 'percentage' | 'fixed';

interface PreviewItem {
  id: string;
  name: string;
  description?: string;
  currentRate: number;
  newRate: number;
  change: number;
  percentChange: number;
}

export default function ArticleBulkRates({ onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState<Step>('select');
  const [adjustType, setAdjustType] = useState<AdjustType>('percentage');
  const [adjustValue, setAdjustValue] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'base_rate'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const { articles, updateArticle } = useArticles();
  const { showSuccess, showError } = useNotificationSystem();

  const filtered = useMemo(
    () =>
      articles.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [articles, searchQuery]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortField === 'name') {
        return sortAsc
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      const aRate = a.base_rate ?? 0;
      const bRate = b.base_rate ?? 0;
      return sortAsc ? aRate - bRate : bRate - aRate;
    });
    return arr;
  }, [filtered, sortField, sortAsc]);

  // ---- Selection Logic ----
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.length === sorted.length ? [] : sorted.map((a) => a.id)
    );
  };

  // ---- Preview Generation ----
  const buildPreview = () => {
    const items: PreviewItem[] = selectedIds
      .map((id) => {
        const art = articles.find((a) => a.id === id);
        if (!art) return null;
        const base = art.base_rate ?? 0;
        let newRate =
          adjustType === 'percentage'
            ? base * (1 + adjustValue / 100)
            : base + adjustValue;
        newRate = Math.max(0, newRate);
        const change = newRate - base;
        const percentChange = base > 0 ? (change / base) * 100 : 0;
        return {
          id: art.id,
          name: art.name,
          description: art.description,
          currentRate: base,
          newRate,
          change,
          percentChange,
        };
      })
      .filter((x): x is PreviewItem => {
        return x !== null;
      });
    setPreviewItems(items);
  };

  // ---- Navigation Handlers ----
  const handleNext = () => {
    if (step === 'select') {
      if (!selectedIds.length) {
        showError('Selection Required', 'Select at least one article.');
        return;
      }
      setStep('adjust');
    } else if (step === 'adjust') {
      buildPreview();
      setStep('preview');
    }
  };

  const handleBack = () => {
    if (step === 'adjust') setStep('select');
    else if (step === 'preview') setStep('adjust');
  };

  const handleApply = async () => {
    if (!previewItems.length) return;
    setLoading(true);
    try {
      await Promise.all(
        previewItems.map((item) =>
          updateArticle(item.id, { base_rate: item.newRate })
        )
      );
      showSuccess('Rates Updated', `Updated ${previewItems.length} articles`);
      setStep('complete');
      onClose();
    } catch (e) {
      console.error(e);
      showError('Update Failed', 'Could not update all rates.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Bulk Rate Management</h2>
          <p className="text-gray-600">Adjust multiple article rates.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Step: Select */}
      {step === 'select' && (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={toggleAll}>
              {selectedIds.length === sorted.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="overflow-x-auto max-h-80 bg-white border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-12 px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === sorted.length && sorted.length > 0
                      }
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th
                    className="text-left px-4 py-2 cursor-pointer"
                    onClick={() => {
                      setSortField('name');
                      setSortAsc((asc) => (sortField === 'name' ? !asc : true));
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Name <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="text-left px-4 py-2">Description</th>
                  <th
                    className="text-right px-4 py-2 cursor-pointer"
                    onClick={() => {
                      setSortField('base_rate');
                      setSortAsc((asc) => (sortField === 'base_rate' ? !asc : true));
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Base Rate <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sorted.length ? (
                  sorted.map((art) => (
                    <tr key={art.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(art.id)}
                          onChange={() => toggleSelect(art.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2">{art.name}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {art.description || '–'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        ₹{(art.base_rate ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      <AlertCircle className="mx-auto mb-2 w-8 h-8 text-gray-300" />
                      No matching articles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleNext} disabled={!selectedIds.length}>
              Next: Adjust Rates
            </Button>
          </div>
        </>
      )}

      {/* Step: Adjust */}
      {step === 'adjust' && (
        <>
          <div className="p-4 bg-blue-50 border-blue-100 border rounded-lg flex items-start gap-3">
            <Tag className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Rate Adjustment</p>
              <p className="text-blue-600 text-sm">
                Adjusting {selectedIds.length} articles
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Adjustment Type</Label>
              <Select value={adjustType} onValueChange={(v) => setAdjustType(v as AdjustType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Change</SelectItem>
                  <SelectItem value="fixed">Fixed Amount Change</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-gray-500 text-sm mt-1">
                {adjustType === 'percentage'
                  ? 'e.g. +10% or –5%'
                  : 'e.g. +₹50 or –₹20'}
              </p>
            </div>
            <div>
              <Label>Adjustment Value</Label>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-r-none h-10"
                  onClick={() =>
                    setAdjustValue((pv) =>
                      pv - (adjustType === 'percentage' ? 5 : 10)
                    )
                  }
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {adjustType === 'percentage' ? '%' : '₹'}
                  </span>
                  <Input
                    type="number"
                    className="pl-8 text-center rounded-none"
                    value={adjustValue}
                    onChange={(e) => setAdjustValue(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-l-none h-10"
                  onClick={() =>
                    setAdjustValue((pv) =>
                      pv + (adjustType === 'percentage' ? 5 : 10)
                    )
                  }
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                {adjustValue === 0
                  ? 'No change'
                  : `${adjustValue > 0 ? '+' : ''}${
                      adjustType === 'percentage'
                        ? `${adjustValue}%`
                        : `₹${adjustValue}`
                    }`}
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Example Calculation</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Current Rate:</span>
                <span className="font-medium">₹100.00</span>
              </div>
              <div className="flex justify-between">
                <span>Adjustment:</span>
                <span
                  className={`font-medium ${
adjustValue > 0
                    ? 'text-green-600'
                    : adjustValue < 0
                    ? 'text-red-600'
                    : ''
                  }`}
                >
                  {adjustType === 'percentage'
                    ? `${adjustValue}% (₹${((100 * adjustValue) / 100).toFixed(2)})`
                    : `₹${adjustValue.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>New Rate:</span>
                <span>
                  ₹
                  {adjustType === 'percentage'
                    ? (100 * (1 + adjustValue / 100)).toFixed(2)
                    : (100 + adjustValue).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={handleBack}>
              Back: Select
            </Button>
            <Button onClick={handleNext}>Next: Preview</Button>
          </div>
        </>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <>
          <div className="p-4 bg-yellow-50 border rounded-lg border-yellow-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Review Changes</p>
              <p className="text-yellow-600 text-sm">Confirm before updating rates.</p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80 bg-white border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Article</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Current</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">New</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">
                      <div className="font-medium">{item.name}</div>
                      {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">₹{item.currentRate.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-sm font-medium">₹{item.newRate.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.change > 0
                          ? 'bg-green-100 text-green-800'
                          : item.change < 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.change > 0 ? '+' : ''}{item.change.toFixed(2)} ({item.percentChange > 0 ? '+' : ''}{item.percentChange.toFixed(1)}%)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={handleBack}>
              Back: Adjust
            </Button>
            <Button onClick={handleApply} disabled={loading} className="flex items-center gap-2">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</>
              ) : (
                <><Save className="w-4 h-4" /> Apply Changes</>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <div className="py-12 flex flex-col items-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Changes Applied</h3>
          <p className="text-gray-500 mt-1">Successfully updated {previewItems.length} articles.</p>
        </div>
      )}
    </div>
  );
}
