import { supabase } from '../supabaseClient';

// Business validation utilities for logistics operations
// These ensure data integrity and business rule compliance

export interface ValidationResult {
  valid: boolean;
  message?: string;
  details?: any;
  warnings?: string[];
}

/**
 * Validates customer credit limit before booking creation
 */
export async function validateCustomerCreditLimit(
  customerId: string, 
  bookingAmount: number, 
  orgId: string
): Promise<ValidationResult> {
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('credit_limit, current_balance, credit_status, name, payment_terms')
      .eq('id', customerId)
      .eq('organization_id', orgId)
      .single();

    if (error) {
      return { valid: false, message: `Customer validation failed: ${error.message}` };
    }

    if (!customer) {
      return { valid: false, message: 'Customer not found' };
    }

    // Check if customer account is active
    if (customer.credit_status === 'Blocked') {
      return { 
        valid: false, 
        message: `Customer account is blocked. Cannot create new bookings.`,
        details: { status: customer.credit_status }
      };
    }

    if (customer.credit_status === 'Suspended') {
      return { 
        valid: false, 
        message: `Customer account is suspended. Please contact administration.`,
        details: { status: customer.credit_status }
      };
    }

    // Check credit limit
    const creditLimit = customer.credit_limit || 0;
    const currentBalance = customer.current_balance || 0;
    const availableCredit = creditLimit - currentBalance;

    if (creditLimit > 0 && bookingAmount > availableCredit) {
      return {
        valid: false,
        message: `Booking amount ₹${bookingAmount.toFixed(2)} exceeds available credit limit ₹${availableCredit.toFixed(2)}`,
        details: {
          booking_amount: bookingAmount,
          credit_limit: creditLimit,
          current_balance: currentBalance,
          available_credit: availableCredit
        }
      };
    }

    const warnings = [];
    
    // Warn if using more than 80% of credit limit
    if (creditLimit > 0 && (currentBalance + bookingAmount) > (creditLimit * 0.8)) {
      warnings.push(`This booking will use ${((currentBalance + bookingAmount) / creditLimit * 100).toFixed(1)}% of credit limit`);
    }

    // Warn if customer is on hold
    if (customer.credit_status === 'On Hold') {
      warnings.push('Customer account is on hold - requires approval');
    }

    return {
      valid: true,
      details: {
        customer_name: customer.name,
        credit_limit: creditLimit,
        current_balance: currentBalance,
        available_credit: availableCredit,
        payment_terms: customer.payment_terms
      },
      warnings
    };

  } catch (error: any) {
    return { valid: false, message: `Credit validation error: ${error.message}` };
  }
}

/**
 * Validates article availability and stock levels
 */
export async function validateArticleAvailability(
  articleId: string, 
  quantity: number, 
  branchId: string,
  orgId: string
): Promise<ValidationResult> {
  try {
    // Check if article exists and is active
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, name, min_quantity, branch_id, organization_id, is_fragile, requires_special_handling')
      .eq('id', articleId)
      .eq('organization_id', orgId)
      .single();

    if (articleError || !article) {
      return { valid: false, message: `Article not found: ${articleId}` };
    }

    // Check minimum quantity requirement
    if (article.min_quantity && quantity < article.min_quantity) {
      return {
        valid: false,
        message: `Minimum quantity for "${article.name}" is ${article.min_quantity}. Requested: ${quantity}`,
        details: {
          article_name: article.name,
          min_quantity: article.min_quantity,
          requested_quantity: quantity
        }
      };
    }

    // TODO: Add warehouse stock validation
    // For now, we'll just check if there are any inventory records
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory_records')
      .select('quantity, status')
      .eq('article_id', articleId);

    const warnings = [];
    
    if (article.is_fragile) {
      warnings.push('This is a fragile item - handle with care');
    }

    if (article.requires_special_handling) {
      warnings.push('Special handling required for this article');
    }

    // Check inventory availability (if inventory system is implemented)
    if (inventory && inventory.length > 0) {
      const availableStock = inventory
        .filter(inv => inv.status === 'available')
        .reduce((sum, inv) => sum + inv.quantity, 0);
      
      if (availableStock < quantity) {
        warnings.push(`Limited stock available: ${availableStock} units in inventory`);
      }
    }

    return {
      valid: true,
      details: {
        article_name: article.name,
        is_fragile: article.is_fragile,
        requires_special_handling: article.requires_special_handling,
        min_quantity: article.min_quantity
      },
      warnings
    };

  } catch (error: any) {
    return { valid: false, message: `Article validation error: ${error.message}` };
  }
}

/**
 * Validates vehicle capacity for OGPL loading
 */
export async function validateVehicleCapacity(
  vehicleId: string, 
  totalWeight: number,
  totalVolume?: number
): Promise<ValidationResult> {
  try {
    if (!vehicleId) {
      return { valid: true, message: 'No vehicle assigned - capacity check skipped' };
    }

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('vehicle_number, make, model, capacity, status')
      .eq('id', vehicleId)
      .single();

    if (error || !vehicle) {
      return { valid: false, message: `Vehicle not found: ${vehicleId}` };
    }

    if (vehicle.status !== 'active') {
      return {
        valid: false,
        message: `Vehicle ${vehicle.vehicle_number} is not active (Status: ${vehicle.status})`,
        details: { vehicle_status: vehicle.status }
      };
    }

    // Parse capacity string (e.g., "10 Tons", "5000 Kg", "20 CBM")
    const capacityStr = vehicle.capacity || '';
    const weightMatch = capacityStr.match(/(\d+(?:\.\d+)?)\s*(kg|tons?)/i);
    const volumeMatch = capacityStr.match(/(\d+(?:\.\d+)?)\s*(cbm|m3|cubic)/i);
    
    const warnings = [];
    let utilizationPercent = 0;

    // Validate weight capacity
    if (weightMatch) {
      const [, capacityValue, unit] = weightMatch;
      const capacityInKg = unit.toLowerCase().includes('ton') 
        ? parseFloat(capacityValue) * 1000 
        : parseFloat(capacityValue);

      if (totalWeight > capacityInKg) {
        return {
          valid: false,
          message: `Total weight ${totalWeight.toFixed(2)}kg exceeds vehicle capacity ${capacityInKg}kg`,
          details: {
            total_weight: totalWeight,
            vehicle_capacity: capacityInKg,
            excess_weight: totalWeight - capacityInKg
          }
        };
      }

      utilizationPercent = (totalWeight / capacityInKg) * 100;
      
      if (utilizationPercent > 90) {
        warnings.push(`High capacity utilization: ${utilizationPercent.toFixed(1)}%`);
      } else if (utilizationPercent > 100) {
        warnings.push(`Overweight warning: ${utilizationPercent.toFixed(1)}% of capacity`);
      }
    } else {
      warnings.push('Vehicle weight capacity not specified in system');
    }

    // Validate volume capacity (if provided)
    if (volumeMatch && totalVolume) {
      const [, volumeCapacity] = volumeMatch;
      const capacityInCBM = parseFloat(volumeCapacity);

      if (totalVolume > capacityInCBM) {
        return {
          valid: false,
          message: `Total volume ${totalVolume.toFixed(2)}CBM exceeds vehicle capacity ${capacityInCBM}CBM`,
          details: {
            total_volume: totalVolume,
            vehicle_volume_capacity: capacityInCBM
          }
        };
      }
    }

    return {
      valid: true,
      details: {
        vehicle_number: vehicle.vehicle_number,
        vehicle_make_model: `${vehicle.make} ${vehicle.model}`,
        capacity_utilization: utilizationPercent,
        weight_capacity_kg: weightMatch ? (weightMatch[2].toLowerCase().includes('ton') 
          ? parseFloat(weightMatch[1]) * 1000 
          : parseFloat(weightMatch[1])) : null
      },
      warnings
    };

  } catch (error: any) {
    return { valid: false, message: `Vehicle validation error: ${error.message}` };
  }
}

/**
 * Validates route between branches
 */
export async function validateRoute(
  fromBranchId: string, 
  toBranchId: string, 
  orgId: string
): Promise<ValidationResult> {
  try {
    if (fromBranchId === toBranchId) {
      return { valid: false, message: 'Origin and destination branches cannot be the same' };
    }

    // Check if both branches exist and belong to the organization
    const { data: branches, error } = await supabase
      .from('branches')
      .select('id, name, city, state, status')
      .in('id', [fromBranchId, toBranchId])
      .eq('organization_id', orgId);

    if (error) {
      return { valid: false, message: `Route validation failed: ${error.message}` };
    }

    if (!branches || branches.length !== 2) {
      return { valid: false, message: 'One or more branches not found in your organization' };
    }

    const fromBranch = branches.find(b => b.id === fromBranchId);
    const toBranch = branches.find(b => b.id === toBranchId);

    if (!fromBranch || !toBranch) {
      return { valid: false, message: 'Invalid branch configuration' };
    }

    // Check if branches are active
    if (fromBranch.status !== 'active') {
      return { 
        valid: false, 
        message: `Origin branch "${fromBranch.name}" is not active (Status: ${fromBranch.status})` 
      };
    }

    if (toBranch.status !== 'active') {
      return { 
        valid: false, 
        message: `Destination branch "${toBranch.name}" is not active (Status: ${toBranch.status})` 
      };
    }

    // TODO: Add route distance and time calculation
    // TODO: Add route restriction validation (some routes might be blocked)

    const warnings = [];
    
    // Warn about same-state vs inter-state shipments
    if (fromBranch.state !== toBranch.state) {
      warnings.push('Inter-state shipment - may require additional documentation');
    }

    return {
      valid: true,
      details: {
        from_branch: `${fromBranch.name}, ${fromBranch.city}`,
        to_branch: `${toBranch.name}, ${toBranch.city}`,
        is_interstate: fromBranch.state !== toBranch.state,
        from_state: fromBranch.state,
        to_state: toBranch.state
      },
      warnings
    };

  } catch (error: any) {
    return { valid: false, message: `Route validation error: ${error.message}` };
  }
}

/**
 * Validates booking weight calculations
 */
export function validateWeightCalculation(
  actualWeight: number,
  chargedWeight?: number,
  quantity: number = 1
): ValidationResult {
  const warnings = [];

  // Basic weight validation
  if (actualWeight <= 0) {
    return { valid: false, message: 'Actual weight must be greater than zero' };
  }

  if (actualWeight > 50000) { // 50 tons max
    return { valid: false, message: 'Actual weight exceeds maximum limit of 50,000 kg' };
  }

  // Charged weight validation
  if (chargedWeight !== undefined) {
    if (chargedWeight < actualWeight) {
      return { 
        valid: false, 
        message: `Charged weight (${chargedWeight}kg) cannot be less than actual weight (${actualWeight}kg)` 
      };
    }

    const weightDifference = chargedWeight - actualWeight;
    const differencePercent = (weightDifference / actualWeight) * 100;

    if (differencePercent > 50) {
      warnings.push(`Large difference between actual and charged weight: ${differencePercent.toFixed(1)}%`);
    }
  }

  // Quantity-weight consistency check
  const weightPerUnit = actualWeight / quantity;
  if (weightPerUnit > 1000) { // More than 1 ton per unit
    warnings.push(`High weight per unit: ${weightPerUnit.toFixed(2)}kg per unit`);
  }

  if (weightPerUnit < 0.001) { // Less than 1 gram per unit
    warnings.push(`Very low weight per unit: ${(weightPerUnit * 1000).toFixed(2)}g per unit`);
  }

  return {
    valid: true,
    details: {
      actual_weight: actualWeight,
      charged_weight: chargedWeight || actualWeight,
      weight_per_unit: weightPerUnit,
      total_units: quantity
    },
    warnings
  };
}

/**
 * Validates financial amounts and calculations
 */
export function validateFinancialAmounts(
  rate: number,
  quantity: number,
  weight: number,
  rateType: 'per_kg' | 'per_quantity'
): ValidationResult {
  const warnings = [];

  // Basic amount validation
  if (rate < 0) {
    return { valid: false, message: 'Rate cannot be negative' };
  }

  if (rate > 999999) {
    return { valid: false, message: 'Rate exceeds maximum allowed value' };
  }

  // Calculate freight amount
  const freightAmount = rateType === 'per_kg' ? weight * rate : quantity * rate;

  if (freightAmount > 10000000) { // 1 crore
    return { valid: false, message: 'Freight amount exceeds maximum limit of ₹1,00,00,000' };
  }

  // Rate reasonableness checks
  if (rateType === 'per_kg') {
    if (rate > 1000) {
      warnings.push(`High per-kg rate: ₹${rate}/kg`);
    }
    if (rate < 1) {
      warnings.push(`Low per-kg rate: ₹${rate}/kg`);
    }
  } else {
    if (rate > 50000) {
      warnings.push(`High per-unit rate: ₹${rate}/unit`);
    }
  }

  return {
    valid: true,
    details: {
      rate_type: rateType,
      rate_per_unit: rate,
      freight_amount: freightAmount,
      calculation: rateType === 'per_kg' 
        ? `${weight}kg × ₹${rate} = ₹${freightAmount}`
        : `${quantity} units × ₹${rate} = ₹${freightAmount}`
    },
    warnings
  };
}

/**
 * Comprehensive booking validation that combines all checks
 */
export async function validateCompleteBooking(bookingData: {
  sender_id: string;
  receiver_id: string;
  from_branch: string;
  to_branch: string;
  organization_id: string;
  articles: Array<{
    article_id: string;
    quantity: number;
    actual_weight: number;
    charged_weight?: number;
    rate_per_unit: number;
    rate_type: 'per_kg' | 'per_quantity';
  }>;
  total_amount: number;
  vehicle_id?: string;
}): Promise<ValidationResult> {
  const validationResults = [];
  const allWarnings = [];

  try {
    // Validate sender credit limit
    const creditValidation = await validateCustomerCreditLimit(
      bookingData.sender_id, 
      bookingData.total_amount, 
      bookingData.organization_id
    );
    validationResults.push(creditValidation);
    if (creditValidation.warnings) allWarnings.push(...creditValidation.warnings);

    // Validate route
    const routeValidation = await validateRoute(
      bookingData.from_branch, 
      bookingData.to_branch, 
      bookingData.organization_id
    );
    validationResults.push(routeValidation);
    if (routeValidation.warnings) allWarnings.push(...routeValidation.warnings);

    // Validate each article
    let totalWeight = 0;
    for (const article of bookingData.articles) {
      const articleValidation = await validateArticleAvailability(
        article.article_id, 
        article.quantity, 
        bookingData.from_branch,
        bookingData.organization_id
      );
      validationResults.push(articleValidation);
      if (articleValidation.warnings) allWarnings.push(...articleValidation.warnings);

      // Validate weight calculations
      const weightValidation = validateWeightCalculation(
        article.actual_weight,
        article.charged_weight,
        article.quantity
      );
      validationResults.push(weightValidation);
      if (weightValidation.warnings) allWarnings.push(...weightValidation.warnings);

      // Validate financial amounts
      const financialValidation = validateFinancialAmounts(
        article.rate_per_unit,
        article.quantity,
        article.charged_weight || article.actual_weight,
        article.rate_type
      );
      validationResults.push(financialValidation);
      if (financialValidation.warnings) allWarnings.push(...financialValidation.warnings);

      totalWeight += article.charged_weight || article.actual_weight;
    }

    // Validate vehicle capacity if vehicle is assigned
    if (bookingData.vehicle_id) {
      const vehicleValidation = await validateVehicleCapacity(
        bookingData.vehicle_id, 
        totalWeight
      );
      validationResults.push(vehicleValidation);
      if (vehicleValidation.warnings) allWarnings.push(...vehicleValidation.warnings);
    }

    // Check if any validation failed
    const failedValidation = validationResults.find(result => !result.valid);
    if (failedValidation) {
      return {
        valid: false,
        message: failedValidation.message,
        details: failedValidation.details
      };
    }

    return {
      valid: true,
      message: 'All validations passed',
      details: {
        total_weight: totalWeight,
        total_amount: bookingData.total_amount,
        articles_count: bookingData.articles.length
      },
      warnings: allWarnings
    };

  } catch (error: any) {
    return {
      valid: false,
      message: `Validation error: ${error.message}`
    };
  }
}