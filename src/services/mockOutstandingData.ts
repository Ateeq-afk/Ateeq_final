import { OutstandingAmount, OutstandingFilters } from './payments';

// Mock outstanding amounts data
const generateMockOutstandingData = (): OutstandingAmount[] => {
  const customerNames = [
    'ABC Textiles Ltd',
    'XYZ Electronics',
    'Mumbai Fashion House',
    'Delhi Electronics Hub', 
    'Chennai Exports Pvt Ltd',
    'Bangalore Tech Solutions',
    'Rajesh Trading Co',
    'Sharma Logistics',
    'Gupta Industries',
    'Patel Transport'
  ];

  const referenceTypes: Array<'booking' | 'invoice' | 'advance' | 'other'> = ['booking', 'invoice', 'advance', 'other'];
  const statuses: Array<'pending' | 'partially_paid' | 'fully_paid' | 'written_off'> = ['pending', 'partially_paid', 'fully_paid', 'written_off'];
  const agingBuckets: Array<'current' | '1-30_days' | '31-60_days' | '61-90_days' | '90+_days'> = ['current', '1-30_days', '31-60_days', '61-90_days', '90+_days'];

  const mockData: OutstandingAmount[] = [];

  for (let i = 0; i < 25; i++) {
    const originalAmount = Math.floor(Math.random() * 100000) + 5000;
    const paidAmount = Math.floor(Math.random() * originalAmount * 0.7);
    const outstandingAmount = originalAmount - paidAmount;
    const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
    const agingBucket = agingBuckets[Math.floor(Math.random() * agingBuckets.length)];
    
    let overdueDays = 0;
    switch (agingBucket) {
      case 'current':
        overdueDays = 0;
        break;
      case '1-30_days':
        overdueDays = Math.floor(Math.random() * 30) + 1;
        break;
      case '31-60_days':
        overdueDays = Math.floor(Math.random() * 30) + 31;
        break;
      case '61-90_days':
        overdueDays = Math.floor(Math.random() * 30) + 61;
        break;
      case '90+_days':
        overdueDays = Math.floor(Math.random() * 100) + 91;
        break;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - overdueDays);

    let status: 'pending' | 'partially_paid' | 'fully_paid' | 'written_off' = 'pending';
    if (paidAmount > 0 && paidAmount < originalAmount) {
      status = 'partially_paid';
    } else if (paidAmount >= originalAmount) {
      status = 'fully_paid';
    } else if (Math.random() < 0.05) {
      status = 'written_off';
    }

    mockData.push({
      id: `outstanding-${i + 1}`,
      customer_id: `customer-${i + 1}`,
      customer_name: customerName,
      contact_phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      branch_id: 'branch-1',
      organization_id: 'org-1',
      reference_type: referenceTypes[Math.floor(Math.random() * referenceTypes.length)],
      reference_number: `REF-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      original_amount: originalAmount,
      paid_amount: paidAmount,
      outstanding_amount: outstandingAmount,
      due_date: dueDate.toISOString().split('T')[0],
      overdue_days: overdueDays,
      aging_bucket: agingBucket,
      status: status,
      oldest_outstanding_date: dueDate.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system',
      is_deleted: false,
    });
  }

  return mockData.sort((a, b) => b.overdue_days - a.overdue_days);
};

export const mockOutstandingData = generateMockOutstandingData();

export const getMockOutstandingAmounts = (filters: OutstandingFilters = {}) => {
  let filteredData = [...mockOutstandingData];

  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    filteredData = filteredData.filter(item => item.status === filters.status);
  }

  // Apply aging bucket filter
  if (filters.aging_bucket && filters.aging_bucket !== 'all') {
    filteredData = filteredData.filter(item => item.aging_bucket === filters.aging_bucket);
  }

  // Apply customer search filter
  if (filters.customer_search) {
    const searchTerm = filters.customer_search.toLowerCase();
    filteredData = filteredData.filter(item => 
      item.customer_name?.toLowerCase().includes(searchTerm) ||
      item.reference_number.toLowerCase().includes(searchTerm)
    );
  }

  // Apply amount filters
  if (filters.min_amount) {
    filteredData = filteredData.filter(item => item.outstanding_amount >= filters.min_amount!);
  }
  if (filters.max_amount) {
    filteredData = filteredData.filter(item => item.outstanding_amount <= filters.max_amount!);
  }

  // Apply pagination
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: filteredData.length,
      totalPages: Math.ceil(filteredData.length / limit),
    },
  };
};