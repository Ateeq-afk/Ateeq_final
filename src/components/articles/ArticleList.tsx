import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Package,
  MoreVertical,
  AlertCircle,
  Edit,
  Trash,
  Search,
  Upload,
  Download,
  Tag,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  ArrowUpDown,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ListEmptyState } from '@/components/ui/empty-state';

import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/contexts/AuthContext';
import type { Article } from '@/types';
import { useArticles } from '@/hooks/useArticles';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

import ArticleForm from './ArticleForm';
import ArticleDetails from './ArticleDetails';
import ArticleImport from './ArticleImport';
import ArticleExport from './ArticleExport';
import ArticleBulkRates from './ArticleBulkRates';

// Constants
const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
} as const;

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];

type ViewMode = typeof VIEW_MODES[keyof typeof VIEW_MODES];

interface ArticleFilters {
  search: string;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  action: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export default function ArticleList() {
  // —— UI State ——
  const [showForm, setShowForm] = useState(false);
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showBulkRates, setShowBulkRates] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.GRID);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // —— Filters & Sorting ——
  const [filters, setFilters] = useState<ArticleFilters>({ search: '' });
  const [sortField, setSortField] = useState<'name' | 'base_rate' | 'created_at'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  const { branches } = useBranches();
  const { getCurrentUserBranch } = useAuth();
  const userBranch = getCurrentUserBranch();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // —— Data Hooks ——
  const {
    articles,
    loading,
    error,
    createArticle,
    updateArticle,
    deleteArticle,
    refresh,
  } = useArticles();
  const { showSuccess, showError, showInfo } = useNotificationSystem();

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Cmd/Ctrl + N for new article
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowForm(true);
      }
      // Escape to clear selection
      if (e.key === 'Escape' && selectedIds.length > 0) {
        setSelectedIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedIds]);

  // Reset page on filter/sort change
  useEffect(() => {
    setPage(1);
  }, [filters, sortField, sortDir, perPage]);

  // —— Memoized Computations ——
  const filtered = useMemo(() => {
    let result = [...articles];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(searchLower) ||
        (a.description ?? '').toLowerCase().includes(searchLower)
      );
    }

    if (filters.minPrice !== undefined) {
      result = result.filter(a => a.base_rate >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      result = result.filter(a => a.base_rate <= filters.maxPrice!);
    }

    if (filters.dateFrom) {
      result = result.filter(a => new Date(a.created_at) >= new Date(filters.dateFrom!));
    }

    if (filters.dateTo) {
      result = result.filter(a => new Date(a.created_at) <= new Date(filters.dateTo!));
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'base_rate':
          comparison = a.base_rate - b.base_rate;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [articles, filters, sortField, sortDir]);

  // —— Pagination ——
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  // —— Statistics ——
  const statistics = useMemo(() => {
    const total = filtered.length;
    const avgPrice = total > 0 
      ? filtered.reduce((sum, a) => sum + a.base_rate, 0) / total 
      : 0;
    const minPrice = total > 0 
      ? Math.min(...filtered.map(a => a.base_rate))
      : 0;
    const maxPrice = total > 0
      ? Math.max(...filtered.map(a => a.base_rate))
      : 0;

    return { total, avgPrice, minPrice, maxPrice };
  }, [filtered]);

  const handleCreate = useCallback(async (data: any) => {
    try {
      await createArticle({
        ...data,
        branch_id: userBranch?.id || branches[0]?.id || '',
      });
      showSuccess('Article Created', `"${data.name}" has been added successfully`);
      setShowForm(false);
    } catch (error) {
      showError('Create Failed', 'Could not create article. Please try again.');
    }
  }, [createArticle, userBranch, branches, showSuccess, showError]);

  const handleUpdate = useCallback(async (data: any) => {
    if (!editArticle) return;
    try {
      await updateArticle(editArticle.id, data);
      showSuccess('Article Updated', `"${editArticle.name}" has been updated successfully`);
      setShowForm(false);
      setEditArticle(null);
    } catch (error) {
      showError('Update Failed', 'Could not update article. Please try again.');
    }
  }, [editArticle, updateArticle, showSuccess, showError]);

  const handleDelete = useCallback(async (id: string) => {
    const article = articles.find(a => a.id === id);
    if (!article) return;

    // Show confirmation dialog using browser confirm
    if (window.confirm(`Are you sure you want to delete "${article.name}"? This action cannot be undone.`)) {
      try {
        await deleteArticle(id);
        showSuccess('Article Deleted', `"${article.name}" has been removed`);
        setSelectedIds(prev => prev.filter(sid => sid !== id));
      } catch (error) {
        showError('Delete Failed', 'Could not delete article. Please try again.');
      }
    }
  }, [articles, deleteArticle, showSuccess, showError]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    // Show confirmation dialog using browser confirm
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} articles? This action cannot be undone.`)) {
      try {
        await Promise.all(selectedIds.map(id => deleteArticle(id)));
        showSuccess('Articles Deleted', `${selectedIds.length} articles have been removed`);
        setSelectedIds([]);
      } catch (error) {
        showError('Bulk Delete Failed', 'Some articles could not be deleted.');
      }
    }
  }, [selectedIds, deleteArticle, showSuccess, showError]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      showInfo('List Refreshed', 'Article list has been updated');
    } catch (error) {
      showError('Refresh Failed', 'Could not refresh the list');
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, showInfo, showError]);

  const toggleSort = useCallback((field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }, [sortField]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.length === pageItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pageItems.map(item => item.id));
    }
  }, [selectedIds.length, pageItems]);

  const copyToClipboard = useCallback((article: Article) => {
    const text = `${article.name}\nRate: ₹${article.base_rate}\n${article.description || ''}`;
    navigator.clipboard.writeText(text);
    showSuccess('Copied', 'Article details copied to clipboard');
  }, [showSuccess]);

  // —— Quick Actions ——
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'refresh',
      label: 'Refresh',
      icon: RefreshCw,
      action: handleRefresh,
      variant: 'outline',
      className: isRefreshing ? 'animate-spin' : '',
    },
    {
      id: 'import',
      label: 'Import',
      icon: Upload,
      action: () => setShowImport(true),
      variant: 'outline',
    },
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      action: () => setShowExport(true),
      variant: 'outline',
    },
    {
      id: 'bulk-rates',
      label: 'Bulk Rates',
      icon: Tag,
      action: () => setShowBulkRates(true),
      variant: 'outline',
    },
    {
      id: 'add',
      label: 'Add Article',
      icon: Plus,
      action: () => setShowForm(true),
      variant: 'default',
    },
  ], [handleRefresh, isRefreshing]);

  // —— Loading State ——
  if (loading && articles.length === 0) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <Skeleton className="h-10 w-48" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <span className="sr-only">Loading articles...</span>
      </div>
    );
  }

  // —— Error State ——
  if (error && articles.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load articles. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  // —— Form View ——
  if (showForm) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <ArticleForm
          initialData={editArticle ?? undefined}
          onSubmit={editArticle ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditArticle(null);
          }}
        />
      </div>
    );
  }

  // —— Main Render ——
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white border-b sticky top-0 z-20 -mx-6 px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
              <p className="text-gray-600 mt-1">
                Manage your article catalog and pricing
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                <p className="text-xs text-gray-600">Total Articles</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ₹{statistics.avgPrice.toFixed(0)}
                </p>
                <p className="text-xs text-gray-600">Avg. Price</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={searchInputRef}
              placeholder="Search articles... (⌘K)"
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 h-11"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={viewMode === VIEW_MODES.GRID ? 'default' : 'ghost'}
                    onClick={() => setViewMode(VIEW_MODES.GRID)}
                    className="px-3"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={viewMode === VIEW_MODES.LIST ? 'default' : 'ghost'}
                    onClick={() => setViewMode(VIEW_MODES.LIST)}
                    className="px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List View</TooltipContent>
              </Tooltip>
            </div>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={sortField === 'name'}
                  onCheckedChange={() => toggleSort('name')}
                >
                  Name {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortField === 'base_rate'}
                  onCheckedChange={() => toggleSort('base_rate')}
                >
                  Price {sortField === 'base_rate' && (sortDir === 'asc' ? '↑' : '↓')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortField === 'created_at'}
                  onCheckedChange={() => toggleSort('created_at')}
                >
                  Date Added {sortField === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Actions */}
            {quickActions.map(action => (
              <Tooltip key={action.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={action.variant}
                    onClick={action.action}
                    disabled={action.id === 'refresh' && isRefreshing}
                    className={action.className}
                  >
                    <action.icon className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">{action.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{action.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Selection Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-100">
                {selectedIds.length} selected
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
              >
                Clear selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Content Area */}
        {viewMode === VIEW_MODES.GRID ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pageItems.length ? (
              pageItems.map(article => (
                <Card
                  key={article.id}
                  className={`group hover:shadow-lg transition-all cursor-pointer ${
                    selectedIds.includes(article.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1"
                        onClick={() => setDetailsId(article.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">
                              {article.name}
                            </CardTitle>
                            {article.description && (
                              <CardDescription className="text-xs mt-1 line-clamp-2">
                                {article.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailsId(article.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditArticle(article);
                            setShowForm(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyToClipboard(article)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => toggleSelection(article.id)}
                            className="font-medium"
                          >
                            {selectedIds.includes(article.id) ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Deselect
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Select
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(article.id)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                        ₹{article.base_rate.toFixed(2)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card className="p-0">
                  <ListEmptyState
                    type="articles"
                    searchQuery={filters.search}
                    onCreateNew={() => setShowForm(true)}
                    onClearSearch={() => setFilters({ search: '' })}
                  />
                </Card>
              </div>
            )}
          </div>
        ) : (
          /* List View */
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === pageItems.length && pageItems.length > 0}
                        onChange={selectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th 
                      className="text-left px-4 py-3 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-900">
                      Description
                    </th>
                    <th 
                      className="text-right px-4 py-3 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('base_rate')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Base Rate
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="text-right px-4 py-3 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSort('created_at')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Date Added
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pageItems.length ? (
                    pageItems.map(article => (
                      <tr 
                        key={article.id}
                        className={`hover:bg-gray-50 ${
                          selectedIds.includes(article.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(article.id)}
                            onChange={() => toggleSelection(article.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td 
                          className="px-4 py-3 font-medium cursor-pointer"
                          onClick={() => setDetailsId(article.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            {article.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                          {article.description || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          ₹{article.base_rate.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {new Date(article.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailsId(article.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setEditArticle(article);
                                setShowForm(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(article.id)}
                                className="text-red-600"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <ListEmptyState
                          type="articles"
                          searchQuery={filters.search}
                          onCreateNew={() => setShowForm(true)}
                          onClearSearch={() => setFilters({ search: '' })}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
              </span>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => setPerPage(Number(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map(option => (
                    <SelectItem key={option} value={option.toString()}>
                      {option} per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(1)}
              >
                First
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (page <= 3) {
                    pageNum = idx + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = page - 2 + idx;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={page === pageNum ? 'default' : 'outline'}
                      onClick={() => setPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
              >
                Last
              </Button>
            </div>
          </div>
        )}

        {/* Dialogs */}
        <Dialog open={!!detailsId} onOpenChange={open => !open && setDetailsId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Article Details</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              {detailsId && (
                <ArticleDetails
                  article={articles.find(a => a.id === detailsId)!}
                  onClose={() => setDetailsId(null)}
                  onEdit={a => {
                    setEditArticle(a);
                    setDetailsId(null);
                    setShowForm(true);
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Articles</DialogTitle>
            </DialogHeader>
            <ArticleImport
              onClose={() => setShowImport(false)}
              onSuccess={() => {
                setShowImport(false);
                refresh();
                showSuccess('Import Complete', 'Articles have been imported successfully');
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showExport} onOpenChange={setShowExport}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Export Articles</DialogTitle>
            </DialogHeader>
            <ArticleExport
              articles={filtered}
              onClose={() => setShowExport(false)}
              onSuccess={() => {
                setShowExport(false);
                showSuccess('Export Complete', 'Articles have been exported successfully');
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkRates} onOpenChange={setShowBulkRates}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
            <ArticleBulkRates onClose={() => setShowBulkRates(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}