import React from 'react';
import { MoreVertical, Check, X, Eye, Edit, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { expenseService, type Expense } from '@/services/expenses';
import { Skeleton } from '@/components/ui/skeleton';

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  onEdit: (expense: Expense) => void;
  onApprove: (expenseId: string) => void;
  onReject: (expenseId: string, reason: string) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  isLoading,
  onEdit,
  onApprove,
  onReject,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No expenses found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="text-left p-4 font-medium text-sm">Date</th>
                <th className="text-left p-4 font-medium text-sm">Expense #</th>
                <th className="text-left p-4 font-medium text-sm">Vendor</th>
                <th className="text-left p-4 font-medium text-sm">Category</th>
                <th className="text-right p-4 font-medium text-sm">Amount</th>
                <th className="text-center p-4 font-medium text-sm">Payment</th>
                <th className="text-center p-4 font-medium text-sm">Approval</th>
                <th className="text-center p-4 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <p className="text-sm">{new Date(expense.expense_date).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium">{expense.expense_number}</p>
                    {expense.bill_number && (
                      <p className="text-xs text-muted-foreground">Bill: {expense.bill_number}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{expense.vendor_name}</p>
                    {expense.vendor?.mobile && (
                      <p className="text-xs text-muted-foreground">{expense.vendor.mobile}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={expenseService.getCategoryTypeColor(expense.category?.category_type || '')}>
                      {expense.category?.name}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-sm font-medium">{expenseService.formatCurrency(expense.total_amount)}</p>
                    {expense.tax_amount > 0 && (
                      <p className="text-xs text-muted-foreground">Tax: {expenseService.formatCurrency(expense.tax_amount)}</p>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <Badge className={expenseService.getPaymentStatusColor(expense.payment_status)}>
                      {expense.payment_status}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">
                    <Badge className={expenseService.getApprovalStatusColor(expense.approval_status)}>
                      {expense.approval_status}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(expense)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {expense.approval_status === 'draft' && (
                          <DropdownMenuItem onClick={() => onEdit(expense)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {expense.approval_status === 'submitted' && (
                          <>
                            <DropdownMenuItem onClick={() => onApprove(expense.id)}>
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onReject(expense.id, 'Rejected')}>
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {expense.approval_status === 'approved' && expense.payment_status === 'pending' && (
                          <DropdownMenuItem>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Record Payment
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseList;