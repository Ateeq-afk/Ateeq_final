# Article Tracking System Documentation

## Overview
The Article Tracking System provides real-time visibility of all parcels/articles throughout their journey from unloading at the warehouse to final delivery. This ensures complete transparency and accountability for every item in the logistics chain.

## Key Features

### 1. Automatic Warehouse Entry
When an OGPL (Outward General Parcel List) is unloaded:
- Each article is automatically registered in the warehouse inventory
- Articles are assigned to the RECEIVING area by default
- A unique barcode is generated for each article (format: `LR_NUMBER-ARTICLE_ID`)
- Initial tracking record is created with warehouse location

### 2. Location Tracking
Articles can be in one of these locations:
- **Warehouse Locations**:
  - RECEIVING - Initial unloading area
  - STORAGE-A/B - Main storage areas
  - DISPATCH - Ready for delivery area
- **Vehicle** - Out for delivery
- **Delivered** - Successfully delivered to customer

### 3. Scan History
Every movement is recorded with:
- Timestamp of the scan
- User who performed the scan
- Location details (warehouse/vehicle)
- Scan type (check_in, transfer, check_out, delivery)
- Optional notes and condition assessment

## Database Schema

### Core Tables

1. **article_tracking**
   - Links booking articles to their current location
   - Tracks status (active/completed)
   - Maintains chain of custody information

2. **article_scan_history**
   - Complete audit trail of all scans
   - Includes GPS coordinates for mobile scans
   - Supports photo attachments for condition documentation

3. **article_current_locations** (View)
   - Consolidated view of all article locations
   - Joins booking, customer, and location data
   - Used for quick lookups and reporting

## User Interface

### 1. Warehouse Management Page
Navigate to: **Warehouse Management > [Select Warehouse] > Article Tracking**

Features:
- Search articles by barcode/QR code
- View articles grouped by location
- See article details and scan history
- Real-time updates (30-second refresh)

### 2. Article Tracking Dashboard
Navigate to: **Operations > Article Tracking**

Features:
- Organization-wide article visibility
- Statistics (total, in warehouse, in transit, delivered)
- Search across all articles
- Filter by warehouse and status
- Distribution charts by location

## API Endpoints

### 1. Get Current Locations
```
GET /api/article-tracking/current-locations
Query params: booking_id, lr_number, status, warehouse_id
```

### 2. Get Article History
```
GET /api/article-tracking/history/:booking_article_id
```

### 3. Scan Article
```
POST /api/article-tracking/scan
Body: {
  booking_article_id,
  scan_type,
  warehouse_location_id,
  notes,
  condition_at_scan
}
```

### 4. Get Warehouse Articles
```
GET /api/article-tracking/warehouse/:warehouse_id
Query params: location_id, status
```

### 5. Search by Barcode
```
GET /api/article-tracking/search/:code
```

## Workflow

### 1. Unloading Process
1. OGPL marked as "unloaded"
2. Database trigger creates inventory records
3. Articles placed in RECEIVING area
4. Initial scan recorded automatically

### 2. Warehouse Operations
1. Staff can transfer articles between locations
2. Each transfer creates a scan record
3. Articles move through: RECEIVING → STORAGE → DISPATCH

### 3. Delivery Process
1. Articles scanned out to vehicle
2. Location type changes to "vehicle"
3. Upon delivery, final scan marks as "delivered"
4. Tracking record completed

## Security

- Row Level Security (RLS) ensures branch/organization data isolation
- Users can only see articles in their organization
- Scan history maintains complete audit trail
- All actions tracked with user identification

## Benefits

1. **Real-time Visibility**: Know exactly where each parcel is at any moment
2. **Accountability**: Complete audit trail of who handled what and when
3. **Efficiency**: Quick search and location identification
4. **Customer Service**: Accurate information for customer queries
5. **Loss Prevention**: Identify where items go missing
6. **Performance Metrics**: Track warehouse and delivery efficiency

## Future Enhancements

1. **Mobile App Integration**: Scan articles using mobile devices
2. **Customer Notifications**: SMS/Email updates on article status
3. **Predictive Analytics**: Estimate delivery times based on historical data
4. **Integration with IoT**: Temperature/humidity sensors for sensitive cargo
5. **Automated Sorting**: Integration with conveyor systems