// DEPRECATED: This component is replaced by BookingArticleManager
// TODO: Remove this file after frontend migration is complete

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Calculator, AlertTriangle } from 'lucide-react';
import { useArticles } from '@/hooks/useArticles';

// DEPRECATED WARNING COMPONENT
const DeprecationWarning = () => (
  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2 text-orange-800">
    <AlertTriangle className="h-4 w-4" />
    <span className="text-sm font-medium">
      DEPRECATED: This component will be replaced by BookingArticleManager. 
      Data may not be saved correctly.
    </span>
  </div>
);

export interface FreightItem {
  id: string;
  articleType: string;
  quantity: number;
  unit: string;
  ratePerUnit: number;
  total: number;
}

interface FreightCalculationTableProps {
  onFreightChange: (items: FreightItem[], total: number) => void;
  defaultItems?: FreightItem[];
}

export default function FreightCalculationTable({ onFreightChange, defaultItems }: FreightCalculationTableProps) {
  const { articles } = useArticles();
  const [items, setItems] = useState<FreightItem[]>(
    defaultItems || [{
      id: '1',
      articleType: '',
      quantity: 1,
      unit: 'kg',
      ratePerUnit: 0,
      total: 0
    }]
  );

  // Calculate total whenever items change
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.total, 0);
    onFreightChange(items, total);
  }, [items, onFreightChange]);

  const calculateItemTotal = (quantity: number, ratePerUnit: number): number => {
    return quantity * ratePerUnit;
  };

  const updateItem = (id: string, field: keyof FreightItem, value: any) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate total if quantity or rate changes
          if (field === 'quantity' || field === 'ratePerUnit') {
            updatedItem.total = calculateItemTotal(
              field === 'quantity' ? value : updatedItem.quantity,
              field === 'ratePerUnit' ? value : updatedItem.ratePerUnit
            );
          }
          
          return updatedItem;
        }
        return item;
      });
    });
  };

  const addItem = () => {
    const newItem: FreightItem = {
      id: Date.now().toString(),
      articleType: '',
      quantity: 1,
      unit: 'kg',
      ratePerUnit: 0,
      total: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          Freight Calculation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DeprecationWarning />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Article Type</TableHead>
                <TableHead className="w-[100px]">Quantity</TableHead>
                <TableHead className="w-[120px]">Unit</TableHead>
                <TableHead className="w-[150px]">Rate per Unit (₹)</TableHead>
                <TableHead className="w-[150px]">Total (₹)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Select
                      value={item.articleType}
                      onValueChange={(value) => updateItem(item.id, 'articleType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select article" />
                      </SelectTrigger>
                      <SelectContent>
                        {articles.map((article) => (
                          <SelectItem key={article.id} value={article.id}>
                            {article.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.unit}
                      onValueChange={(value) => updateItem(item.id, 'unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="boxes">boxes</SelectItem>
                        <SelectItem value="tons">tons</SelectItem>
                        <SelectItem value="nos">nos</SelectItem>
                        <SelectItem value="bags">bags</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.ratePerUnit}
                      onChange={(e) => updateItem(item.id, 'ratePerUnit', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">₹{item.total.toFixed(2)}</div>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Article
          </Button>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">Grand Total</p>
            <p className="text-2xl font-bold text-green-600">₹{grandTotal.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}