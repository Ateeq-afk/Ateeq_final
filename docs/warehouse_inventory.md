# Warehouse & Inventory Management

This module stores warehouses, their storage locations and basic inventory counts in memory.

## API Endpoints

- `GET /api/warehouses` – list warehouses.
- `POST /api/warehouses` – create a warehouse with a name.
- `GET /api/locations` – list storage locations.
- `POST /api/locations` – create a location under a warehouse by id.
- `POST /api/inbound` – register received cargo with `locationId`, `itemId` and `quantity`.
- `POST /api/outbound` – register shipped cargo with the same fields, reducing inventory.
- `GET /api/inventory?locationId=1&itemId=ITEM1` – get current quantity for an item in a location.

Inventory levels are maintained in memory by `server/warehouseService.cjs` and reset when the server restarts.
