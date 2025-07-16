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
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
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
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ActivityIndicator, 
  MetricCardSkeleton, 
  NoSearchResults,
  LoadingCard,
  TransactionSkeleton,
  NoArticles
} from '@/components/ui/loading-states';
import { EmptyState } from '@/components/ui/empty-states';

// Apple-inspired Article Card Component
const AppleArticleCard: React.FC<{
  article: Article;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  onCopy: () => void;
}> = ({ article, index, isSelected, onSelect, onEdit, onDelete, onViewDetails, onCopy }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group relative bg-white/80 dark:bg-gray-900/80 rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer",
        "border-0",
        "shadow-lg hover:shadow-xl",
        "backdrop-blur-xl",
        "hover:bg-white/90 dark:hover:bg-gray-800/90",
        isSelected && "ring-2 ring-blue-500 dark:ring-blue-400"
      )}
      onClick={onViewDetails}
    >
      {/* Enhanced glass morphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />

      <div className="relative z-10 p-6">
        {/* Header with selection and actions */}
        <div className="flex items-start justify-between mb-6">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl"
          >
            <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="flex items-center gap-1"
            initial={{ opacity: 0, x: 10 }}
            animate={{ 
              opacity: isHovered ? 1 : 0,
              x: isHovered ? 0 : 10
            }}
            transition={{ duration: 0.2 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect();
                    }}
                  >
                    {isSelected ? 
                      <CheckCircle2 className="h-4 w-4 text-blue-600" /> : 
                      <div className="h-4 w-4 border-2 border-gray-300 rounded" />
                    }
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>{isSelected ? 'Deselect' : 'Select'}</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-red-400">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>

        {/* Article Info */}
        <div className="space-y-4">
          <div>
            <motion.h3 
              className="font-bold text-xl text-gray-900 dark:text-white leading-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.1, duration: 0.4, type: "spring", stiffness: 200, damping: 25 }}
            >
              {article.name}
            </motion.h3>
            {article.hsn_code && (
              <motion.p 
                className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.15, duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              >
                HSN: {article.hsn_code}
              </motion.p>
            )}
          </div>

          {article.description && (
            <motion.p 
              className="text-base text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.2, duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            >
              {article.description}
            </motion.p>
          )}

          {/* Price Badge */}
          <motion.div
            className="flex items-center justify-between pt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 + 0.25, duration: 0.4, type: "spring", stiffness: 200, damping: 25 }}
          >
            <Badge className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 font-semibold text-sm tabular-nums">
              ₹{article.base_rate.toFixed(2)}
            </Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(article.created_at).toLocaleDateString()}
            </span>
          </motion.div>
        </div>

        {/* Hover indicator */}
        <motion.div
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
          initial={{ x: 10, opacity: 0 }}
          whileHover={{ x: 0, opacity: 1 }}
        >
          <Eye className="h-5 w-5 text-gray-400" />
        </motion.div>
      </div>
    </motion.div>
  );
};

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
  const { selectedBranch, setSelectedBranch } = useBranchSelection();
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

  // —— Branch Selection Check ——
  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/30 flex items-center justify-center p-6">
        <motion.div 
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl p-8 border border-orange-200/30 dark:border-orange-800/30 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Branch Selection Required</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Please select a branch to view your article catalog.
              </p>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Branch
              </label>
              <Select value={selectedBranch || ''} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full bg-white/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50 h-12">
                  <SelectValue placeholder="Choose your branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span>{branch.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{branch.city}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // —— Enhanced Loading State ——
  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/30 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <motion.div 
            className="h-40 bg-white dark:bg-gray-900/50 rounded-2xl animate-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          {/* Stats Skeleton */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </motion.div>
          {/* Content Skeleton */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <LoadingCard key={i} className="h-64" />
            ))}
          </motion.div>
        </div>
        <span className="sr-only">Loading articles...</span>
      </div>
    );
  }

  // —— Enhanced Error State ——
  if (error && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/30 flex items-center justify-center">
        <EmptyState
          illustration="general"
          title="Failed to load articles"
          description="There was an error loading your article catalog. Please try again."
          action={{
            label: 'Retry',
            onClick: () => refresh()
          }}
        />
      </div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/30">
        <div className="max-w-[1600px] xl:max-w-[1920px] 2xl:max-w-full mx-auto p-6 space-y-6">
          {/* Apple-inspired Header Section */}
          <motion.div 
            className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-xl shadow-lg"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <Package className="h-6 w-6 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Article Catalog
                  </h1>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                      <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                      <Package className="h-3 w-3 mr-1" />
                      Enterprise
                    </Badge>
                  </motion.div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your product catalog, pricing, and inventory with enterprise-grade controls
                </p>
              </motion.div>
              
              {/* Enhanced Quick Stats */}
              <motion.div 
                className="grid grid-cols-3 gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05, transition: { duration: 0.2, type: "spring", stiffness: 300, damping: 20 } }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-blue-500 rounded-full mx-auto mb-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
                  />
                  <motion.p 
                    className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {statistics.total}
                  </motion.p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Articles</p>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05, transition: { duration: 0.2, type: "spring", stiffness: 300, damping: 20 } }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
                  />
                  <motion.p 
                    className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
                  >
                    ₹{statistics.avgPrice.toFixed(0)}
                  </motion.p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Price</p>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05, transition: { duration: 0.2, type: "spring", stiffness: 300, damping: 20 } }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-purple-500 rounded-full mx-auto mb-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
                  />
                  <motion.p 
                    className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {statistics.recentlyAdded}
                  </motion.p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recent</p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

        {/* Analytics Overview (shown in analytics view) */}
        {viewMode === VIEW_MODES.ANALYTICS && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          </div>
        )}

        {/* Enhanced Action Bar */}
        <Card className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
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
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md">
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
                  leftIcon={<RefreshCw className={cn("h-4 w-4 transition-transform duration-200", isRefreshing && "animate-spin")} />}
                >
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowImport(true)}
                  leftIcon={<Upload className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />}
                >
                  Import
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowExport(true)}
                  leftIcon={<Download className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />}
                >
                  Export
                </Button>
              </ButtonGroup>

              <Button
                variant="outline"
                onClick={() => setShowBulkRates(true)}
                leftIcon={<Tag className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />}
              >
                Bulk Rates
              </Button>

              <Button
                variant="gradient"
                onClick={() => setShowForm(true)}
                leftIcon={<Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />}
              >
                Add Article
              </Button>
            </div>
          </div>
        </Card>

        {/* Selection Bar */}
        {selectedIds.length > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-0 shadow-lg rounded-2xl">
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

        {/* Enhanced Content Area */}
        {viewMode === VIEW_MODES.GRID && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {pageItems.length ? (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 lg:gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05 }}
              >
                {pageItems.map((article, index) => (
                  <AppleArticleCard
                    key={article.id}
                    article={article}
                    index={index}
                    isSelected={selectedIds.includes(article.id)}
                    onSelect={() => toggleSelection(article.id)}
                    onEdit={() => {
                      setEditArticle(article);
                      setShowForm(true);
                    }}
                    onDelete={() => handleDelete(article.id)}
                    onViewDetails={() => setDetailsId(article.id)}
                    onCopy={() => copyToClipboard(article)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16"
              >
                {filters.search ? (
                  <NoSearchResults
                    query={filters.search}
                    onClear={() => setFilters({ search: '' })}
                    suggestions={[
                      'Check article name spelling',
                      'Try searching by HSN code',
                      'Search for partial matches',
                      'Clear filters and try again'
                    ]}
                  />
                ) : (
                  <NoArticles
                    title="No articles in catalog"
                    description="Start building your product catalog by adding your first article with pricing and inventory details."
                    action={{
                      label: 'Add First Article',
                      onClick: () => setShowForm(true)
                    }}
                  />
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {viewMode === VIEW_MODES.LIST && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {pageItems.length ? (
              <motion.div 
                className="bg-white/80 dark:bg-gray-900/80 rounded-2xl border-0 shadow-lg overflow-hidden backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <DataTable
                  data={pageItems}
                  columns={tableColumns}
                  searchable={false}
                  selectable
                  onSelectionChange={(selected) => setSelectedIds(selected.map(item => item.id))}
                  actions={(row) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.div whileHover={{ scale: 1.1, transition: { duration: 0.1 } }} whileTap={{ scale: 0.9, transition: { duration: 0.05 } }}>
                          <IconButton
                            variant="ghost"
                            size="icon-sm"
                            icon={<MoreVertical className="h-4 w-4" />}
                            aria-label="More options"
                            className="haptic-light transition-all duration-200 ease-out hover:scale-110 active:scale-95"
                          />
                        </motion.div>
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
                          className="text-red-600 dark:text-red-400"
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
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16"
              >
                {filters.search ? (
                  <NoSearchResults
                    query={filters.search}
                    onClear={() => setFilters({ search: '' })}
                    suggestions={[
                      'Check article name spelling',
                      'Try searching by HSN code',
                      'Search for partial matches',
                      'Clear filters and try again'
                    ]}
                  />
                ) : (
                  <NoArticles
                    title="No articles in catalog"
                    description="Start building your product catalog by adding your first article with pricing and inventory details."
                    action={{
                      label: 'Add First Article',
                      onClick: () => setShowForm(true)
                    }}
                  />
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {viewMode === VIEW_MODES.ANALYTICS && (
          <div className="space-y-6">
            {/* Price Distribution */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
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
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
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
          <Card className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl">
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
            <ArticleBulkRates articles={filtered} onClose={() => setShowBulkRates(false)} onSuccess={() => {
              setShowBulkRates(false);
              refresh();
              showSuccess('Bulk Rates Updated', 'Article rates have been updated successfully');
            }} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Enhanced Floating Action Button (Mobile) */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="lg:hidden"
      >
        <FAB
          position="bottom-right"
          onClick={() => setShowForm(true)}
          aria-label="Add new article"
          className="haptic-medium hover-lift-strong shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </FAB>
      </motion.div>
    </TooltipProvider>
  );
}

