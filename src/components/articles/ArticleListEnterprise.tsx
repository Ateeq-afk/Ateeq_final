import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Grid3X3,
  List,
  ArrowUpDown,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  FileText,
  Settings2,
  Filter,
  Zap,
  Users,
  Building2,
  Hash,
} from 'lucide-react';

// Import our enterprise UI components
import { Button, IconButton, ButtonGroup, FAB } from '@/components/ui/button-enterprise';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, MetricCard } from '@/components/ui/card-enterprise';
import { StatsCard, StatsGrid, MiniStats, AnimatedCounter } from '@/components/ui/stats-card';
import { DataTable } from '@/components/ui/data-table-enterprise';
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
import { Separator } from '@/components/ui/separator';
import { ListEmptyState } from '@/components/ui/empty-state';

// Hooks and types
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/contexts/AuthContext';
import type { Article } from '@/types';
import { useArticles } from '@/hooks/useArticles';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

// Sub-components
import ArticleForm from './ArticleFormEnterprise';
import ArticleDetails from './ArticleDetailsEnterprise';
import ArticleImport from './ArticleImport';
import ArticleExport from './ArticleExport';
import ArticleBulkRates from './ArticleBulkRates';

// Design tokens and utils
import { designTokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

// Constants
const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
  ANALYTICS: 'analytics',
} as const;

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];

type ViewMode = typeof VIEW_MODES[keyof typeof VIEW_MODES];

interface ArticleFilters {
  search: string;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  status?: string;
}

export default function ArticleListEnterprise() {
  // —— UI State ——
  const [showForm, setShowForm] = useState(false);
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showBulkRates, setShowBulkRates] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.GRID);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowForm(true);
      }
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
    
    // Additional analytics
    const priceRanges = {
      low: filtered.filter(a => a.base_rate < 1000).length,
      medium: filtered.filter(a => a.base_rate >= 1000 && a.base_rate < 5000).length,
      high: filtered.filter(a => a.base_rate >= 5000).length,
    };
    
    const recentlyAdded = filtered.filter(a => {
      const daysSinceAdded = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAdded <= 7;
    }).length;

    return { total, avgPrice, minPrice, maxPrice, priceRanges, recentlyAdded };
  }, [filtered]);

  // —— Handlers ——
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

  // —— Table Columns Configuration ——
  const tableColumns = useMemo(() => [
    {
      id: 'name',
      header: 'Article Name',
      accessor: (row: Article) => row.name,
      cell: (row: Article) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
            <Package className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.name}</p>
            {row.hsn_code && (
              <p className="text-xs text-neutral-500">HSN: {row.hsn_code}</p>
            )}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      accessor: (row: Article) => row.description || '—',
      cell: (row: Article) => (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
          {row.description || '—'}
        </p>
      ),
    },
    {
      id: 'base_rate',
      header: 'Base Rate',
      accessor: (row: Article) => row.base_rate,
      cell: (row: Article) => (
        <div className="text-right">
          <Badge variant="outline" className="font-mono text-sm">
            ₹{row.base_rate.toFixed(2)}
          </Badge>
        </div>
      ),
      sortable: true,
      align: 'right' as const,
    },
    {
      id: 'tax_rate',
      header: 'Tax',
      accessor: (row: Article) => row.tax_rate || 0,
      cell: (row: Article) => (
        <div className="text-center">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {row.tax_rate ? `${row.tax_rate}%` : '—'}
          </span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      id: 'created_at',
      header: 'Date Added',
      accessor: (row: Article) => row.created_at,
      cell: (row: Article) => (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      ),
      sortable: true,
    },
  ], []);

  // —— Loading State ——
  if (loading && articles.length === 0) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <Skeleton className="h-10 w-48" />
        <StatsGrid columns={4}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </StatsGrid>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
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
      <div className="p-6 max-w-4xl mx-auto">
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
        {/* Enhanced Header Section */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950 -mx-6 px-6 py-8 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                  <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl shadow-md">
                    <Package className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  Articles Management
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-lg">
                  Manage your article catalog, pricing, and inventory
                </p>
              </div>
              
              {/* Quick Stats Summary */}
              <div className="flex items-center gap-6">
                <MiniStats
                  title="Total Articles"
                  value={<AnimatedCounter value={statistics.total} />}
                  icon={<Package className="h-4 w-4 text-primary-600" />}
                  trend="neutral"
                />
                <MiniStats
                  title="Avg. Price"
                  value={`₹${statistics.avgPrice.toFixed(0)}`}
                  icon={<DollarSign className="h-4 w-4 text-green-600" />}
                  trend="up"
                />
                <MiniStats
                  title="New This Week"
                  value={statistics.recentlyAdded}
                  icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
                  trend="up"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Overview (shown in analytics view) */}
        {viewMode === VIEW_MODES.ANALYTICS && (
          <StatsGrid columns={4}>
            <StatsCard
              title="Total Articles"
              value={statistics.total}
              icon={<Package className="h-5 w-5" />}
              change={{ value: 12, type: 'increase' }}
              variant="gradient"
            />
            <StatsCard
              title="Average Price"
              value={`₹${statistics.avgPrice.toFixed(2)}`}
              icon={<DollarSign className="h-5 w-5" />}
              change={{ value: 5, type: 'increase' }}
            />
            <StatsCard
              title="Price Range"
              value={`₹${statistics.minPrice} - ₹${statistics.maxPrice}`}
              icon={<BarChart3 className="h-5 w-5" />}
              subtitle="Min to Max"
            />
            <StatsCard
              title="Recently Added"
              value={statistics.recentlyAdded}
              icon={<Calendar className="h-5 w-5" />}
              subtitle="Last 7 days"
              actionLabel="View all"
              onClick={() => setViewMode(VIEW_MODES.LIST)}
            />
          </StatsGrid>
        )}

        {/* Enhanced Action Bar */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search with filters */}
            <div className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search articles... (⌘K)"
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 h-11"
                />
              </div>
              
              {/* Advanced Filters */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Price Range</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.minPrice || ''}
                          onChange={e => setFilters(prev => ({ 
                            ...prev, 
                            minPrice: e.target.value ? Number(e.target.value) : undefined 
                          }))}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.maxPrice || ''}
                          onChange={e => setFilters(prev => ({ 
                            ...prev, 
                            maxPrice: e.target.value ? Number(e.target.value) : undefined 
                          }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Date Range</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Input
                          type="date"
                          value={filters.dateFrom || ''}
                          onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                        />
                        <Input
                          type="date"
                          value={filters.dateTo || ''}
                          onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => setFilters({ search: '' })}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* View Mode Selection */}
              <div className="flex border rounded-lg p-1 bg-background">
                <Button
                  variant={viewMode === VIEW_MODES.GRID ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(VIEW_MODES.GRID)}
                  className="px-3"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === VIEW_MODES.LIST ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(VIEW_MODES.LIST)}
                  className="px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === VIEW_MODES.ANALYTICS ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(VIEW_MODES.ANALYTICS)}
                  className="px-3"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
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

              <Separator orientation="vertical" className="h-8" />

              {/* Quick Actions */}
              <ButtonGroup>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  leftIcon={<RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />}
                >
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowImport(true)}
                  leftIcon={<Upload className="h-4 w-4" />}
                >
                  Import
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowExport(true)}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Export
                </Button>
              </ButtonGroup>

              <Button
                variant="outline"
                onClick={() => setShowBulkRates(true)}
                leftIcon={<Tag className="h-4 w-4" />}
              >
                Bulk Rates
              </Button>

              <Button
                variant="gradient"
                onClick={() => setShowForm(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Article
              </Button>
            </div>
          </div>
        </Card>

        {/* Selection Bar */}
        {selectedIds.length > 0 && (
          <Card variant="outlined" className="bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-primary-100 dark:bg-primary-900">
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
                  leftIcon={<Trash className="h-4 w-4" />}
                >
                  Delete Selected
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Area */}
        {viewMode === VIEW_MODES.GRID && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pageItems.length ? (
              pageItems.map(article => (
                <Card
                  key={article.id}
                  variant="elevated"
                  interactive
                  className={cn(
                    selectedIds.includes(article.id) && "ring-2 ring-primary-500"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setDetailsId(article.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl">
                            <Package className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle size="sm" className="truncate">
                              {article.name}
                            </CardTitle>
                            {article.hsn_code && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                <Hash className="h-3 w-3 mr-1" />
                                {article.hsn_code}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <IconButton
                            variant="ghost"
                            size="icon-sm"
                            icon={<MoreVertical className="h-4 w-4" />}
                            aria-label="More options"
                            onClick={(e) => e.stopPropagation()}
                          />
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
                    {article.description && (
                      <CardDescription className="mb-3 line-clamp-2">
                        {article.description}
                      </CardDescription>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Base Rate</span>
                        <Badge variant="secondary" className="font-mono text-base">
                          ₹{article.base_rate.toFixed(2)}
                        </Badge>
                      </div>
                      
                      {article.tax_rate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">Tax Rate</span>
                          <span className="text-sm font-medium">{article.tax_rate}%</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500 dark:text-neutral-500">
                          Added {new Date(article.created_at).toLocaleDateString()}
                        </span>
                        {article.is_fragile && (
                          <Badge variant="outline" className="text-xs">
                            Fragile
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card variant="outlined" className="p-0">
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
        )}

        {viewMode === VIEW_MODES.LIST && (
          <Card variant="elevated" className="overflow-hidden">
            <DataTable
              data={pageItems}
              columns={tableColumns}
              searchable={false}
              selectable
              onSelectionChange={(selected) => setSelectedIds(selected.map(item => item.id))}
              actions={(row) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton
                      variant="ghost"
                      size="icon-sm"
                      icon={<MoreVertical className="h-4 w-4" />}
                      aria-label="More options"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDetailsId(row.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setEditArticle(row);
                      setShowForm(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(row.id)}
                      className="text-red-600"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              striped
              hoverable
              stickyHeader
              emptyState={
                <ListEmptyState
                  type="articles"
                  searchQuery={filters.search}
                  onCreateNew={() => setShowForm(true)}
                  onClearSearch={() => setFilters({ search: '' })}
                />
              }
            />
          </Card>
        )}

        {viewMode === VIEW_MODES.ANALYTICS && (
          <div className="space-y-6">
            {/* Price Distribution */}
            <Card>
            <CardHeader>
              <CardTitle>Price Distribution</CardTitle>
              <CardDescription>Articles categorized by price ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {statistics.priceRanges.low}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Under ₹1,000</p>
                </div>
                <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {statistics.priceRanges.medium}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">₹1,000 - ₹5,000</p>
                </div>
                <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {statistics.priceRanges.high}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Above ₹5,000</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Articles by Price */}
          <Card>
            <CardHeader>
              <CardTitle>Top Articles by Price</CardTitle>
              <CardDescription>Your highest valued articles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filtered
                  .sort((a, b) => b.base_rate - a.base_rate)
                  .slice(0, 5)
                  .map((article, index) => (
                    <div key={article.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{article.name}</p>
                          <p className="text-xs text-neutral-500">{article.description || 'No description'}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        ₹{article.base_rate.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && viewMode !== VIEW_MODES.ANALYTICS && (
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
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
          </Card>
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

      {/* Floating Action Button (Mobile) */}
      <FAB
        position="bottom-right"
        onClick={() => setShowForm(true)}
        icon={<Plus className="h-6 w-6" />}
        aria-label="Add new article"
        className="lg:hidden"
      />
    </TooltipProvider>
  );
}

