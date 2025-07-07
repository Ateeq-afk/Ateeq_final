// GST Number validation
export const validateGSTNumber = (gst: string): boolean => {
  if (!gst) return true; // GST is optional
  
  // GST format: 2 digits (state code) + 10 characters (PAN) + 1 digit (entity type) + 1 character (Z) + 1 check digit
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.toUpperCase());
};

// E-way Bill validation
export const validateEwayBill = (ewayBill: string): boolean => {
  if (!ewayBill) return true; // E-way bill is optional
  
  // E-way bill is a 12-digit number
  const ewayBillRegex = /^[0-9]{12}$/;
  return ewayBillRegex.test(ewayBill);
};

// Mobile number validation
export const validateMobileNumber = (mobile: string): boolean => {
  if (!mobile) return false;
  
  // Indian mobile number: starts with 6-9 and has 10 digits
  const mobileRegex = /^[6-9][0-9]{9}$/;
  return mobileRegex.test(mobile);
};

// Email validation
export const validateEmail = (email: string): boolean => {
  if (!email) return true; // Email is optional
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Pincode validation
export const validatePincode = (pincode: string): boolean => {
  if (!pincode) return true; // Pincode is optional
  
  // Indian pincode is 6 digits
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

// Get validation error messages
export const getValidationError = (field: string, value: string): string | null => {
  switch (field) {
    case 'gst':
      return !validateGSTNumber(value) ? 'Invalid GST number format (e.g., 22AAAAA0000A1Z5)' : null;
    case 'eway_bill':
      return !validateEwayBill(value) ? 'E-way bill must be a 12-digit number' : null;
    case 'mobile':
      return !validateMobileNumber(value) ? 'Invalid mobile number (10 digits starting with 6-9)' : null;
    case 'email':
      return !validateEmail(value) ? 'Invalid email address' : null;
    case 'pincode':
      return !validatePincode(value) ? 'Invalid pincode (6 digits)' : null;
    default:
      return null;
  }
};