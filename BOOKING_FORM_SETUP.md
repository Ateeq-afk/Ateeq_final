# Enhanced Booking Form Setup Guide

## 🎯 Overview
The booking form has been enhanced with automatic loading/unloading charge calculation, improved UI/UX, and full backend integration.

## 🚀 What's New

### ✅ Automatic Fare Calculation
- **Loading charges**: Auto-calculated based on quantity (₹15-25 per item)
- **Unloading charges**: Auto-calculated based on quantity (₹10-20 per item)  
- **Smart rates**: Higher rates for special handling items
- **User override**: Manual adjustment still possible

### ✅ Enhanced UI/UX
- **Visual indicators**: "Auto-calculated" badges
- **Real-time feedback**: Customer and article details display
- **Progress tracking**: Step-by-step validation
- **Mobile responsive**: Better mobile experience

### ✅ Backend Integration
- **Updated schema**: All form fields supported in database
- **Auto-calculation**: Server-side total calculation
- **Validation**: Enhanced server-side validation
- **API integration**: Proper axios instance configured

## 🛠 Setup Instructions

### 1. Database Migration
The enhanced booking form requires database schema updates. Run the migration:

```bash
# Option 1: Use the migration script
node scripts/run-migrations.js

# Option 2: Manual SQL execution (if script fails)
# Copy and run the SQL from backend/migrations/007_booking_form_enhancements.sql
# in your Supabase SQL editor
```

### 2. Backend Server
The form connects to the Express.js backend. Start it:

```bash
# Start the backend server
cd backend && npm run dev

# Or if using the root package.json
npm run start:backend
```

### 3. Frontend Development
Start the frontend development server:

```bash
npm run dev
```

## 🔧 API Configuration

The booking form connects to the backend at `http://localhost:4000`. The axios instance is configured with:

- **Base URL**: `http://localhost:4000`
- **Authentication**: JWT token from localStorage
- **Error handling**: Auto-redirect on 401 unauthorized

## 📊 Form Features

### Step 1: Basic Information
- Branch selection
- LR type (system/manual)
- Route (from/to branches)
- Customer selection (sender/receiver)

### Step 2: Shipment Details
- Article selection with details display
- Quantity with auto-calculation trigger
- Weight and packaging information
- Special handling options

### Step 3: Payment & Review
- Payment type selection
- **Auto-calculated charges**:
  - Loading charges: ₹15-25 per quantity
  - Unloading charges: ₹10-20 per quantity
- Insurance and additional charges
- Invoice information
- Total calculation

## 🧮 Auto-Calculation Logic

```javascript
// Base rates
const baseLoadingCharge = article.requires_special_handling ? 25 : 15;
const baseUnloadingCharge = article.requires_special_handling ? 20 : 10;

// Calculation
const loadingCharges = baseLoadingCharge * quantity;
const unloadingCharges = baseUnloadingCharge * quantity;

// Total
const total = (quantity * freightRate) + loadingCharges + unloadingCharges + insurance + packaging;
```

## 🔄 Data Flow

1. **Form Submission**: Frontend validates and submits to `/api/bookings`
2. **Backend Processing**: Server validates with Zod schema
3. **Auto-calculation**: Server calculates total amount
4. **Database Insert**: Booking saved with all fields
5. **Response**: Frontend shows success confirmation

## 🐛 Troubleshooting

### Migration Issues
If migration fails:
1. Check Supabase service role key in `.env`
2. Run SQL manually in Supabase SQL editor
3. Verify database permissions

### API Connection Issues
If booking creation fails:
1. Ensure backend server is running on port 4000
2. Check JWT token in localStorage
3. Verify CORS settings in backend

### Form Validation Issues
If validation fails:
1. Check all required fields are filled
2. Verify customer and article selections
3. Ensure quantity is greater than 0

## 📝 Key Files Modified

- `src/components/bookings/NewBookingForm.tsx` - Enhanced form component
- `backend/src/schemas.ts` - Updated validation schema
- `backend/src/routes/bookings.ts` - Enhanced booking routes
- `backend/migrations/007_booking_form_enhancements.sql` - Database migration
- `src/services/api.ts` - Axios instance configuration

## 🎉 Testing

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Navigate to booking form
4. Fill in details and observe auto-calculation
5. Submit and verify in database

The enhanced booking form is now ready for production use with full backend integration and automatic fare calculation!