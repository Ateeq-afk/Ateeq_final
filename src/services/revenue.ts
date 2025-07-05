import { supabase } from '@/lib/supabase';
import type { Booking, Customer, Article } from '@/types';

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  averageBookingValue: number;
  collectionRate: number;
  profitMargin: number;
  growthRate: number;
}

export interface PricingFactors {
  baseRate: number;
  distanceMultiplier: number;
  urgencyMultiplier: number;
  seasonalAdjustment: number;
  fuelSurcharge: number;
  volumeDiscount: number;
  loyaltyDiscount: number;
}

export interface RevenueForecast {
  nextMonth: number;
  nextQuarter: number;
  yearEnd: number;
  confidence: number;
}

export interface RevenueOptimization {
  recommendations: string[];
  potentialIncrease: number;
  implementationComplexity: 'low' | 'medium' | 'high';
}

class RevenueService {
  /**
   * Calculate comprehensive revenue metrics
   */
  async calculateRevenueMetrics(organizationId: string, dateRange?: string): Promise<RevenueMetrics> {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentYear = new Date(now.getFullYear(), 0, 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Filter bookings by periods
      const currentMonthBookings = bookings.filter(b => new Date(b.created_at) >= currentMonth);
      const currentYearBookings = bookings.filter(b => new Date(b.created_at) >= currentYear);
      const lastMonthBookings = bookings.filter(b => {
        const date = new Date(b.created_at);
        return date >= lastMonth && date < currentMonth;
      });

      // Calculate metrics
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const monthlyRevenue = currentMonthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const yearlyRevenue = currentYearBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

      const averageBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;
      
      // Collection rate (paid vs total)
      const paidAmount = bookings
        .filter(b => b.payment_type === 'Paid')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const collectionRate = totalRevenue > 0 ? (paidAmount / totalRevenue) * 100 : 0;

      // Estimated profit margin (assuming 25-30% average)
      const profitMargin = 27.5;

      // Growth rate (month over month)
      const growthRate = lastMonthRevenue > 0 ? 
        ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      return {
        totalRevenue,
        monthlyRevenue,
        yearlyRevenue,
        averageBookingValue,
        collectionRate,
        profitMargin,
        growthRate
      };
    } catch (error) {
      console.error('Error calculating revenue metrics:', error);
      throw new Error('Failed to calculate revenue metrics');
    }
  }

  /**
   * Calculate dynamic pricing based on multiple factors
   */
  calculateDynamicPricing(
    article: Article,
    customer: Customer,
    quantity: number,
    distance: number,
    urgency: 'standard' | 'express' | 'urgent' = 'standard',
    additionalFactors: Partial<PricingFactors> = {}
  ): PricingFactors {
    let baseRate = article.base_rate;

    // Distance-based pricing
    const distanceMultiplier = 
      distance <= 50 ? 1.0 :
      distance <= 200 ? 1.2 :
      distance <= 500 ? 1.5 : 1.8;

    // Urgency multiplier
    const urgencyMultipliers = {
      standard: 1.0,
      express: 1.25,
      urgent: 1.5
    };
    const urgencyMultiplier = urgencyMultipliers[urgency];

    // Seasonal adjustment (peak season: Nov-Feb)
    const currentMonth = new Date().getMonth();
    const isPeakSeason = [10, 11, 0, 1].includes(currentMonth);
    const seasonalAdjustment = isPeakSeason ? 1.1 : 0.95;

    // Fuel surcharge (current market rate: 4%)
    const fuelSurcharge = 1.04;

    // Volume discounts
    let volumeDiscount = 1.0;
    if (quantity >= 50) volumeDiscount = 0.9; // 10% discount
    else if (quantity >= 20) volumeDiscount = 0.95; // 5% discount
    else if (quantity >= 10) volumeDiscount = 0.97; // 3% discount

    // Customer loyalty discount (based on customer type and history)
    let loyaltyDiscount = 1.0;
    if (customer.type === 'company') {
      loyaltyDiscount = 0.95; // 5% discount for corporate customers
    }

    // Apply additional factors if provided
    const finalFactors = {
      baseRate,
      distanceMultiplier: additionalFactors.distanceMultiplier || distanceMultiplier,
      urgencyMultiplier: additionalFactors.urgencyMultiplier || urgencyMultiplier,
      seasonalAdjustment: additionalFactors.seasonalAdjustment || seasonalAdjustment,
      fuelSurcharge: additionalFactors.fuelSurcharge || fuelSurcharge,
      volumeDiscount: additionalFactors.volumeDiscount || volumeDiscount,
      loyaltyDiscount: additionalFactors.loyaltyDiscount || loyaltyDiscount,
    };

    return finalFactors;
  }

  /**
   * Calculate final price using pricing factors
   */
  calculateFinalPrice(quantity: number, factors: PricingFactors): number {
    const {
      baseRate,
      distanceMultiplier,
      urgencyMultiplier,
      seasonalAdjustment,
      fuelSurcharge,
      volumeDiscount,
      loyaltyDiscount
    } = factors;

    let finalPrice = baseRate * quantity;
    finalPrice *= distanceMultiplier;
    finalPrice *= urgencyMultiplier;
    finalPrice *= seasonalAdjustment;
    finalPrice *= fuelSurcharge;
    finalPrice *= volumeDiscount;
    finalPrice *= loyaltyDiscount;

    return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Generate revenue forecast using historical data
   */
  async generateRevenueForecast(organizationId: string): Promise<RevenueForecast> {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('created_at, total_amount')
        .eq('organization_id', organizationId)
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Simple linear regression for trend analysis
      const monthlyRevenue = this.groupRevenueByMonth(bookings);
      const trend = this.calculateTrend(monthlyRevenue);
      const seasonality = this.calculateSeasonality(monthlyRevenue);

      const currentAverage = monthlyRevenue.slice(-3).reduce((sum, r) => sum + r.revenue, 0) / 3;

      // Apply trend and seasonality
      const nextMonth = Math.max(0, currentAverage * (1 + trend) * seasonality);
      const nextQuarter = nextMonth * 3 * (1 + trend * 2);
      const yearEnd = currentAverage * 12 * (1 + trend * 6);

      // Confidence based on data consistency
      const variance = this.calculateVariance(monthlyRevenue.map(m => m.revenue));
      const confidence = Math.max(0.5, Math.min(0.95, 1 - (variance / (currentAverage * currentAverage))));

      return {
        nextMonth,
        nextQuarter,
        yearEnd,
        confidence
      };
    } catch (error) {
      console.error('Error generating revenue forecast:', error);
      throw new Error('Failed to generate revenue forecast');
    }
  }

  /**
   * Generate revenue optimization recommendations
   */
  async generateOptimizationRecommendations(organizationId: string): Promise<RevenueOptimization> {
    try {
      const metrics = await this.calculateRevenueMetrics(organizationId);
      const recommendations: string[] = [];
      let potentialIncrease = 0;
      let implementationComplexity: 'low' | 'medium' | 'high' = 'low';

      // Analyze collection rate
      if (metrics.collectionRate < 80) {
        recommendations.push('Improve collection processes - implement automated payment reminders');
        potentialIncrease += 0.05; // 5% potential increase
      }

      // Analyze pricing strategy
      if (metrics.averageBookingValue < 2000) {
        recommendations.push('Consider implementing dynamic pricing based on demand and distance');
        potentialIncrease += 0.08; // 8% potential increase
        implementationComplexity = 'medium';
      }

      // Analyze growth rate
      if (metrics.growthRate < 5) {
        recommendations.push('Focus on customer acquisition and retention programs');
        potentialIncrease += 0.12; // 12% potential increase
        implementationComplexity = 'high';
      }

      // Volume-based recommendations
      recommendations.push('Implement bulk booking discounts to increase average order value');
      potentialIncrease += 0.06; // 6% potential increase

      // Seasonal optimization
      recommendations.push('Adjust pricing seasonally to maximize revenue during peak periods');
      potentialIncrease += 0.04; // 4% potential increase

      return {
        recommendations,
        potentialIncrease: potentialIncrease * 100, // Convert to percentage
        implementationComplexity
      };
    } catch (error) {
      console.error('Error generating optimization recommendations:', error);
      throw new Error('Failed to generate optimization recommendations');
    }
  }

  /**
   * Save custom pricing template
   */
  async savePricingTemplate(
    organizationId: string,
    name: string,
    factors: PricingFactors,
    conditions: any
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('pricing_templates')
        .insert({
          organization_id: organizationId,
          name,
          factors,
          conditions,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving pricing template:', error);
      throw new Error('Failed to save pricing template');
    }
  }

  /**
   * Get saved pricing templates
   */
  async getPricingTemplates(organizationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('pricing_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pricing templates:', error);
      throw new Error('Failed to fetch pricing templates');
    }
  }

  // Helper methods
  private groupRevenueByMonth(bookings: any[]): { month: string; revenue: number }[] {
    const monthlyData: { [key: string]: number } = {};

    bookings.forEach(booking => {
      const date = new Date(booking.created_at);
      const monthKey = `${date.getFullYear()}-${date.getMonth().toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += booking.total_amount || 0;
    });

    return Object.entries(monthlyData).map(([month, revenue]) => ({ month, revenue }));
  }

  private calculateTrend(monthlyRevenue: { month: string; revenue: number }[]): number {
    if (monthlyRevenue.length < 2) return 0;

    const n = monthlyRevenue.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0);
    const sumXY = monthlyRevenue.reduce((sum, item, index) => sum + index * item.revenue, 0);
    const sumX2 = monthlyRevenue.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgRevenue = sumY / n;

    return avgRevenue > 0 ? slope / avgRevenue : 0;
  }

  private calculateSeasonality(monthlyRevenue: { month: string; revenue: number }[]): number {
    // Simple seasonality: current month vs average
    const currentMonth = new Date().getMonth();
    const monthlyAverages: number[] = new Array(12).fill(0);
    const monthlyCounts: number[] = new Array(12).fill(0);

    monthlyRevenue.forEach(item => {
      const month = parseInt(item.month.split('-')[1]);
      monthlyAverages[month] += item.revenue;
      monthlyCounts[month]++;
    });

    // Calculate averages
    for (let i = 0; i < 12; i++) {
      if (monthlyCounts[i] > 0) {
        monthlyAverages[i] /= monthlyCounts[i];
      }
    }

    const overallAverage = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 12;
    const currentMonthFactor = overallAverage > 0 ? monthlyAverages[currentMonth] / overallAverage : 1;

    return Math.max(0.8, Math.min(1.2, currentMonthFactor)); // Cap between 0.8 and 1.2
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}

export const revenueService = new RevenueService();