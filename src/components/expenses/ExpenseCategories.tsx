import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Folder, FolderOpen } from 'lucide-react';
import { expenseService } from '@/services/expenses';

const ExpenseCategories: React.FC = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['expense-categories-all'],
    queryFn: () => expenseService.getCategories(true),
  });

  const renderCategory = (category: any, level = 0) => {
    return (
      <div key={category.id} className={`${level > 0 ? 'ml-8' : ''}`}>
        <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {category.subcategories?.length > 0 ? (
              <FolderOpen className="h-4 w-4 text-slate-500" />
            ) : (
              <Folder className="h-4 w-4 text-slate-400" />
            )}
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-sm text-muted-foreground">{category.code}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={expenseService.getCategoryTypeColor(category.category_type)}>
              {category.category_type}
            </Badge>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {category.subcategories?.map((sub: any) => renderCategory(sub, level + 1))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading categories...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expense Categories</CardTitle>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {categories?.map((category) => renderCategory(category))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseCategories;