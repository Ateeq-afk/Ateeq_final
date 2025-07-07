import { z } from 'zod';

// Schema for individual articles within a booking
export const bookingArticleSchema = z.object({
  // Reference to existing article (optional for new articles)
  article_id: z.string().optional(),
  
  // Article identification
  description: z.string().min(1, 'Article description is required'),
  private_mark_number: z.string().optional(),
  
  // Quantities and measurements
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_of_measure: z.string().default('Nos'),
  actual_weight: z.number().min(0.001, 'Actual weight must be greater than 0'),
  charged_weight: z.number().optional(),
  declared_value: z.number().min(0).optional(),
  
  // Pricing information
  rate_per_unit: z.number().min(0, 'Rate per unit cannot be negative'),
  rate_type: z.enum(['per_kg', 'per_quantity']).default('per_quantity'),
  freight_amount: z.number().min(0, 'Freight amount cannot be negative'),
  
  // Additional charges (per unit)
  loading_charge_per_unit: z.number().min(0).default(0),
  unloading_charge_per_unit: z.number().min(0).default(0),
  
  // Insurance and packaging
  insurance_required: z.boolean().default(false),
  insurance_value: z.number().min(0).optional(),
  insurance_charge: z.number().min(0).default(0),
  packaging_charge: z.number().min(0).default(0),
  
  // Article attributes
  is_fragile: z.boolean().default(false),
  special_instructions: z.string().optional(),
}).refine(data => {
  // Charged weight should be >= actual weight if provided
  if (data.charged_weight && data.charged_weight < data.actual_weight) {
    return false;
  }
  return true;
}, {
  message: 'Charged weight must be greater than or equal to actual weight',
  path: ['charged_weight']
}).refine(data => {
  // If insurance is required, insurance value should be provided
  if (data.insurance_required && !data.insurance_value) {
    return false;
  }
  return true;
}, {
  message: 'Insurance value is required when insurance is enabled',
  path: ['insurance_value']
});

// Validation function for article combinations within a booking
export const validateArticleCombination = (articles: z.infer<typeof bookingArticleSchema>[]) => {
  // Check for duplicate descriptions within the same booking
  const descriptions = articles.map(a => a.description.toLowerCase().trim());
  const uniqueDescriptions = new Set(descriptions);
  
  if (descriptions.length !== uniqueDescriptions.size) {
    throw new Error('Duplicate article descriptions are not allowed in the same booking');
  }
  
  // Check total weight doesn't exceed reasonable limits
  const totalWeight = articles.reduce((sum, article) => sum + article.actual_weight, 0);
  if (totalWeight > 50000) { // 50 tonnes
    throw new Error('Total booking weight cannot exceed 50,000 kg');
  }
  
  // Check total declared value for insurance requirements
  const totalDeclaredValue = articles.reduce((sum, article) => 
    sum + (article.declared_value || 0), 0);
  
  if (totalDeclaredValue > 1000000) { // 10 lakh
    const hasInsurance = articles.some(article => article.insurance_required);
    if (!hasInsurance) {
      throw new Error('Insurance is recommended for high-value shipments (>₹10L)');
    }
  }
  
  return true;
};

// Calculate freight amount based on rate type
export function calculateFreightAmount(article: {
  rate_per_unit: number;
  rate_type: 'per_kg' | 'per_quantity';
  quantity: number;
  actual_weight: number;
  charged_weight?: number;
}): number {
  if (article.rate_type === 'per_kg') {
    // Use charged weight if available, otherwise actual weight
    const weight = article.charged_weight || article.actual_weight;
    return weight * article.rate_per_unit;
  } else {
    return article.quantity * article.rate_per_unit;
  }
}

export type BookingArticle = z.infer<typeof bookingArticleSchema>;