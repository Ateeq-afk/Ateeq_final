import React, { useState, useEffect } from 'react';
import { Package, Save, X, Search, Plus, Minus, AlertCircle, Loader2, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useArticles } from '@/hooks/useArticles';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import type { Customer, Article, CustomerArticleRate } from '@/types';

interface Props {
  customer: Customer;
  onClose: () => void;
}

export default function CustomerArticleRates({ customer, onClose }: Props) {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'rate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { articles, getCustomerRates, updateCustomerRate } = useArticles(customer.branch_id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useNotificationSystem();

  useEffect(() => {
    loadRates();
  }, [customer.id]);

  const loadRates = async () => {
    try {
      setLoading(true);
      const customerRates = await getCustomerRates(customer.id);
      const ratesMap = customerRates.reduce((acc, rate) => {
        acc[rate.article_id] = rate.rate;
        return acc;
      }, {} as Record<string, number>);
      setRates(ratesMap);
    } catch (err) {
      console.error('Failed to load rates:', err);
      showError('Load Failed', 'Failed to load customer rates');
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (articleId: string, value: string) => {
    const rate = parseFloat(value) || 0;
    setRates(prev => ({
      ...prev,
      [articleId]: rate
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = Object.entries(rates).map(([articleId, rate]) => 
        updateCustomerRate(customer.id, articleId, rate)
      );
      await Promise.all(updates);
      showSuccess('Rates Updated', 'Customer rates have been updated successfully');
      onClose();
    } catch (err) {
      console.error('Failed to save rates:', err);
      showError('Save Failed', 'Failed to update customer rates');
    } finally {
      setSaving(false);
    }
  };

  const handleSort = (field: 'name' | 'rate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply search and sorting
  const filteredArticles = React.useMemo(() => {
    return articles
      .filter(article => 
        article.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (sortField === 'name') {
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else {
          const rateA = rates[a.id] || a.base_rate;
          const rateB = rates[b.id] || b.base_rate;
          return sortDirection === 'asc' 
            ? rateA - rateB
            : rateB - rateA;
        }
      });
  }, [articles, searchQuery, sortField, sortDirection, rates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Article Rates</h3>
          <p className="text-sm text-gray-500">Set custom rates for {customer.name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {filteredArticles.length} Articles
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSort('name')}
                className="text-xs flex items-center gap-1"
              >
                Name
                {sortField === 'name' && (
                  <span className="text-blue-600">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSort('rate')}
                className="text-xs flex items-center gap-1"
              >
                Rate
                {sortField === 'rate' && (
                  <span className="text-blue-600">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {filteredArticles.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredArticles.map((article) => {
                const customRate = rates[article.id];
                const hasCustomRate = customRate !== undefined;
                const discount = hasCustomRate 
                  ? ((article.base_rate - customRate) / article.base_rate) * 100
                  : 0;
                
                return (
                  <div key={article.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{article.name}</div>
                          {article.description && (
                            <div className="text-sm text-gray-500">{article.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Base Rate</div>
                          <div className="font-medium">₹{article.base_rate.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-end gap-4 mt-3">
                      <div className="flex-1">
                        <Label className="text-sm">Custom Rate</Label>
                        <div className="flex items-center mt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-r-none h-10"
                            onClick={() => {
                              const currentRate = rates[article.id] || article.base_rate;
                              handleRateChange(article.id, (currentRate - 5).toString());
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={customRate !== undefined ? customRate : article.base_rate}
                              onChange={(e) => handleRateChange(article.id, e.target.value)}
                              className="rounded-none pl-8 text-right"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="rounded-l-none h-10"
                            onClick={() => {
                              const currentRate = rates[article.id] || article.base_rate;
                              handleRateChange(article.id, (currentRate + 5).toString());
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="w-24 text-center">
                        {hasCustomRate && (
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            discount > 0
                              ? 'bg-green-100 text-green-800'
                              : discount < 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {discount > 0 ? (
                              <>
                                <span className="font-bold">{discount.toFixed(1)}%</span> discount
                              </>
                            ) : discount < 0 ? (
                              <>
                                <span className="font-bold">{Math.abs(discount).toFixed(1)}%</span> markup
                              </>
                            ) : (
                              'No change'
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-gray-900">No articles found</h4>
              <p className="text-gray-500 mt-1">Try adjusting your search or add new articles</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Rates
            </>
          )}
        </Button>
      </div>
    </div>
  );
}