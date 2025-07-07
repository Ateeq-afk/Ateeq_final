import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticate } from '../middleware/auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Generate P&L Statement
router.get('/pnl', async (req: any, res: Response) => {
  try {
    const { organizationId, branchId } = req;
    const { 
      branch_id,
      start_date,
      end_date,
      comparison_period = 'none', // 'previous_period', 'previous_year', 'none'
      format = 'summary' // 'summary', 'detailed'
    } = req.query;

    const targetBranch = branch_id || branchId;

    if (!start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start date and end date are required' 
      });
    }

    // Calculate comparison period dates
    let comparisonStartDate, comparisonEndDate;
    if (comparison_period === 'previous_period') {
      const periodDays = Math.floor((new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24));
      comparisonEndDate = new Date(start_date);
      comparisonEndDate.setDate(comparisonEndDate.getDate() - 1);
      comparisonStartDate = new Date(comparisonEndDate);
      comparisonStartDate.setDate(comparisonStartDate.getDate() - periodDays);
    } else if (comparison_period === 'previous_year') {
      comparisonStartDate = new Date(start_date);
      comparisonStartDate.setFullYear(comparisonStartDate.getFullYear() - 1);
      comparisonEndDate = new Date(end_date);
      comparisonEndDate.setFullYear(comparisonEndDate.getFullYear() - 1);
    }

    // 1. REVENUE CALCULATION
    // Get revenue from booking_articles (source of truth)
    const { data: revenueData } = await supabase
      .from('booking_articles')
      .select(`
        total_amount,
        bookings!inner(
          id, 
          created_at, 
          from_branch, 
          to_branch,
          payment_type,
          status
        )
      `)
      .or(`bookings.from_branch.eq.${targetBranch},bookings.to_branch.eq.${targetBranch}`)
      .gte('bookings.created_at', start_date)
      .lte('bookings.created_at', end_date)
      .not('bookings.status', 'eq', 'cancelled');

    const revenue = {
      freight_revenue: 0,
      loading_unloading_revenue: 0,
      other_revenue: 0,
      total_revenue: 0
    };

    revenueData?.forEach(article => {
      revenue.freight_revenue += article.total_amount || 0;
      revenue.total_revenue += article.total_amount || 0;
    });

    // Get additional revenue from supplementary charges
    const { data: supplementaryCharges } = await supabase
      .from('invoice_line_items')
      .select(`
        amount,
        description,
        invoices!inner(
          invoice_date,
          branch_id,
          status
        )
      `)
      .eq('invoices.branch_id', targetBranch)
      .eq('invoices.status', 'paid')
      .gte('invoices.invoice_date', start_date)
      .lte('invoices.invoice_date', end_date);

    supplementaryCharges?.forEach(charge => {
      revenue.other_revenue += charge.amount || 0;
      revenue.total_revenue += charge.amount || 0;
    });

    // 2. EXPENSE CALCULATION
    const { data: expenseData } = await supabase
      .from('expenses')
      .select(`
        total_amount,
        category_id,
        expense_categories!category_id(
          name,
          code,
          category_type
        )
      `)
      .eq('organization_id', organizationId)
      .eq('branch_id', targetBranch)
      .eq('approval_status', 'approved')
      .gte('expense_date', start_date)
      .lte('expense_date', end_date);

    const expenses = {
      direct_expenses: {
        fuel: 0,
        driver_salaries: 0,
        vehicle_maintenance: 0,
        toll_parking: 0,
        loading_unloading: 0,
        other_direct: 0,
        total: 0
      },
      indirect_expenses: {
        office_rent: 0,
        utilities: 0,
        insurance: 0,
        professional_fees: 0,
        marketing: 0,
        other_indirect: 0,
        total: 0
      },
      administrative_expenses: {
        admin_salaries: 0,
        office_supplies: 0,
        communication: 0,
        bank_charges: 0,
        legal_compliance: 0,
        other_admin: 0,
        total: 0
      },
      total_expenses: 0
    };

    // Categorize expenses
    expenseData?.forEach(expense => {
      const amount = expense.total_amount || 0;
      const categoryCode = expense.expense_categories.code;
      const categoryType = expense.expense_categories.category_type;

      expenses.total_expenses += amount;

      switch (categoryType) {
        case 'direct':
          expenses.direct_expenses.total += amount;
          switch (categoryCode) {
            case 'FUEL':
              expenses.direct_expenses.fuel += amount;
              break;
            case 'DRIVER_SAL':
              expenses.direct_expenses.driver_salaries += amount;
              break;
            case 'VEH_MAINT':
              expenses.direct_expenses.vehicle_maintenance += amount;
              break;
            case 'TOLL_PARK':
              expenses.direct_expenses.toll_parking += amount;
              break;
            case 'LOAD_UNLOAD':
              expenses.direct_expenses.loading_unloading += amount;
              break;
            default:
              expenses.direct_expenses.other_direct += amount;
          }
          break;

        case 'indirect':
          expenses.indirect_expenses.total += amount;
          switch (categoryCode) {
            case 'OFFICE_RENT':
              expenses.indirect_expenses.office_rent += amount;
              break;
            case 'UTILITIES':
              expenses.indirect_expenses.utilities += amount;
              break;
            case 'INSURANCE':
              expenses.indirect_expenses.insurance += amount;
              break;
            case 'PROF_FEES':
              expenses.indirect_expenses.professional_fees += amount;
              break;
            case 'MARKETING':
              expenses.indirect_expenses.marketing += amount;
              break;
            default:
              expenses.indirect_expenses.other_indirect += amount;
          }
          break;

        case 'administrative':
          expenses.administrative_expenses.total += amount;
          switch (categoryCode) {
            case 'ADMIN_SAL':
              expenses.administrative_expenses.admin_salaries += amount;
              break;
            case 'OFFICE_SUP':
              expenses.administrative_expenses.office_supplies += amount;
              break;
            case 'COMMUNICATION':
              expenses.administrative_expenses.communication += amount;
              break;
            case 'BANK_CHARGES':
              expenses.administrative_expenses.bank_charges += amount;
              break;
            case 'LEGAL_COMP':
              expenses.administrative_expenses.legal_compliance += amount;
              break;
            default:
              expenses.administrative_expenses.other_admin += amount;
          }
          break;
      }
    });

    // 3. CALCULATE P&L METRICS
    const grossProfit = revenue.total_revenue - expenses.direct_expenses.total;
    const grossMargin = revenue.total_revenue > 0 ? (grossProfit / revenue.total_revenue) * 100 : 0;

    const operatingProfit = grossProfit - expenses.indirect_expenses.total - expenses.administrative_expenses.total;
    const operatingMargin = revenue.total_revenue > 0 ? (operatingProfit / revenue.total_revenue) * 100 : 0;

    const netProfit = operatingProfit; // Before tax
    const netMargin = revenue.total_revenue > 0 ? (netProfit / revenue.total_revenue) * 100 : 0;

    // 4. COMPARISON DATA (if requested)
    let comparisonData = null;
    if (comparison_period !== 'none' && comparisonStartDate && comparisonEndDate) {
      // Fetch comparison period data (similar queries as above)
      // ... (implement comparison logic)
    }

    // 5. BUILD RESPONSE
    const pnlStatement = {
      period: {
        start_date,
        end_date,
        days: Math.floor((new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
      },
      revenue: {
        ...revenue,
        daily_average: revenue.total_revenue / ((new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24) + 1)
      },
      expenses: format === 'detailed' ? expenses : {
        direct_expenses: expenses.direct_expenses.total,
        indirect_expenses: expenses.indirect_expenses.total,
        administrative_expenses: expenses.administrative_expenses.total,
        total_expenses: expenses.total_expenses
      },
      profitability: {
        gross_profit: grossProfit,
        gross_margin: Number(grossMargin.toFixed(2)),
        operating_profit: operatingProfit,
        operating_margin: Number(operatingMargin.toFixed(2)),
        net_profit: netProfit,
        net_margin: Number(netMargin.toFixed(2))
      },
      comparison: comparisonData,
      key_ratios: {
        expense_ratio: revenue.total_revenue > 0 ? Number(((expenses.total_expenses / revenue.total_revenue) * 100).toFixed(2)) : 0,
        direct_expense_ratio: revenue.total_revenue > 0 ? Number(((expenses.direct_expenses.total / revenue.total_revenue) * 100).toFixed(2)) : 0,
        admin_expense_ratio: revenue.total_revenue > 0 ? Number(((expenses.administrative_expenses.total / revenue.total_revenue) * 100).toFixed(2)) : 0,
      }
    };

    res.json({ success: true, data: pnlStatement });
  } catch (error: any) {
    console.error('Error generating P&L statement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate P&L statement',
      details: error.message 
    });
  }
});

// Get financial summary dashboard
router.get('/summary', async (req: any, res: Response) => {
  try {
    const { organizationId, branchId } = req;
    const { branch_id } = req.query;

    const targetBranch = branch_id || branchId;
    
    // Current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Previous month dates
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month revenue
    const { data: currentRevenue } = await supabase
      .from('booking_articles')
      .select('total_amount, bookings!inner(created_at, from_branch, to_branch, status)')
      .or(`bookings.from_branch.eq.${targetBranch},bookings.to_branch.eq.${targetBranch}`)
      .gte('bookings.created_at', startOfMonth.toISOString())
      .lte('bookings.created_at', endOfMonth.toISOString())
      .not('bookings.status', 'eq', 'cancelled');

    const currentMonthRevenue = currentRevenue?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;

    // Previous month revenue
    const { data: prevRevenue } = await supabase
      .from('booking_articles')
      .select('total_amount, bookings!inner(created_at, from_branch, to_branch, status)')
      .or(`bookings.from_branch.eq.${targetBranch},bookings.to_branch.eq.${targetBranch}`)
      .gte('bookings.created_at', startOfPrevMonth.toISOString())
      .lte('bookings.created_at', endOfPrevMonth.toISOString())
      .not('bookings.status', 'eq', 'cancelled');

    const previousMonthRevenue = prevRevenue?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;

    // Current month expenses
    const { data: currentExpenses } = await supabase
      .from('expenses')
      .select('total_amount')
      .eq('organization_id', organizationId)
      .eq('branch_id', targetBranch)
      .eq('approval_status', 'approved')
      .gte('expense_date', startOfMonth.toISOString())
      .lte('expense_date', endOfMonth.toISOString());

    const currentMonthExpenses = currentExpenses?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;

    // Previous month expenses
    const { data: prevExpenses } = await supabase
      .from('expenses')
      .select('total_amount')
      .eq('organization_id', organizationId)
      .eq('branch_id', targetBranch)
      .eq('approval_status', 'approved')
      .gte('expense_date', startOfPrevMonth.toISOString())
      .lte('expense_date', endOfPrevMonth.toISOString());

    const previousMonthExpenses = prevExpenses?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;

    // Outstanding receivables
    const { data: outstandingData } = await supabase
      .from('bookings')
      .select('total_amount, created_at')
      .or(`from_branch.eq.${targetBranch},to_branch.eq.${targetBranch}`)
      .eq('payment_type', 'To Pay')
      .neq('status', 'cancelled')
      .neq('status', 'delivered');

    const outstandingAmount = outstandingData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;

    // Cash flow
    const { data: cashInflow } = await supabase
      .from('payments')
      .select('amount')
      .eq('organization_id', organizationId)
      .eq('branch_id', targetBranch)
      .eq('status', 'completed')
      .gte('payment_date', startOfMonth.toISOString())
      .lte('payment_date', endOfMonth.toISOString());

    const currentMonthCashInflow = cashInflow?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

    // Calculate metrics
    const currentMonthProfit = currentMonthRevenue - currentMonthExpenses;
    const previousMonthProfit = previousMonthRevenue - previousMonthExpenses;
    const profitGrowth = previousMonthProfit > 0 
      ? ((currentMonthProfit - previousMonthProfit) / previousMonthProfit) * 100 
      : 0;

    const summary = {
      current_month: {
        revenue: currentMonthRevenue,
        expenses: currentMonthExpenses,
        profit: currentMonthProfit,
        margin: currentMonthRevenue > 0 ? (currentMonthProfit / currentMonthRevenue) * 100 : 0,
        cash_inflow: currentMonthCashInflow
      },
      previous_month: {
        revenue: previousMonthRevenue,
        expenses: previousMonthExpenses,
        profit: previousMonthProfit,
        margin: previousMonthRevenue > 0 ? (previousMonthProfit / previousMonthRevenue) * 100 : 0
      },
      growth: {
        revenue_growth: previousMonthRevenue > 0 
          ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
          : 0,
        expense_growth: previousMonthExpenses > 0 
          ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 
          : 0,
        profit_growth: profitGrowth
      },
      outstanding: {
        total_receivables: outstandingAmount,
        overdue_30_days: 0, // TODO: Calculate based on age
        overdue_60_days: 0,
        overdue_90_days: 0
      },
      ytd: {
        revenue: 0, // TODO: Calculate year-to-date
        expenses: 0,
        profit: 0
      }
    };

    res.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch financial summary',
      details: error.message 
    });
  }
});

// Get route profitability analysis
router.get('/route-profitability', async (req: any, res: Response) => {
  try {
    const { organizationId, branchId } = req;
    const { start_date, end_date, top_n = 10 } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start date and end date are required' 
      });
    }

    // Get revenue by route
    const { data: routeRevenue } = await supabase
      .from('bookings')
      .select(`
        from_city,
        to_city,
        booking_articles(total_amount)
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', start_date)
      .lte('created_at', end_date)
      .not('status', 'eq', 'cancelled');

    // Group by route
    const routeProfitability: any = {};

    routeRevenue?.forEach(booking => {
      const route = `${booking.from_city}-${booking.to_city}`;
      if (!routeProfitability[route]) {
        routeProfitability[route] = {
          route,
          from_city: booking.from_city,
          to_city: booking.to_city,
          revenue: 0,
          trip_count: 0,
          direct_costs: 0,
          gross_profit: 0,
          margin: 0
        };
      }
      
      const bookingRevenue = booking.booking_articles?.reduce((sum: number, article: any) => 
        sum + (article.total_amount || 0), 0) || 0;
      
      routeProfitability[route].revenue += bookingRevenue;
      routeProfitability[route].trip_count += 1;
    });

    // Get route-specific expenses (fuel, toll, etc.)
    const { data: routeExpenses } = await supabase
      .from('expenses')
      .select('route_from, route_to, total_amount, expense_categories!category_id(category_type)')
      .eq('organization_id', organizationId)
      .eq('approval_status', 'approved')
      .eq('expense_categories.category_type', 'direct')
      .gte('expense_date', start_date)
      .lte('expense_date', end_date)
      .not('route_from', 'is', null)
      .not('route_to', 'is', null);

    // Add expenses to routes
    routeExpenses?.forEach(expense => {
      const route = `${expense.route_from}-${expense.route_to}`;
      if (routeProfitability[route]) {
        routeProfitability[route].direct_costs += expense.total_amount || 0;
      }
    });

    // Calculate profitability metrics
    Object.values(routeProfitability).forEach((route: any) => {
      route.gross_profit = route.revenue - route.direct_costs;
      route.margin = route.revenue > 0 ? (route.gross_profit / route.revenue) * 100 : 0;
      route.revenue_per_trip = route.trip_count > 0 ? route.revenue / route.trip_count : 0;
      route.cost_per_trip = route.trip_count > 0 ? route.direct_costs / route.trip_count : 0;
    });

    // Sort by revenue and get top N
    const topRoutes = Object.values(routeProfitability)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, Number(top_n));

    res.json({ success: true, data: topRoutes });
  } catch (error: any) {
    console.error('Error fetching route profitability:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch route profitability',
      details: error.message 
    });
  }
});

// Get customer profitability analysis
router.get('/customer-profitability', async (req: any, res: Response) => {
  try {
    const { organizationId, branchId } = req;
    const { start_date, end_date, top_n = 10 } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start date and end date are required' 
      });
    }

    // Get revenue by customer
    const { data: customerRevenue } = await supabase
      .from('bookings')
      .select(`
        sender_id,
        sender_name,
        booking_articles(total_amount)
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', start_date)
      .lte('created_at', end_date)
      .not('status', 'eq', 'cancelled');

    // Group by customer
    const customerProfitability: any = {};

    customerRevenue?.forEach(booking => {
      if (!booking.sender_id) return;
      
      if (!customerProfitability[booking.sender_id]) {
        customerProfitability[booking.sender_id] = {
          customer_id: booking.sender_id,
          customer_name: booking.sender_name,
          revenue: 0,
          booking_count: 0,
          avg_booking_value: 0,
          payment_performance: 'good', // TODO: Calculate from payment data
          credit_utilization: 0 // TODO: Calculate from credit data
        };
      }
      
      const bookingRevenue = booking.booking_articles?.reduce((sum: number, article: any) => 
        sum + (article.total_amount || 0), 0) || 0;
      
      customerProfitability[booking.sender_id].revenue += bookingRevenue;
      customerProfitability[booking.sender_id].booking_count += 1;
    });

    // Calculate metrics
    Object.values(customerProfitability).forEach((customer: any) => {
      customer.avg_booking_value = customer.booking_count > 0 
        ? customer.revenue / customer.booking_count 
        : 0;
    });

    // Sort by revenue and get top N
    const topCustomers = Object.values(customerProfitability)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, Number(top_n));

    res.json({ success: true, data: topCustomers });
  } catch (error: any) {
    console.error('Error fetching customer profitability:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch customer profitability',
      details: error.message 
    });
  }
});

export default router;