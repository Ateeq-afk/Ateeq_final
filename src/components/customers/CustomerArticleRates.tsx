import React, { useEffect, useState } from 'react'
import { Plus, Loader2, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabaseClient'
import { useNotificationSystem } from '@/hooks/useNotificationSystem'
import type { Customer, Article } from '@/types'

interface Props {
  customer: Customer
  onClose: () => void
}

export default function CustomerArticleRates({ customer, onClose }: Props) {
  const [articles, setArticles] = useState<Article[]>([])
  const [customRateMap, setCustomRateMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [articleToSave, setArticleToSave] = useState<Article | null>(null)
  const { showSuccess, showError } = useNotificationSystem()

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: articleData, error: artErr } = await supabase
          .from('articles')
          .select('*')
          .order('name')
        if (artErr) throw artErr

        const { data: rateData, error: rateErr } = await supabase
          .from('customer_article_rates')
          .select('article_id, rate')
          .eq('customer_id', customer.id)
        if (rateErr) throw rateErr

        const map: Record<string, number> = {}
        rateData?.forEach(r => { map[r.article_id] = r.rate })
        setArticles(articleData || [])
        setCustomRateMap(map)
      } catch (err) {
        console.error('Failed to load article rates', err)
        showError('Load Failed', 'Unable to load article rates')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [customer.id, showError])

  const filteredArticles = articles.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const updateRate = (id: string, value: string) => {
    setCustomRateMap(prev => ({ ...prev, [id]: parseFloat(value) || 0 }))
  }

  const saveRate = async (id: string) => {
    try {
      const rate = customRateMap[id] ?? 0
      await supabase.from('customer_article_rates').upsert({
        customer_id: customer.id,
        article_id: id,
        rate
      })
      showSuccess('Rate Saved', 'Custom rate updated')
      setArticleToSave(null)
    } catch (err) {
      console.error('Failed to save rate', err)
      showError('Save Failed', 'Could not update rate')
      setArticleToSave(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <Card className="max-h-[80vh] overflow-auto">
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle>Article Rates</CardTitle>
          <CardDescription>Set custom rates for {customer.name}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Search articles..." onChange={e => setSearch(e.target.value)} />
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr>
                <th className="text-left p-2">Article</th>
                <th className="text-right p-2">Base Rate</th>
                <th className="text-right p-2">Custom Rate</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map(article => (
                <tr key={article.id} className="border-b last:border-0">
                  <td className="p-2">
                    <div className="font-medium">{article.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {article.description}
                    </div>
                  </td>
                  <td className="p-2 text-right">₹{article.base_rate}</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={customRateMap[article.id] ?? ''}
                      placeholder={article.base_rate.toString()}
                      onChange={e => updateRate(article.id, e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setArticleToSave(article)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      <Dialog open={!!articleToSave} onOpenChange={() => setArticleToSave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Rate</DialogTitle>
          </DialogHeader>
          <p>
            Save custom rate for {articleToSave?.name}? This will override the
            base rate when this customer is charged.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArticleToSave(null)}>
              Cancel
            </Button>
            <Button onClick={() => articleToSave && saveRate(articleToSave.id)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
