import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, Download, Search, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { expenseService } from '@/services/expenses';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';
import { toast } from 'sonner';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import BudgetOverview from './BudgetOverview';
import ExpenseCategories from './ExpenseCategories';

const ExpenseManagement: React.FC = () => {
  const { selectedBranch } = useBranchSelection();
  const queryClient = useQueryClient();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category_id: '',
    payment_status: '',
    approval_status: '',
    start_date: '',
    end_date: '',
  });

  // Fetch expenses
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', selectedBranch?.id, filters],
    queryFn: () => expenseService.getExpenses({
      branch_id: selectedBranch?.id,
      ...filters,
      page: 1,
      limit: 50
    }),
  });

  // Fetch expense summary
  const { data: expenseSummary } = useQuery({
    queryKey: ['expense-summary', selectedBranch?.id],
    queryFn: () => expenseService.getSummaryByCategory({
      branch_id: selectedBranch?.id,
      start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    }),
  });

  // Calculate total expenses
  const totalExpenses = expenseSummary?.reduce((sum, cat) => sum + cat.total_amount, 0) || 0;
  const pendingApproval = expensesData?.data?.filter(exp => exp.approval_status === 'submitted').length || 0;
  const pendingPayment = expensesData?.data?.filter(exp => exp.payment_status === 'pending').length || 0;

  const handleCreateExpense = () => {
    setSelectedExpense(null);
    setShowExpenseForm(true);
  };

  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setShowExpenseForm(true);
  };

  const handleCloseForm = () => {
    setShowExpenseForm(false);
    setSelectedExpense(null);
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  };

  const handleApprove = async (expenseId: string) => {
    try {
      await expenseService.approveExpense(expenseId);
      toast({
        title: "Expense Approved",
        description: "The expense has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve expense.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (expenseId: string, reason: string) => {
    try {
      await expenseService.rejectExpense(expenseId, reason);
      toast({
        title: "Expense Rejected",
        description: "The expense has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject expense.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage all business expenses</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreateExpense}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">{expenseService.formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold">{pendingApproval}</p>
              <p className="text-xs text-muted-foreground mt-1">Expenses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Payment</p>
              <p className="text-2xl font-bold">{pendingPayment}</p>
              <p className="text-xs text-muted-foreground mt-1">Approved expenses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Expense</p>
              <p className="text-2xl font-bold">
                {expenseService.formatCurrency(
                  expensesData?.data?.length ? totalExpenses / expensesData.data.length : 0
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">All Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date Range
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Expenses List */}
          <ExpenseList
            expenses={expensesData?.data || []}
            isLoading={isLoading}
            onEdit={handleEditExpense}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </TabsContent>

        <TabsContent value="categories">
          <ExpenseCategories />
        </TabsContent>

        <TabsContent value="budgets">
          <BudgetOverview />
        </TabsContent>
      </Tabs>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <ExpenseForm
          expense={selectedExpense}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default ExpenseManagement;