import express from 'express';
import { authenticate } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { dashboardCache } from '../middleware/cache';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Get operational dashboard - exception-based monitoring
router.get('/operational', dashboardCache(300), async (req: any, res) => {
  try {
    const { branchId: branch_id } = req;
    const { branch_id: queryBranch } = req.query;
    
    const targetBranch = queryBranch || branch_id;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // **CRITICAL EXCEPTIONS** - Things that need immediate action
    
    // 1. Delayed shipments (in_transit > 72 hours)
    const { data: delayedShipments = [] } = await supabase
      .from('bookings')
      .select('id, lr_number, from_city, to_city, created_at, total_amount, sender_name')
      .or(`from_branch.eq.${targetBranch},to_branch.eq.${targetBranch}`)
      .eq('status', 'in_transit')
      .lt('created_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString());
    
    // 2. Vehicles overdue for return (check OGPL completion)
    const { data: overdueVehicles = [] } = await supabase
      .from('ogpl')
      .select(`
        id, vehicle_number, driver_name, departure_date, expected_return_date,
        vehicles!inner(registration_number, driver_name, current_location)
      `)
      .eq('branch_id', targetBranch)
      .in('status', ['dispatched', 'in_transit'])
      .lt('expected_return_date', now.toISOString());
    
    // 3. Outstanding payments > 30 days
    const { data: overduePayments = [] } = await supabase
      .from('bookings')
      .select('id, lr_number, sender_name, total_amount, created_at, payment_type')
      .or(`from_branch.eq.${targetBranch},to_branch.eq.${targetBranch}`)
      .eq('payment_type', 'To Pay')
      .neq('status', 'delivered')
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    // 4. Capacity constraints - vehicles at 95%+ utilization
    const { data: vehicleCapacity = [] } = await supabase
      .from('vehicles')
      .select(`
        id, registration_number, max_weight, current_load,
        ogpl!inner(id, status, total_weight)
      `)
      .eq('branch_id', targetBranch)
      .eq('is_active', true);
    
    const highUtilizationVehicles = vehicleCapacity
      .filter(v => v.ogpl?.length > 0)
      .map(v => ({
        ...v,
        utilization: v.ogpl[0]?.total_weight ? (v.ogpl[0].total_weight / v.max_weight) * 100 : 0
      }))
      .filter(v => v.utilization >= 95);
    
    // **OPERATIONAL PERFORMANCE**
    
    // Fleet efficiency
    const { data: fleetStats = [] } = await supabase
      .from('vehicles')
      .select(`
        id, registration_number, max_weight, fuel_efficiency,
        ogpl(id, status, departure_date, arrival_date, total_distance, fuel_cost)
      `)
      .eq('branch_id', targetBranch)
      .eq('is_active', true);
    
    const totalVehicles = fleetStats.length;
    const activeVehicles = fleetStats.filter(v => 
      v.ogpl?.some(o => ['dispatched', 'in_transit'].includes(o.status))
    ).length;
    
    // Calculate average fleet utilization
    const avgUtilization = fleetStats.reduce((acc, vehicle) => {
      const activeOGPL = vehicle.ogpl?.find(o => ['dispatched', 'in_transit'].includes(o.status));
      if (activeOGPL) {
        return acc + ((activeOGPL.total_weight || 0) / vehicle.max_weight) * 100;
      }
      return acc;
    }, 0) / (activeVehicles || 1);
    
    // **FINANCIAL HEALTH**
    
    // Today's collections vs targets
    const { data: todayBookings = [] } = await supabase
      .from('bookings')
      .select('total_amount, payment_type, status')
      .or(`from_branch.eq.${targetBranch},to_branch.eq.${targetBranch}`)
      .gte('created_at', today.toISOString());
    
    const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const todayPaidRevenue = todayBookings
      .filter(b => b.payment_type === 'Paid')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    // Outstanding receivables by aging
    const { data: allBookings = [] } = await supabase
      .from('bookings')
      .select('total_amount, payment_type, created_at, status')
      .or(`from_branch.eq.${targetBranch},to_branch.eq.${targetBranch}`)
      .eq('payment_type', 'To Pay')
      .neq('status', 'cancelled');
    
    const outstandingAging = {
      current: 0,      // 0-30 days
      aging30: 0,      // 31-60 days
      aging60: 0,      // 61-90 days
      aging90: 0       // 90+ days
    };
    
    allBookings.forEach(booking => {
      const age = Math.floor((Date.now() - new Date(booking.created_at).getTime()) / (24 * 60 * 60 * 1000));
      const amount = booking.total_amount || 0;
      
      if (age <= 30) outstandingAging.current += amount;
      else if (age <= 60) outstandingAging.aging30 += amount;
      else if (age <= 90) outstandingAging.aging60 += amount;
      else outstandingAging.aging90 += amount;
    });
    
    // **ROUTE PERFORMANCE**
    
    // Calculate route efficiency (revenue per km)
    const { data: routePerformance = [] } = await supabase
      .from('ogpl')
      .select(`
        route, total_distance, departure_date,
        booking_articles!inner(
          total_amount,
          bookings!inner(from_city, to_city)
        )
      `)
      .eq('branch_id', targetBranch)
      .eq('status', 'completed')
      .gte('departure_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    const routeEfficiency = routePerformance.reduce((acc, ogpl) => {
      const route = ogpl.route || `${ogpl.booking_articles[0]?.bookings?.from_city}-${ogpl.booking_articles[0]?.bookings?.to_city}`;
      const revenue = ogpl.booking_articles.reduce((sum, ba) => sum + (ba.total_amount || 0), 0);
      const distance = ogpl.total_distance || 1;
      
      if (!acc[route]) {
        acc[route] = { revenue: 0, distance: 0, trips: 0 };
      }
      
      acc[route].revenue += revenue;
      acc[route].distance += distance;
      acc[route].trips += 1;
      
      return acc;
    }, {});
    
    const topRoutes = Object.entries(routeEfficiency)
      .map(([route, data]: [string, any]) => ({
        route,
        revenuePerKm: data.revenue / data.distance,
        totalRevenue: data.revenue,
        totalDistance: data.distance,
        trips: data.trips,
        avgRevenuePerTrip: data.revenue / data.trips
      }))
      .sort((a, b) => b.revenuePerKm - a.revenuePerKm)
      .slice(0, 5);
    
    // **CUSTOMER INSIGHTS**
    
    // High-value customers at risk (no bookings in 15+ days)
    const { data: customerActivity = [] } = await supabase
      .from('bookings')
      .select('sender_id, sender_name, total_amount, created_at')
      .or(`from_branch.eq.${targetBranch},to_branch.eq.${targetBranch}`)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
    
    const customerStats = customerActivity.reduce((acc, booking) => {
      if (!booking.sender_id) return acc;
      
      if (!acc[booking.sender_id]) {
        acc[booking.sender_id] = {
          name: booking.sender_name,
          totalRevenue: 0,
          bookingCount: 0,
          lastBooking: booking.created_at
        };
      }
      
      acc[booking.sender_id].totalRevenue += booking.total_amount || 0;
      acc[booking.sender_id].bookingCount += 1;
      
      if (new Date(booking.created_at) > new Date(acc[booking.sender_id].lastBooking)) {
        acc[booking.sender_id].lastBooking = booking.created_at;
      }
      
      return acc;
    }, {});
    
    const atRiskCustomers = Object.values(customerStats)
      .filter((customer: any) => {
        const daysSinceLastBooking = Math.floor(
          (Date.now() - new Date(customer.lastBooking).getTime()) / (24 * 60 * 60 * 1000)
        );
        return customer.totalRevenue > 50000 && daysSinceLastBooking > 15;
      })
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);
    
    const operationalData = {
      // Critical exceptions requiring immediate action
      exceptions: {
        delayedShipments: {
          count: delayedShipments.length,
          totalValue: delayedShipments.reduce((sum, s) => sum + (s.total_amount || 0), 0),
          details: delayedShipments.slice(0, 5)
        },
        overdueVehicles: {
          count: overdueVehicles.length,
          details: overdueVehicles.slice(0, 5)
        },
        overduePayments: {
          count: overduePayments.length,
          totalValue: overduePayments.reduce((sum, p) => sum + (p.total_amount || 0), 0),
          details: overduePayments.slice(0, 5)
        },
        capacityConstraints: {
          count: highUtilizationVehicles.length,
          details: highUtilizationVehicles
        }
      },
      
      // Operational performance metrics
      operations: {
        fleet: {
          totalVehicles,
          activeVehicles,
          utilizationRate: avgUtilization,
          availableCapacity: totalVehicles - activeVehicles
        },
        routes: {
          topPerformingRoutes: topRoutes,
          totalActiveRoutes: Object.keys(routeEfficiency).length
        }
      },
      
      // Financial health indicators
      financial: {
        dailyPerformance: {
          todayRevenue,
          todayPaidRevenue,
          collectionRate: todayRevenue > 0 ? (todayPaidRevenue / todayRevenue) * 100 : 0
        },
        outstandingReceivables: outstandingAging,
        totalOutstanding: Object.values(outstandingAging).reduce((sum, val) => sum + val, 0)
      },
      
      // Customer relationship insights
      customers: {
        atRiskHighValue: atRiskCustomers.slice(0, 5),
        atRiskCount: atRiskCustomers.length
      }
    };
    
    res.json({ success: true, data: operationalData });
  } catch (error) {
    console.error('Error fetching operational dashboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch operational dashboard',
      details: error.message 
    });
  }
});

// Get dashboard metrics (enhanced with real operational data)
router.get('/metrics', async (req: any, res) => {
  try {
    const { branchId: branch_id } = req;
    const { branch_id: queryBranch } = req.query;
    
    const targetBranch = queryBranch || branch_id;
    
    // Get current date ranges
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    // Fetch bookings with branch filter
    const { data: bookings = [] } = await supabase
      .from('bookings')
      .select('*')
      .or(`from_branch.eq.${targetBranch},to_branch.eq.${targetBranch}`);
    
    // Fetch booking articles for accurate totals
    const { data: bookingArticles = [] } = await supabase
      .from('booking_articles')
      .select(`
        *, 
        bookings!inner(id, status, created_at, from_branch, to_branch)
      `)
      .or('bookings.from_branch.eq.' + targetBranch + ',bookings.to_branch.eq.' + targetBranch);
    
    // Calculate metrics from booking_articles (source of truth for amounts)
    const totalRevenue = bookingArticles.reduce((sum, ba) => sum + (ba.total_amount || 0), 0);
    
    const thisMonthArticles = bookingArticles.filter(ba => 
      new Date(ba.bookings.created_at) >= startOfMonth
    );
    const lastMonthArticles = bookingArticles.filter(ba => {
      const date = new Date(ba.bookings.created_at);
      return date >= lastMonth && date <= endOfLastMonth;
    });
    
    const monthRevenue = thisMonthArticles.reduce((sum, ba) => sum + (ba.total_amount || 0), 0);
    const lastMonthRevenue = lastMonthArticles.reduce((sum, ba) => sum + (ba.total_amount || 0), 0);
    const monthlyGrowthRate = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    
    // Booking status analysis
    const activeBookings = bookings.filter(b => ['pending', 'in_transit', 'loaded'].includes(b.status)).length;
    const deliveredBookings = bookings.filter(b => b.status === 'delivered').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    
    // Time-based metrics
    const todayBookings = bookings.filter(b => new Date(b.created_at) >= startOfToday).length;
    const todayRevenue = bookingArticles
      .filter(ba => new Date(ba.bookings.created_at) >= startOfToday)
      .reduce((sum, ba) => sum + (ba.total_amount || 0), 0);
    
    // Fetch real customer data
    const { data: customers = [] } = await supabase
      .from('customers')
      .select('*')
      .eq('branch_id', targetBranch);
    
    // Fetch real vehicle data
    const { data: vehicles = [] } = await supabase
      .from('vehicles')
      .select('*')
      .eq('branch_id', targetBranch);
    
    // Calculate delivery performance
    const totalBookings = bookings.length;
    const deliverySuccessRate = totalBookings > 0 ? (deliveredBookings / totalBookings) * 100 : 0;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    // On-time delivery calculation (bookings delivered within expected timeframe)
    const deliveredWithinTime = bookings.filter(b => {
      if (b.status !== 'delivered' || !b.delivered_at || !b.expected_delivery_date) return false;
      return new Date(b.delivered_at) <= new Date(b.expected_delivery_date);
    }).length;
    
    const onTimeDeliveryRate = deliveredBookings > 0 ? (deliveredWithinTime / deliveredBookings) * 100 : 0;
    
    // Vehicle utilization from active OGPLs
    const { data: activeOGPLs = [] } = await supabase
      .from('ogpl')
      .select('vehicle_id, total_weight, vehicles!inner(max_weight)')
      .eq('branch_id', targetBranch)
      .in('status', ['dispatched', 'in_transit']);
    
    const vehicleUtilizationRate = activeOGPLs.length > 0 
      ? activeOGPLs.reduce((acc, ogpl) => {
          return acc + ((ogpl.total_weight || 0) / (ogpl.vehicles?.max_weight || 1)) * 100;
        }, 0) / activeOGPLs.length
      : 0;
    
    // Top customers by revenue
    const customerBookings = {};
    bookingArticles.forEach(ba => {
      const booking = ba.bookings;
      if (booking.sender_id) {
        if (!customerBookings[booking.sender_id]) {
          customerBookings[booking.sender_id] = {
            id: booking.sender_id,
            name: booking.sender_name || 'Unknown',
            totalBookings: 0,
            totalRevenue: 0
          };
        }
        customerBookings[booking.sender_id].totalBookings++;
        customerBookings[booking.sender_id].totalRevenue += ba.total_amount || 0;
      }
    });
    
    const topCustomers = Object.values(customerBookings)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
    
    // Popular routes
    const routeCounts = {};
    bookings.forEach(booking => {
      const route = `${booking.from_city || 'Unknown'}-${booking.to_city || 'Unknown'}`;
      if (!routeCounts[route]) {
        routeCounts[route] = {
          from: booking.from_city || 'Unknown',
          to: booking.to_city || 'Unknown',
          count: 0,
          revenue: 0
        };
      }
      routeCounts[route].count++;
    });
    
    // Add revenue to routes from booking_articles
    bookingArticles.forEach(ba => {
      const booking = ba.bookings;
      const route = `${booking.from_city || 'Unknown'}-${booking.to_city || 'Unknown'}`;
      if (routeCounts[route]) {
        routeCounts[route].revenue += ba.total_amount || 0;
      }
    });
    
    const popularRoutes = Object.values(routeCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const metrics = {
      // Core business metrics
      totalBookings,
      activeBookings,
      deliveredBookings,
      cancelledBookings,
      totalRevenue,
      monthRevenue,
      todayRevenue,
      averageBookingValue,
      monthlyGrowthRate,
      
      // Performance metrics
      deliverySuccessRate,
      onTimeDeliveryRate,
      
      // Time-based metrics
      todayBookings,
      weekBookings: bookings.filter(b => new Date(b.created_at) >= startOfWeek).length,
      monthBookings: bookings.filter(b => new Date(b.created_at) >= startOfMonth).length,
      weekRevenue: bookingArticles
        .filter(ba => new Date(ba.bookings.created_at) >= startOfWeek)
        .reduce((sum, ba) => sum + (ba.total_amount || 0), 0),
      
      // Customer metrics
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.is_active).length,
      newCustomersThisMonth: customers.filter(c => new Date(c.created_at) >= startOfMonth).length,
      topCustomers,
      
      // Vehicle & operational metrics
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.is_active).length,
      vehiclesInTransit: activeOGPLs.length,
      vehicleUtilizationRate,
      
      // Route metrics
      popularRoutes,
      
      // Additional operational metrics
      averageDeliveryTime: 48, // TODO: Calculate from actual delivery data
      customerSatisfactionScore: 4.2, // TODO: Implement rating system
      
      // Financial metrics (to be enhanced)
      outstandingPayments: 0, // TODO: Calculate from payment system
      profitMargin: 25, // TODO: Calculate from cost data
      
      // Operational metrics (to be enhanced)
      warehouseCapacityUtilization: 0, // TODO: Implement warehouse tracking
      pendingOGPLs: 0, // TODO: Count pending OGPLs
      articlesInTransit: bookingArticles.filter(ba => 
        ['loaded', 'in_transit'].includes(ba.status)
      ).length
    };
    
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard metrics',
      details: error.message 
    });
  }
});

// Get dashboard trends (enhanced with booking_articles data)
router.get('/trends', async (req: any, res) => {
  try {
    const { branchId: branch_id } = req;
    const { days = 30, branch_id: queryBranch } = req.query;
    
    const targetBranch = queryBranch || branch_id;
    const daysNum = parseInt(days);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysNum);
    
    // Fetch booking articles with booking info for accurate revenue
    const { data: bookingArticles = [] } = await supabase
      .from('booking_articles')
      .select(`
        total_amount, status,
        bookings!inner(id, status, created_at, from_branch, to_branch)
      `)
      .or('bookings.from_branch.eq.' + targetBranch + ',bookings.to_branch.eq.' + targetBranch)
      .gte('bookings.created_at', startDate.toISOString())
      .lte('bookings.created_at', endDate.toISOString());
    
    // Group by date
    const trendData = {};
    
    // Initialize all dates
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      trendData[dateStr] = {
        date: dateStr,
        bookings: 0,
        revenue: 0,
        deliveries: 0,
        articlesShipped: 0
      };
    }
    
    // Track processed bookings to avoid duplicates
    const processedBookings = new Set();
    
    // Aggregate data
    bookingArticles.forEach(ba => {
      const dateStr = ba.bookings.created_at.split('T')[0];
      if (trendData[dateStr]) {
        trendData[dateStr].revenue += ba.total_amount || 0;
        trendData[dateStr].articlesShipped++;
        
        // Count unique bookings
        if (!processedBookings.has(ba.bookings.id)) {
          trendData[dateStr].bookings++;
          processedBookings.add(ba.bookings.id);
          
          if (ba.bookings.status === 'delivered') {
            trendData[dateStr].deliveries++;
          }
        }
      }
    });
    
    const trends = Object.values(trendData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    res.json({ success: true, data: trends });
  } catch (error) {
    console.error('Error fetching dashboard trends:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard trends',
      details: error.message 
    });
  }
});

// Get revenue breakdown
router.get('/revenue-breakdown', async (req: any, res) => {
  try {
    const { branchId: branch_id } = req;
    const { branch_id: queryBranch } = req.query;
    
    const targetBranch = queryBranch || branch_id;
    
    // Fetch bookings with articles for accurate revenue
    const { data: bookingArticles = [] } = await supabase
      .from('booking_articles')
      .select(`
        total_amount,
        bookings!inner(payment_type, from_branch, to_branch)
      `)
      .or('bookings.from_branch.eq.' + targetBranch + ',bookings.to_branch.eq.' + targetBranch);
    
    // Calculate revenue by payment type
    const revenueByPaymentType = {};
    
    bookingArticles.forEach(ba => {
      const type = ba.bookings.payment_type || 'unknown';
      if (!revenueByPaymentType[type]) {
        revenueByPaymentType[type] = 0;
      }
      revenueByPaymentType[type] += ba.total_amount || 0;
    });
    
    const totalRevenue = Object.values(revenueByPaymentType).reduce((sum, val) => sum + val, 0);
    
    const breakdown = Object.entries(revenueByPaymentType).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0
    }));
    
    res.json({ success: true, data: breakdown });
  } catch (error) {
    console.error('Error fetching revenue breakdown:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch revenue breakdown',
      details: error.message 
    });
  }
});

// Get recent activities
router.get('/recent-activities', async (req: any, res) => {
  try {
    const { branchId: branch_id } = req;
    const { limit = 10, branch_id: queryBranch } = req.query;
    
    const targetBranch = queryBranch || branch_id;
    
    // Fetch recent bookings
    const { data: bookings = [] } = await supabase
      .from('bookings')
      .select('*')
      .or(`from_branch.eq.${targetBranch},to_branch.eq.${targetBranch}`)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    // Transform to activities
    const activities = bookings.map(booking => ({
      id: booking.id,
      type: 'booking',
      description: `New booking ${booking.lr_number} from ${booking.from_city} to ${booking.to_city}`,
      timestamp: booking.created_at,
      user: booking.created_by,
      metadata: {
        bookingId: booking.id,
        lrNumber: booking.lr_number,
        amount: booking.total_amount,
        status: booking.status
      }
    }));
    
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch recent activities',
      details: error.message 
    });
  }
});

export default router;