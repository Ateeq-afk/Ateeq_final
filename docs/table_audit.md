# Table Usage Review

This document summarises how the newer database columns and tables are used within the code base.

## Bookings table
`pod_data` is attached to each booking when an unloading session completes:
```ts
                unloading_session_id: sessionData.id,
                pod_status: 'pending',
                pod_data: {
                  condition: condition.status,
                  remarks: condition.remarks,
                  photo: condition.photo,
                  unloaded_at: new Date().toISOString()
                }
              }
            );
          } else {
            // For missing items, update status but don't mark as delivered
            await updateBookingStatus(
              bookingId, 
              'in_transit', 
              { 
                unloading_status: 'missing',
                unloading_session_id: sessionData.id,
                pod_data: {
                  condition: 'missing',
                  remarks: condition?.remarks,
                  unloaded_at: new Date().toISOString()
                }
```
`cancellation_reason` is present in the schema but not yet referenced in components. `loading_session_id`, `unloading_session_id` and `pod_record_id` are written during logistics flows.

## Articles table
Additional columns are part of the article form and import tools. Snippet from `ArticleForm.tsx`:
```tsx
        {/* HSN Code */}
        <div>
          <Label htmlFor="hsn_code">HSN Code</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="hsn_code"
              {...register('hsn_code')}
              placeholder="Optional"
              className="pl-10"
            />
          </div>
        </div>

        {/* Tax Rate */}
        <div>
          <Label htmlFor="tax_rate">Tax Rate %</Label>
          <div className="relative">
```

## Customers table
Fields such as `address`, `city`, `state`, `pincode`, `credit_limit`, `email` and `payment_terms` are handled in customer settings and import/export utilities.

## Vehicles table
The list view displays maintenance dates:
```tsx
                        {vehicle.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>Last: {vehicle.last_maintenance_date ? new Date(vehicle.last_maintenance_date).toLocaleDateString() : 'N/A'}</div>
                      <div className={`${
                        vehicle.next_maintenance_date && new Date(vehicle.next_maintenance_date) <= new Date()
                          ? 'text-red-600 font-medium'
                          : 'text-gray-500'
                      }`}>
                        Next: {vehicle.next_maintenance_date ? new Date(vehicle.next_maintenance_date).toLocaleDateString() : 'Not scheduled'}
```

## OGPL table
OGPL fields are fetched when loading or unloading sessions are created, linking vehicles and bookings.

## loading_records and unloading_records
`unloading_records` remains only for backwards compatibility. New logic relies on `unloading_sessions`.

## loading_sessions and unloading_sessions
Sessions are created and associated with bookings. Event logging is performed via the trigger shown below.
```sql
  -- Determine entity type based on table
  IF TG_TABLE_NAME = 'bookings' THEN
    entity_type := 'booking';
  ELSIF TG_TABLE_NAME = 'loading_sessions' THEN
    entity_type := 'loading';
  ELSIF TG_TABLE_NAME = 'unloading_sessions' THEN
    entity_type := 'unloading';
  ELSIF TG_TABLE_NAME = 'pod_records' THEN
    entity_type := 'pod';
  ELSE
    entity_type := TG_TABLE_NAME;
  END IF;
  
  -- Determine event type based on operation
  IF TG_OP = 'INSERT' THEN
    event_type := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    event_type := 'updated';
  ELSIF TG_OP = 'DELETE' THEN
    event_type := 'deleted';
  END IF;
  
  -- Get branch ID if available
  IF TG_TABLE_NAME = 'bookings' THEN
    branch_id := NEW.branch_id;
  ELSIF TG_TABLE_NAME = 'loading_sessions' THEN
    branch_id := NEW.from_branch_id;
  ELSIF TG_TABLE_NAME = 'unloading_sessions' THEN
    branch_id := NEW.branch_id;
  END IF;
  
  -- Insert the event
  INSERT INTO public.logistics_events (
    event_type,
    entity_type,
    entity_id,
    branch_id,
    details
  ) VALUES (
    event_type,
    entity_type,
    NEW.id,
    branch_id,
    jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create event logging triggers
CREATE TRIGGER log_booking_events
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION log_logistics_event();

CREATE TRIGGER log_loading_session_events
AFTER INSERT OR UPDATE ON public.loading_sessions
FOR EACH ROW
EXECUTE FUNCTION log_logistics_event();

CREATE TRIGGER log_unloading_session_events
AFTER INSERT OR UPDATE ON public.unloading_sessions
FOR EACH ROW
EXECUTE FUNCTION log_logistics_event();

CREATE TRIGGER log_pod_record_events
AFTER INSERT OR UPDATE ON public.pod_records
FOR EACH ROW
EXECUTE FUNCTION log_logistics_event();```

## pod_records
`signature_image_url` and `photo_evidence_url` are stored when PODs are submitted in `usePOD.ts`.

## logistics_events
The `log_logistics_event` trigger captures changes on `bookings`, `loading_sessions`, `unloading_sessions` and `pod_records`.
