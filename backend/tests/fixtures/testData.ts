export const testOrganizations = {
  logistics_company: {
    name: 'Test Logistics Company',
    code: 'TLC001',
    address: '123 Main Street, Test City',
    contact_email: 'admin@testlogistics.com',
    contact_phone: '+91-9876543210',
    gst_number: 'TEST123456789',
    pan_number: 'TESTPAN123',
    is_active: true
  },
  
  transport_corp: {
    name: 'Test Transport Corporation',
    code: 'TTC002',
    address: '456 Business Park, Transport Hub',
    contact_email: 'contact@testtransport.com',
    contact_phone: '+91-8765432109',
    gst_number: 'TEST987654321',
    pan_number: 'TESTPAN456',
    is_active: true
  }
};

export const testBranches = {
  mumbai_branch: {
    name: 'Mumbai Branch',
    code: 'MUM001',
    address: 'Plot 123, Andheri East, Mumbai',
    contact_email: 'mumbai@testlogistics.com',
    contact_phone: '+91-9876543211',
    manager_name: 'Test Manager Mumbai',
    manager_phone: '+91-9876543212',
    is_active: true
  },
  
  delhi_branch: {
    name: 'Delhi Branch', 
    code: 'DEL001',
    address: 'Sector 15, Gurgaon, Delhi NCR',
    contact_email: 'delhi@testlogistics.com',
    contact_phone: '+91-9876543213',
    manager_name: 'Test Manager Delhi',
    manager_phone: '+91-9876543214',
    is_active: true
  },
  
  bangalore_branch: {
    name: 'Bangalore Branch',
    code: 'BLR001', 
    address: 'Electronic City, Bangalore',
    contact_email: 'bangalore@testlogistics.com',
    contact_phone: '+91-9876543215',
    manager_name: 'Test Manager Bangalore',
    manager_phone: '+91-9876543216',
    is_active: true
  }
};

export const testUsers = {
  superadmin: {
    email: 'superadmin@testlogistics.com',
    password: 'SuperAdmin@123',
    role: 'superadmin' as const,
    first_name: 'Super',
    last_name: 'Admin',
    phone: '+91-9876543217',
    is_active: true,
    email_verified: true
  },
  
  admin: {
    email: 'admin@testlogistics.com',
    password: 'Admin@123',
    role: 'admin' as const,
    first_name: 'Branch',
    last_name: 'Admin',
    phone: '+91-9876543218',
    is_active: true,
    email_verified: true
  },
  
  operator: {
    email: 'operator@testlogistics.com',
    password: 'Operator@123',
    role: 'operator' as const,
    first_name: 'Branch',
    last_name: 'Operator',
    phone: '+91-9876543219',
    is_active: true,
    email_verified: true
  }
};

export const testCustomers = {
  individual: {
    name: 'John Doe',
    mobile: '+91-9876543220',
    email: 'john.doe@example.com',
    address: '789 Customer Street, Customer City',
    customer_type: 'individual' as const,
    gst_number: '',
    credit_limit: 50000,
    credit_days: 30,
    is_active: true
  },
  
  business: {
    name: 'ABC Electronics Pvt Ltd',
    mobile: '+91-9876543221',
    email: 'sales@abcelectronics.com',
    address: '101 Business Complex, Electronics Hub',
    customer_type: 'business' as const,
    gst_number: 'CUST123456789',
    credit_limit: 200000,
    credit_days: 45,
    is_active: true
  },
  
  regular_customer: {
    name: 'Regular Customer Ltd',
    mobile: '+91-9876543222',
    email: 'orders@regularcustomer.com',
    address: '202 Regular Street, Business District',
    customer_type: 'business' as const,
    gst_number: 'CUST987654321',
    credit_limit: 100000,
    credit_days: 30,
    is_active: true
  }
};

export const testVehicles = {
  truck_small: {
    vehicle_number: 'MH-01-AB-1234',
    vehicle_type: 'truck' as const,
    capacity_kg: 3000,
    driver_name: 'Test Driver 1',
    driver_phone: '+91-9876543223',
    driver_license: 'DL123456789',
    insurance_number: 'INS123456789',
    insurance_expiry: '2025-12-31',
    fitness_expiry: '2025-06-30',
    is_active: true
  },
  
  truck_medium: {
    vehicle_number: 'MH-02-CD-5678',
    vehicle_type: 'truck' as const,
    capacity_kg: 7000,
    driver_name: 'Test Driver 2',
    driver_phone: '+91-9876543224',
    driver_license: 'DL987654321',
    insurance_number: 'INS987654321',
    insurance_expiry: '2025-12-31',
    fitness_expiry: '2025-06-30',
    is_active: true
  },
  
  truck_large: {
    vehicle_number: 'MH-03-EF-9012',
    vehicle_type: 'truck' as const,
    capacity_kg: 15000,
    driver_name: 'Test Driver 3',
    driver_phone: '+91-9876543225',
    driver_license: 'DL456789012',
    insurance_number: 'INS456789012',
    insurance_expiry: '2025-12-31',
    fitness_expiry: '2025-06-30',
    is_active: true
  }
};

export const testArticles = {
  electronics: {
    name: 'Laptop Computer',
    description: 'Dell Inspiron 15 Laptop',
    weight_kg: 2.5,
    dimensions: { length: 35, width: 25, height: 2 },
    value: 50000,
    category: 'electronics',
    fragile: true,
    hazardous: false
  },
  
  furniture: {
    name: 'Office Chair',
    description: 'Ergonomic Office Chair with Arms',
    weight_kg: 15,
    dimensions: { length: 60, width: 60, height: 120 },
    value: 8000,
    category: 'furniture',
    fragile: false,
    hazardous: false
  },
  
  documents: {
    name: 'Legal Documents',
    description: 'Confidential Legal Documents in Sealed Envelope',
    weight_kg: 0.5,
    dimensions: { length: 30, width: 20, height: 5 },
    value: 0,
    category: 'documents',
    fragile: false,
    hazardous: false
  }
};

export const testBookings = {
  standard_booking: {
    from_location: 'Mumbai',
    to_location: 'Delhi',
    pickup_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    delivery_type: 'standard' as const,
    payment_mode: 'cash' as const,
    booking_notes: 'Handle with care - test booking',
    total_amount: 1500,
    articles: [
      {
        name: 'Test Electronics',
        quantity: 1,
        weight_kg: 5,
        dimensions: { length: 30, width: 20, height: 10 },
        freight_amount: 1500,
        rate_type: 'per_kg' as const,
        rate_value: 300
      }
    ]
  },
  
  express_booking: {
    from_location: 'Delhi',
    to_location: 'Bangalore',
    pickup_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
    delivery_type: 'express' as const,
    payment_mode: 'credit' as const,
    booking_notes: 'Urgent delivery required',
    total_amount: 2500,
    articles: [
      {
        name: 'Urgent Documents',
        quantity: 1,
        weight_kg: 1,
        dimensions: { length: 25, width: 15, height: 5 },
        freight_amount: 2500,
        rate_type: 'fixed' as const,
        rate_value: 2500
      }
    ]
  },
  
  bulk_booking: {
    from_location: 'Mumbai',
    to_location: 'Bangalore',
    pickup_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days
    delivery_type: 'standard' as const,
    payment_mode: 'bank_transfer' as const,
    booking_notes: 'Multiple items - bulk shipment',
    total_amount: 4500,
    articles: [
      {
        name: 'Bulk Item 1',
        quantity: 10,
        weight_kg: 50,
        dimensions: { length: 100, width: 50, height: 30 },
        freight_amount: 2000,
        rate_type: 'per_kg' as const,
        rate_value: 40
      },
      {
        name: 'Bulk Item 2',
        quantity: 5,
        weight_kg: 25,
        dimensions: { length: 80, width: 40, height: 25 },
        freight_amount: 1500,
        rate_type: 'per_kg' as const,
        rate_value: 60
      },
      {
        name: 'Bulk Item 3',
        quantity: 2,
        weight_kg: 20,
        dimensions: { length: 60, width: 30, height: 20 },
        freight_amount: 1000,
        rate_type: 'per_kg' as const,
        rate_value: 50
      }
    ]
  }
};

export const testRates = {
  mumbai_delhi: {
    from_location: 'Mumbai',
    to_location: 'Delhi',
    vehicle_type: 'truck',
    rate_per_kg: 50,
    minimum_charge: 500,
    express_multiplier: 1.5,
    fuel_surcharge: 10,
    is_active: true
  },
  
  delhi_bangalore: {
    from_location: 'Delhi',
    to_location: 'Bangalore',
    vehicle_type: 'truck',
    rate_per_kg: 45,
    minimum_charge: 600,
    express_multiplier: 1.8,
    fuel_surcharge: 15,
    is_active: true
  },
  
  mumbai_bangalore: {
    from_location: 'Mumbai',
    to_location: 'Bangalore',
    vehicle_type: 'truck',
    rate_per_kg: 40,
    minimum_charge: 800,
    express_multiplier: 1.6,
    fuel_surcharge: 12,
    is_active: true
  }
};

// Helper function to get test data by category
export const getTestData = {
  organization: (key: keyof typeof testOrganizations) => testOrganizations[key],
  branch: (key: keyof typeof testBranches) => testBranches[key],
  user: (key: keyof typeof testUsers) => testUsers[key],
  customer: (key: keyof typeof testCustomers) => testCustomers[key],
  vehicle: (key: keyof typeof testVehicles) => testVehicles[key],
  article: (key: keyof typeof testArticles) => testArticles[key],
  booking: (key: keyof typeof testBookings) => testBookings[key],
  rate: (key: keyof typeof testRates) => testRates[key]
};

export default {
  testOrganizations,
  testBranches,
  testUsers,
  testCustomers,
  testVehicles,
  testArticles,
  testBookings,
  testRates,
  getTestData
};