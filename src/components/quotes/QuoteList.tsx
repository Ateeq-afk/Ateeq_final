import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, FileText, Send, CheckCircle, XCircle, Clock, Eye, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { quotesService, Quote } from '@/services/quotes';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function QuoteList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [validOnly, setValidOnly] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['quotes', statusFilter, validOnly],
    queryFn: async () => {
      const response = await quotesService.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        valid_only: validOnly,
      });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  const filteredQuotes = data?.filter(quote =>
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.from_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.to_location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: Quote['status']) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, icon: FileText },
      sent: { variant: 'default' as const, icon: Send },
      approved: { variant: 'success' as const, icon: CheckCircle },
      rejected: { variant: 'destructive' as const, icon: XCircle },
      expired: { variant: 'destructive' as const, icon: Clock },
      converted: { variant: 'outline' as const, icon: CheckCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="capitalize">
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const handleSend = async (id: string) => {
    try {
      const response = await quotesService.send(id);
      if (response.success) {
        toast.success('Quote sent successfully');
        refetch();
      } else {
        toast.error(response.error || 'Failed to send quote');
      }
    } catch (error) {
      toast.error('Failed to send quote');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await quotesService.approve(id);
      if (response.success) {
        toast.success('Quote approved successfully');
        refetch();
      } else {
        toast.error(response.error || 'Failed to approve quote');
      }
    } catch (error) {
      toast.error('Failed to approve quote');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await quotesService.duplicate(id);
      if (response.success) {
        toast.success('Quote duplicated successfully');
        navigate(`/quotes/${response.data.id}/edit`);
      } else {
        toast.error(response.error || 'Failed to duplicate quote');
      }
    } catch (error) {
      toast.error('Failed to duplicate quote');
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error loading quotes: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <Button onClick={() => navigate('/quotes/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Quote
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by quote number, customer, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={validOnly ? "default" : "outline"}
              onClick={() => setValidOnly(!validOnly)}
            >
              Valid Only
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No quotes found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      {quote.quote_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{quote.customer?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {quote.customer?.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{quote.from_location}</div>
                        <div className="text-muted-foreground">→ {quote.to_location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ₹{quote.total_amount.toLocaleString()}
                      </div>
                      {quote.estimated_volume && (
                        <div className="text-sm text-muted-foreground">
                          {quote.estimated_volume.weight}kg, {quote.estimated_volume.units} units
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(quote.valid_until), 'dd MMM yyyy')}
                      </div>
                      {new Date(quote.valid_until) < new Date() && (
                        <div className="text-xs text-red-500">Expired</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(quote.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/quotes/${quote.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {quote.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSend(quote.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        {quote.status === 'sent' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(quote.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(quote.id)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}