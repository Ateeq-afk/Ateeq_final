// src/components/ArticleList.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import type { Article, Branch } from '@/types';
import { useArticles } from '@/hooks/useArticles';
import { useBranches } from '@/hooks/useBranches';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

import ArticleForm from './ArticleForm';
import ArticleDetails from './ArticleDetails';
import ArticleImport from './ArticleImport';
import ArticleExport from './ArticleExport';
import ArticleBulkRates from './ArticleBulkRates';

export default function ArticleList() {
  // ——— Local UI state ———
  const [showForm, setShowForm]               = useState(false);
  const [editingArticle, setEditingArticle]   = useState<Article | null>(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError]         = useState<string | null>(null);
  const [showDetails, setShowDetails]         = useState<string | null>(null);
  const [showImport, setShowImport]           = useState(false);
  const [showExport, setShowExport]           = useState(false);
  const [showBulkRates, setShowBulkRates]     = useState(false);

  const [sortField, setSortField]             = useState<'name' | 'base_rate' | 'created_at'>('name');
  const [sortDirection, setSortDirection]     = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage]         = useState(1);
  const itemsPerPage = 12;

  // ——— Data hooks ———
  const {
    articles,
    loading,
    error,
    createArticle,
    updateArticle,
    deleteArticle,
    refresh,
  } = useArticles();

  const { branches } = useBranches();  
  const { showSuccess, showError } = useNotificationSystem();

  // Reset to page 1 whenever filters/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortDirection]);

  // ——— Filtering & Sorting (client-side for now) ———
  const filteredArticles = useMemo(() => {
    return articles
      .filter((a) => {
        const matchesSearch =
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortField === 'name') {
          return sortDirection === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        if (sortField === 'base_rate') {
          return sortDirection === 'asc'
            ? a.base_rate - b.base_rate
            : b.base_rate - a.base_rate;
        }
        // created_at
        return sortDirection === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [articles, searchQuery, sortField, sortDirection]);

  // ——— Pagination ———
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ——— Handlers ———
  const handleCreateArticle = async (data: Omit<Article, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createArticle(data);
      setShowForm(false);
      showSuccess('Article Created', 'Article has been successfully created');
    } catch (err) {
      console.error(err);
      showError('Creation Failed', 'Failed to create article');
    }
  };

  const handleUpdateArticle = async (data: Partial<Article>) => {
    if (!editingArticle) return;
    try {
      await updateArticle(editingArticle.id, data);
      setEditingArticle(null);
      setShowForm(false);
      showSuccess('Article Updated', 'Article has been successfully updated');
    } catch (err) {
      console.error(err);
      showError('Update Failed', 'Failed to update article');
    }
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    try {
      setDeleteError(null);
      await deleteArticle(articleToDelete);
      setArticleToDelete(null);
      showSuccess('Article Deleted', 'Article has been successfully deleted');
    } catch (err) {
      console.error(err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete article');
    }
  };

  const handleSort = (field: 'name' | 'base_rate' | 'created_at') => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRefresh = async () => {
    try {
      await refresh();
      showSuccess('Refreshed', 'Article list has been refreshed');
    } catch {
      showError('Refresh Failed', 'Failed to refresh article list');
    }
  };

  const handleImportSuccess = () => {
    setShowImport(false);
    refresh();
    showSuccess('Import Successful', 'Articles have been imported successfully');
  };

  const handleExportSuccess = () => {
    setShowExport(false);
    showSuccess('Export Successful', 'Articles have been exported successfully');
  };

  // ——— Loading / Error / Form states ———
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
          <span>Loading articles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load articles. Please try again.</span>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-3xl mx-auto">
          <ArticleForm
            initialData={editingArticle ?? undefined}
            onSubmit={editingArticle ? handleUpdateArticle : handleCreateArticle}
            onCancel={() => {
              setShowForm(false);
              setEditingArticle(null);
            }}
          />
        </div>
      </div>
    );
  }

  // ——— Main Render ———
  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Articles</h2>
          <p className="text-gray-600 mt-1">{filteredArticles.length} articles found</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button variant="outline" onClick={() => setShowExport(true)} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={() => setShowBulkRates(true)} className="flex items-center gap-2">
            <Tag className="h-4 w-4" /> Bulk Rates
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add Article
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by name or description…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedArticles.map((article) => (
          <div
            key={article.id}
            className="bg-white rounded-xl border p-6 hover:shadow transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div
                className="flex items-start gap-4 cursor-pointer"
                onClick={() => setShowDetails(article.id)}
              >
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                    {article.name}
                  </h3>
                  {article.description && (
                    <p className="text-sm text-gray-500 mt-1">{article.description}</p>
                  )}
                  <Badge variant="success" className="mt-2">
                    ₹{article.base_rate.toFixed(2)} base rate
                  </Badge>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowDetails(article.id)}>
                    <Package className="h-4 w-4 mr-2" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingArticle(article);
                      setShowForm(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" /> Edit Article
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setArticleToDelete(article.id)}
                  >
                    <Trash className="h-4 w-4 mr-2" /> Delete Article
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {paginatedArticles.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No articles found</h3>
            <p className="text-gray-600 mt-1">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Add your first article to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowForm(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Add Article
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-6 py-4">
          <div className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, filteredArticles.length)}
            </span>{' '}
            of <span className="font-medium">{filteredArticles.length}</span> articles
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* —— Dialogs —— */}

      {/* Delete Confirmation */}
      <Dialog
        open={!!articleToDelete}
        onOpenChange={() => {
          setArticleToDelete(null);
          setDeleteError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
          </DialogHeader>
          {deleteError ? (
            <div className="flex items-start gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{deleteError}</span>
            </div>
          ) : (
            <p className="text-gray-600">
              Are you sure you want to delete this article? This action cannot be undone.
            </p>
          )}
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setArticleToDelete(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            {!deleteError && (
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleDeleteArticle}>
                Delete
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Article Details */}
      <Dialog open={!!showDetails} onOpenChange={(o) => !o && setShowDetails(null)}>
        <DialogContent className="max-w-4xl flex flex-col overflow-hidden">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Article Details</DialogTitle>
          </DialogHeader>
          <div className="p-6 overflow-y-auto flex-1">
            {showDetails && (
              <ArticleDetails
                article={articles.find((a) => a.id === showDetails)!}
                onClose={() => setShowDetails(null)}
                onEdit={() => {
                  setEditingArticle(articles.find((a) => a.id === showDetails)!);
                  setShowDetails(null);
                  setShowForm(true);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Import / Export / Bulk Rates */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Articles</DialogTitle>
          </DialogHeader>
          <ArticleImport onClose={() => setShowImport(false)} onSuccess={handleImportSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Articles</DialogTitle>
          </DialogHeader>
          <ArticleExport
            articles={filteredArticles}
            onClose={() => setShowExport(false)}
            onSuccess={handleExportSuccess}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkRates} onOpenChange={setShowBulkRates}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk Rate Management</DialogTitle>
          </DialogHeader>
          <ArticleBulkRates onClose={() => setShowBulkRates(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}