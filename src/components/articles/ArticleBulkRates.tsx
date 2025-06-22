import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  // ---- State ----
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'adjust' | 'preview' | 'complete'>('select');
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [sortField, setSortField] = useState<'name' | 'base_rate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const timeoutRef = useRef<number>();

  const { articles, updateArticle } = useArticles();
  const { showSuccess, showError } = useNotificationSystem();

  // Cleanup any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ---- Filtering & Sorting ----
  const filteredArticles = useMemo(() => {
    return articles.filter((article) =>
      article.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [articles, searchQuery]);

  const sortedFilteredArticles = useMemo(() => {
    const arr = [...filteredArticles];
    const dir = sortDirection === 'asc' ? 1 : -1;
    return arr.sort((a, b) => {
      if (sortField === 'name') {
        return dir * a.name.localeCompare(b.name);
      }
      // base_rate
      return dir * (a.base_rate - b.base_rate);
    });
  }, [filteredArticles, sortField, sortDirection]);

  const toggleSort = (field: 'name' | 'base_rate') => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ---- Selection Logic ----
  const toggleArticleSelection = (id: string) =>
    setSelectedArticles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const selectAll = () => {
    if (selectedArticles.length === sortedFilteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(sortedFilteredArticles.map((a) => a.id));
    }
  };

  // ---- Step Navigation ----
  const handleNext = () => {
    if (step === 'select') {
      if (!selectedArticles.length) {
        showError('Selection Required', 'Please select at least one article');
        return;
      }
      setStep('adjust');
    } else if (step === 'adjust') {
      generatePreview();
      setStep('preview');
    }
  };

  const handleBack = () => {
    if (step === 'adjust') setStep('select');
    else if (step === 'preview') setStep('adjust');
  };

  // ---- Preview Generation ----
  const generatePreview = () => {
    const preview: PreviewItem[] = selectedArticles
      .map((id) => {
        const art = articles.find((a) => a.id === id);
        if (!art) return null;

        let newRate =
          adjustmentType === 'percentage'
            ? art.base_rate * (1 + adjustmentValue / 100)
            : art.base_rate + adjustmentValue;
        newRate = Math.max(0, newRate);

        const change = newRate - art.base_rate;
        const percentChange =
          art.base_rate > 0 ? (change / art.base_rate) * 100 : 0;

        return {
          id: art.id,
          name: art.name,
          description: art.description,
          currentRate: art.base_rate,
          newRate,
          change,
          percentChange,
        };
      })
      .filter((x): x is PreviewItem => !!x);

    setPreviewData(preview);
  };

  // ---- Apply Changes ----
  const handleApply = async () => {
    if (!previewData.length) return;

    setLoading(true);
    try {
      await Promise.all(
        previewData.map((item) =>
          updateArticle(item.id, { base_rate: item.newRate })
        )
      );
      showSuccess('Rates Updated', `Updated ${previewData.length} articles`);
      onClose();
      setStep('complete');
    } catch (err) {
      console.error(err);
      showError('Update Failed', 'Could not update all article rates');
    } finally {
      setLoading(false);
    }
  };

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Bulk Rate Management
          </h2>
          <p className="text-gray-600 mt-1">
            Update rates for multiple articles at once
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Step: Select */}
      {step === 'select' && (
        <>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={selectAll}>
                {selectedArticles.length === sortedFilteredArticles.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg">
              {/* Table header */}
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="w-12 px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedArticles.length ===
                              sortedFilteredArticles.length &&
                            sortedFilteredArticles.length > 0
                          }
                          onChange={selectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th
                        className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2 cursor-pointer"
                        onClick={() => toggleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Name
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">
                        Description
                      </th>
                      <th
                        className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-2 cursor-pointer"
                        onClick={() => toggleSort('base_rate')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Base Rate
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedFilteredArticles.length ? (
                      sortedFilteredArticles.map((art) => (
                        <tr key={art.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedArticles.includes(art.id)}
                              onChange={() => toggleArticleSelection(art.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">
                            {art.name}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {art.description || '–'}
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-medium">
                            ₹{art.base_rate.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p>No matching articles</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleNext} disabled={!selectedArticles.length}>
              Next: Adjust Rates
            </Button>
          </div>
        </>
      )}

      {/* Step: Adjust */}
      {step === 'adjust' && (
        <>
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
              <Tag className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-blue-800 font-medium">Rate Adjustment</p>
                <p className="text-blue-600 text-sm mt-1">
                  You are about to adjust rates for {selectedArticles.length}{' '}
                  articles.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type */}
              <div>
                <Label>Adjustment Type</Label>
                <Select
                  value={adjustmentType}
                  onValueChange={(v) =>
                    setAdjustmentType(v as 'percentage' | 'fixed')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Change</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Change</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  {adjustmentType === 'percentage'
                    ? 'e.g. +10% or –5%'
                    : 'e.g. +₹50 or –₹20'}
                </p>
              </div>

              {/* Value */}
              <div>
                <Label>Adjustment Value</Label>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-r-none h-10"
                    onClick={() =>
                      setAdjustmentValue((p) =>
                        p - (adjustmentType === 'percentage' ? 5 : 10)
                      )
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {adjustmentType === 'percentage' ? '%' : '₹'}
                    </span>
                    <Input
                      type="number"
                      className="pl-8 text-center rounded-none"
                      value={adjustmentValue}
                      onChange={(e) =>
                        setAdjustmentValue(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-l-none h-10"
                    onClick={() =>
                      setAdjustmentValue((p) =>
                        p + (adjustmentType === 'percentage' ? 5 : 10)
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {adjustmentValue === 0
                    ? 'No change'
                    : `${adjustmentValue > 0 ? '+' : ''}${
                        adjustmentType === 'percentage'
                          ? `${adjustmentValue}%`
                          : `₹${adjustmentValue}`
                      }`}
                </p>
              </div>
            </div>

            {/* Example */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                Example Calculation
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Current Rate:</span>
                  <span className="font-medium">₹100.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Adjustment:</span>
                  <span
                    className={`font-medium ${
                      adjustmentValue > 0
                        ? 'text-green-600'
                        : adjustmentValue < 0
                        ? 'text-red-600'
                        : ''
                    }`}
                  >
                    {adjustmentType === 'percentage'
                      ? `${adjustmentValue}% (₹${(100 * adjustmentValue / 100).toFixed(
                          2
                        )})`
                      : `₹${adjustmentValue.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>New Rate:</span>
                  <span>
                    ₹
                    {adjustmentType === 'percentage'
                      ? (100 * (1 + adjustmentValue / 100)).toFixed(2)
                      : (100 + adjustmentValue).toFixed(2)}
                  </span>
                </div>
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
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-yellow-800 font-medium">Review Changes</p>
                <p className="text-yellow-600 text-sm mt-1">
                  Confirm before updating base rates.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-medium text-gray-900">
                  Rate Changes Preview
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">
                        Article
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-2">
                        Current
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-2">
                        New
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-2">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((it) => (
                      <tr key={it.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">
                          <div className="font-medium">{it.name}</div>
                          {it.description && (
                            <div className="text-xs text-gray-500">
                              {it.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          ₹{it.currentRate.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-medium">
                          ₹{it.newRate.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              it.change > 0
                                ? 'bg-green-100 text-green-800'
                                : it.change < 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {it.change > 0 ? '+' : ''}
                            {it.change.toFixed(2)} (
                            {it.percentChange > 0 ? '+' : ''}
                            {it.percentChange.toFixed(1)}%)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={handleBack}>
              Back: Adjust
            </Button>
            <Button
              onClick={handleApply}
              disabled={loading || !previewData.length}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Apply Changes
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <div className="py-12 flex flex-col items-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Changes Applied
          </h3>
          <p className="text-gray-500 mt-1">
            Successfully updated {previewData.length} articles
          </p>
        </div>
      )}
    </div>
  );
}
