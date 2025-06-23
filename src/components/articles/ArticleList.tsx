// src/components/articles/ArticleList.tsx
import React, { useState, useEffect, useMemo } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

import type { Article } from '@/types'
import { useArticles } from '@/hooks/useArticles'
import { useNotificationSystem } from '@/hooks/useNotificationSystem'

import ArticleForm from './ArticleForm'
import ArticleDetails from './ArticleDetails'
import ArticleImport from './ArticleImport'
import ArticleExport from './ArticleExport'
import ArticleBulkRates from './ArticleBulkRates'

export default function ArticleList() {
  // —— UI State ——  
  const [showForm, setShowForm]           = useState(false)
  const [editArticle, setEditArticle]     = useState<Article | null>(null)
  const [detailsId, setDetailsId]         = useState<string | null>(null)
  const [showImport, setShowImport]       = useState(false)
  const [showExport, setShowExport]       = useState(false)
  const [showBulkRates, setShowBulkRates] = useState(false)

  const [search, setSearch]               = useState('')
  const [sortField, setSortField]         = useState<'name' | 'base_rate' | 'created_at'>('name')
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('asc')
  const [page, setPage]                   = useState(1)
  const perPage = 12

  // —— Data Hooks ——  
  const {
    articles,
    loading,
    error,
    createArticle,
    updateArticle,
    deleteArticle,
    refresh,
  } = useArticles()
  const { showSuccess, showError } = useNotificationSystem()

  // Reset page on filter/sort change
  useEffect(() => { setPage(1) }, [search, sortField, sortDir])

  // —— Filter & Sort ——  
  const filtered = useMemo(() => {
    const f = articles.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.description ?? '').toLowerCase().includes(search.toLowerCase())
    )
    return f.sort((a, b) => {
      if (sortField === 'name') {
        return sortDir === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      }
      if (sortField === 'base_rate') {
        return sortDir === 'asc'
          ? a.base_rate - b.base_rate
          : b.base_rate - a.base_rate
      }
      // created_at
      return sortDir === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [articles, search, sortField, sortDir])

  // —— Pagination ——  
  const totalPages = Math.ceil(filtered.length / perPage)
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage)

  // —— Handlers ——  
  const handleCreate = async (data: Omit<Article,'id'|'created_at'|'updated_at'>) => {
    try {
      await createArticle(data)
      showSuccess('Article Created', 'A new article was added')
      setShowForm(false)
    } catch {
      showError('Create Failed', 'Could not create article')
    }
  }
  const handleUpdate = async (data: Partial<Article>) => {
    if (!editArticle) return
    try {
      await updateArticle(editArticle.id, data)
      showSuccess('Article Updated', 'Changes saved')
      setShowForm(false)
      setEditArticle(null)
    } catch {
      showError('Update Failed', 'Could not update article')
    }
  }
  const handleDelete = async (id: string) => {
    try {
      await deleteArticle(id)
      showSuccess('Deleted', 'Article removed')
    } catch {
      showError('Delete Failed', 'Could not delete article')
    }
  }
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  // —— Loading / Error / Form States ——  
  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <RefreshCw className="animate-spin h-6 w-6 mr-2" /> Loading…
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center p-12 text-red-600">
      <AlertCircle className="h-6 w-6 mr-2" /> Failed to load articles.
    </div>
  )
  if (showForm) return (
    <div className="p-6 max-w-3xl mx-auto">
      <ArticleForm
        initialData={editArticle ?? undefined}
        onSubmit={editArticle ? handleUpdate : handleCreate}
        onCancel={() => {
          setShowForm(false)
          setEditArticle(null)
        }}
      />
    </div>
  )

  // —— Main Render ——  
  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex flex-wrap justify-between items-center">
        <h2 className="text-2xl font-bold">Articles ({filtered.length})</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => refresh().then(() => showSuccess('Refreshed','List updated'))}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button variant="outline" onClick={() => setShowExport(true)}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={() => setShowBulkRates(true)}>
            <Tag className="h-4 w-4" /> Bulk Rates
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Add Article
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Input
        placeholder="Search by name or description…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        prefix={<Search className="h-4 w-4 text-gray-400" />}
      />

      {/* Grid of Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pageItems.length ? pageItems.map(a => (
          <div key={a.id} className="border rounded-xl p-4 hover:shadow">
            <div className="flex justify-between">
              <div onClick={() => setDetailsId(a.id)} className="flex gap-3 cursor-pointer">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{a.name}</h3>
                  {a.description && <p className="text-sm text-gray-500">{a.description}</p>}
                  <Badge variant="success" className="mt-2">₹{a.base_rate.toFixed(2)}</Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreVertical /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDetailsId(a.id)}>
                    <Package className="h-4 w-4 mr-2" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setEditArticle(a); setShowForm(true) }}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDelete(a.id)} className="text-red-600">
                    <Trash className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-2 text-gray-600">No articles found</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm">
            Showing {(page - 1)*perPage + 1}–{Math.min(page*perPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
            {Array.from({length: totalPages}).map((_, i) => (
              <Button
                key={i}
                size="sm"
                variant={page===i+1 ? 'default' : 'outline'}
                onClick={()=>setPage(i+1)}
              >
                {i+1}
              </Button>
            ))}
            <Button size="sm" variant="outline" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!detailsId} onOpenChange={o => !o && setDetailsId(null)}>
        <DialogContent
          className="max-w-4xl mx-auto flex flex-col"
          style={{ height: '80vh' }}
        >
          <DialogHeader><DialogTitle>Article Details</DialogTitle></DialogHeader>
          <div className="overflow-y-auto px-6 py-4 flex-1">
            {detailsId && (
              <ArticleDetails
                article={articles.find(a => a.id === detailsId)!}
                onClose={() => setDetailsId(null)}
                onEdit={a => {
                  setEditArticle(a)
                  setDetailsId(null)
                  setShowForm(true)
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Import / Export / Bulk-Rates */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-2xl mx-auto">
          <ArticleImport
            onClose={() => setShowImport(false)}
            onSuccess={() => { setShowImport(false); refresh() }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-2xl mx-auto">
          <ArticleExport
            articles={filtered}
            onClose={() => setShowExport(false)}
            onSuccess={() => setShowExport(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={showBulkRates} onOpenChange={setShowBulkRates}>
        <DialogContent className="max-w-4xl mx-auto">
          <ArticleBulkRates onClose={() => setShowBulkRates(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
