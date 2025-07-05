import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBranches } from '@/hooks/useBranches';
import { BranchSelectionProvider, useBranchSelection } from '@/contexts/BranchSelectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import Papa from 'papaparse';
import ReactECharts from 'echarts-for-react';

interface ReportRow {
  [key: string]: any;
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="py-12 text-center text-gray-500">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function ReportsContent() {
  const { branches } = useBranches();
  const { selectedBranch, setSelectedBranch } = useBranchSelection();
  const { getCurrentUserBranch } = useAuth();
  const userBranch = getCurrentUserBranch();

  const [reportType, setReportType] = useState('bookings');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedBranch) {
      if (userBranch) setSelectedBranch(userBranch.id);
      else if (branches.length > 0) setSelectedBranch(branches[0].id);
    }
  }, [userBranch, branches, selectedBranch]);

  const generateReport = async () => {
    if (!selectedBranch) return;
    setLoading(true);
    let query;
    const from = startDate ? new Date(startDate).toISOString() : null;
    const to = endDate ? new Date(endDate).toISOString() : null;
    try {
      switch (reportType) {
        case 'bookings':
          query = supabase
            .from('bookings')
            .select('lr_number, created_at, total_amount, status, sender:customers!sender_id(name)')
            .or(`from_branch.eq.${selectedBranch},to_branch.eq.${selectedBranch}`);
          break;
        case 'customers':
          query = supabase
            .from('customers')
            .select('name, type, status, created_at, total_spend')
            .eq('branch_id', selectedBranch);
          break;
        case 'fleet':
          query = supabase
            .from('vehicles')
            .select('vehicle_number, type, status, created_at');
          if (selectedBranch) query = query.eq('branch_id', selectedBranch);
          break;
        case 'revenue':
          query = supabase
            .from('bookings')
            .select('lr_number, created_at, total_amount, payment_type');
          if (selectedBranch) query = query.or(`from_branch.eq.${selectedBranch},to_branch.eq.${selectedBranch}`);
          break;
        case 'payments':
          query = supabase
            .from('bookings')
            .select('lr_number, created_at, total_amount, payment_type, status');
          if (selectedBranch) query = query.or(`from_branch.eq.${selectedBranch},to_branch.eq.${selectedBranch}`);
          break;
        default:
          query = null;
      }
      if (query) {
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);
        const { data, error } = await query;
        if (!error) setData(data as ReportRow[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(row => {
    if (!search) return true;
    return Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()));
  });

  const badgeVariantForStatus = (value: string) => {
    const val = value.toLowerCase();
    if (val.includes('paid') || val.includes('delivered')) return 'success';
    if (val.includes('cancel')) return 'destructive';
    if (val.includes('pending') || val.includes('booked')) return 'warning';
    return 'secondary';
  };

  const exportCSV = () => {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartOptions = () => {
    if (reportType === 'revenue') {
      const dataByDate: Record<string, number> = {};
      filteredData.forEach(r => {
        const d = new Date(r.created_at).toLocaleDateString();
        dataByDate[d] = (dataByDate[d] || 0) + (r.total_amount || 0);
      });
      return {
        xAxis: { type: 'category', data: Object.keys(dataByDate) },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: Object.values(dataByDate) }],
      };
    }
    if (reportType === 'bookings') {
      const dataByDate: Record<string, number> = {};
      filteredData.forEach(r => {
        const d = new Date(r.created_at).toLocaleDateString();
        dataByDate[d] = (dataByDate[d] || 0) + 1;
      });
      return {
        xAxis: { type: 'category', data: Object.keys(dataByDate) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: Object.values(dataByDate) }],
      };
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bookings">Bookings</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="fleet">Fleet</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="payments">Payments</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Branch</label>
            <Select value={selectedBranch || ''} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button
            onClick={generateReport}
            disabled={loading}
            className="self-end w-full"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Generate Report
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between mb-2">
        <Input
          placeholder="Search reports…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm"
        />
        <Button variant="outline" onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredData.length === 0 ? (
        <EmptyState
          icon={<BarChart2 size={40} className="text-muted-foreground" />}
          title="No report data"
          subtitle="Try changing the filters or date range."
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-md overflow-hidden">
              <thead className="bg-muted/40 sticky top-0 z-10">
                <tr>
                  {filteredData[0] &&
                    Object.keys(filteredData[0]).map((key) => (
                      <th
                        key={key}
                        className="p-2 text-left font-medium capitalize"
                      >
                        {key.replace('_', ' ')}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/10 border-b">
                    {Object.entries(row).map(([key, val], i) => (
                      <td key={i} className="p-2">
                        {String(key).toLowerCase().includes('status') ? (
                          <Badge variant={badgeVariantForStatus(String(val))}>
                            {String(val).replace('_', ' ')}
                          </Badge>
                        ) : (
                          String(val)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {chartOptions() && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <ReactECharts option={chartOptions()} style={{ height: 300 }} />
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <BranchSelectionProvider>
      <ReportsContent />
    </BranchSelectionProvider>
  );
}
