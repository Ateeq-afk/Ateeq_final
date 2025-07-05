# Proof of Delivery (POD) System

## Overview

The POD system ensures that all deliveries are properly documented before a booking can be marked as delivered. This provides accountability, reduces disputes, and creates a digital trail of all deliveries.

## Features

### 1. Mandatory POD Process
- **Enforced Workflow**: Bookings cannot be marked as delivered without completing the POD process
- **Status Tracking**: Separate tracking of delivery status and POD status
- **Database Triggers**: Automatic status updates when POD is completed

### 2. Comprehensive POD Capture
The POD process captures:
- **Receiver Details**
  - Name and phone number (mandatory)
  - Designation and company (optional)
  - Identity verification (optional)
  - Receiver photo (optional)

- **Delivery Information**
  - Date and time of delivery
  - GPS location (when available)
  - Delivery condition (good/damaged/partial)
  - Damage/shortage descriptions when applicable

- **Evidence Collection**
  - Digital signature (mandatory)
  - Photo evidence of delivered goods (optional but recommended)
  - Additional remarks

### 3. Multi-Step POD Form
The POD form guides users through 6 steps:
1. **Receiver Details** - Basic receiver information
2. **Verification** - Optional ID verification
3. **Condition** - Delivery condition assessment
4. **Signature** - Digital signature capture
5. **Photo** - Photo evidence upload
6. **Complete** - Review and confirm

### 4. Database Schema

#### pod_records table
```sql
- id (UUID, primary key)
- booking_id (UUID, references bookings)
- branch_id (UUID, references branches)
- delivered_at (timestamp)
- delivered_by (text)
- delivery_latitude/longitude (decimal)
- receiver_name/phone (text)
- receiver_designation/company (text)
- receiver_id_type/number (text)
- signature_image_url (text)
- photo_evidence_url (text)
- receiver_photo_url (text)
- delivery_condition (enum: good/damaged/partial)
- damage_description (text)
- shortage_description (text)
- remarks (text)
```

#### pod_attempts table
Tracks failed delivery attempts with reasons and next attempt dates.

#### pod_templates table
Stores customizable delivery instructions and requirements by branch.

### 5. API Endpoints

#### POD Management
- `GET /pod` - Get all POD records
- `GET /pod/booking/:bookingId` - Get POD for specific booking
- `POST /pod` - Create new POD record
- `PUT /pod/:id` - Update POD record

#### Delivery Attempts
- `POST /pod/attempts` - Record failed delivery attempt
- `GET /pod/attempts/:bookingId` - Get all attempts for a booking

#### Templates & Stats
- `GET /pod/templates` - Get POD templates
- `POST /pod/templates` - Create POD template
- `GET /pod/stats` - Get POD statistics

### 6. Frontend Integration

#### Booking Details Page
- Shows POD status badge for delivered bookings
- "Complete Delivery with POD" button for out-for-delivery bookings
- POD document in documents tab when completed

#### POD Form Component
- Modal form with progress tracking
- Touch-enabled signature canvas
- Photo upload with preview
- Form validation at each step
- Responsive design for mobile devices

### 7. Security Features

- **Row Level Security (RLS)**: Users can only access PODs for their branch
- **Role-based Access**: Different permissions for operators, admins, and superadmins
- **Audit Trail**: All POD submissions logged in logistics_events table
- **Data Validation**: Backend validation using Zod schemas

## Usage Flow

1. **Delivery Personnel** arrives at destination with goods
2. Clicks "Complete Delivery with POD" in the booking details
3. Fills receiver information (pre-populated if available)
4. Optional: Captures receiver ID and photo for verification
5. Selects delivery condition and provides details if issues
6. Captures receiver's digital signature
7. Optional: Takes photo of delivered goods
8. Reviews and confirms delivery
9. System automatically:
   - Creates POD record
   - Updates booking status to "delivered"
   - Sets pod_status to "completed"
   - Logs event in logistics_events

## Error Handling

- **POD Required Check**: Backend prevents status update to "delivered" without POD
- **Validation Errors**: Clear error messages at each form step
- **Network Failures**: Proper error handling with retry options
- **Missing Data**: Graceful handling of missing receiver information

## Benefits

1. **Legal Compliance**: Digital proof for dispute resolution
2. **Accountability**: Clear record of who received goods and when
3. **Quality Control**: Track delivery conditions and issues
4. **Analytics**: POD completion rates and delivery performance metrics
5. **Customer Satisfaction**: Professional delivery process with documentation

## Future Enhancements

1. **SMS/Email Notifications**: Send POD receipt to customers
2. **Bulk POD Processing**: Handle multiple deliveries at once
3. **Offline Support**: Queue PODs for sync when connection restored
4. **Advanced Analytics**: Delivery performance dashboards
5. **Integration**: Connect with customer portals for real-time updates