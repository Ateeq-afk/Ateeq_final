import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { expenseService } from '@/services/expenses';
import { useBranchSelection } from '@/contexts/BranchSelectionContext';

const BudgetOverview: React.FC = () => {
  const { selectedBranch } = useBranchSelection();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', selectedBranch?.id, currentYear, currentMonth],
    queryFn: () => expenseService.getBudgets({
      branch_id: selectedBranch?.id,
      year: currentYear,
      month: currentMonth,
      budget_type: 'monthly'
    }),
  });

  const totalBudget = budgets?.reduce((sum, b) => sum + b.allocated_amount, 0) || 0;
  const totalUtilized = budgets?.reduce((sum, b) => sum + b.utilized_amount, 0) || 0;
  const overallUtilization = totalBudget > 0 ? (totalUtilized / totalBudget) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading budgets...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">{expenseService.formatCurrency(totalBudget)}</p>
              <p className="text-xs text-muted-foreground mt-1">For {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Utilized</p>
              <p className="text-2xl font-bold">{expenseService.formatCurrency(totalUtilized)}</p>
              <Progress value={overallUtilization} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{overallUtilization.toFixed(1)}% of budget</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold">{expenseService.formatCurrency(totalBudget - totalUtilized)}</p>
              <p className="text-xs text-muted-foreground mt-1">Available to spend</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget by Category</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Set Budget
          </Button>
        </CardHeader>
        <CardContent>
          {budgets && budgets.length > 0 ? (
            <div className="space-y-6">
              {budgets.map((budget) => {
                const isOverBudget = budget.utilization_percentage > 100;
                const isNearLimit = budget.utilization_percentage > 80;
                
                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{budget.category?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {expenseService.formatCurrency(budget.utilized_amount)} of {expenseService.formatCurrency(budget.allocated_amount)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isOverBudget ? (
                          <div className="flex items-center text-red-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Over budget</span>
                          </div>
                        ) : isNearLimit ? (
                          <div className="flex items-center text-amber-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Near limit</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            <span className="text-sm">On track</span>
                          </div>
                        )}
                        <span className="text-sm font-medium">
                          {budget.utilization_percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(budget.utilization_percentage, 100)} 
                      className={isOverBudget ? 'bg-red-100' : isNearLimit ? 'bg-amber-100' : ''}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No budgets set for this period</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetOverview;