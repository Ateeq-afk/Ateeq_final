# DesiCargo Prototype

This project contains a React front-end and a small Express backend used for demonstration purposes. The backend supports username based login with hierarchical organization, branch, and user IDs.

For a review of logistics-related tables and how the new columns are used, see [docs/table_audit.md](docs/table_audit.md).

## Running the API server

```bash
npm run start:server
```

The server listens on `http://localhost:3000` and exposes the following endpoints:

- `POST /api/signup` – create a user account. Accounts are provisioned by a DesiCargo Account Manager and the username must be unique within the organization.
- `POST /api/login` – login using organization ID, username and password. Returns a JWT.
- `GET /api/organizations` – list organizations.
- `POST /api/organizations` – create a new organization.
- `GET /api/branches` – list branches, optionally filtered by organization.
- `POST /api/branches` – create a new branch under an organization.
- `GET /api/bookings` – list bookings scoped to the authenticated user.
- `POST /api/bookings` – create a booking scoped to the authenticated user.
- `POST /edge/lr-number` – generate a unique LR number for a branch.
- `POST /edge/ogpl` – create an OGPL and mark included bookings as in transit.
- `POST /edge/unload-ogpl` – complete unloading for an OGPL.
- `POST /edge/submit-pod` – mark a booking as delivered.
- `GET /edge/reports/bookings` – return a simple booking status summary.
- `POST /edge/invite-user` – create a Supabase user invitation.

These `/edge/*` routes act as lightweight equivalents of Supabase Edge
functions, allowing the demo to handle complex logic such as LR number
generation or transactional OGPL updates without a full database setup.

The data is stored in memory for now, so restarting the server will clear all users and bookings.

### Default Super Admin

A super admin account is created automatically when the server starts:

- **Email/Username:** `tabateeq@gmail.com`
- **Password:** `superadmin`

This user is not restricted to a single organization or branch and can access all data.

### Roles

The system supports multiple user roles:

- **superadmin** – unrestricted access across all organizations and branches.
- **admin** – manages all branches within a single organization.
- **operator** – limited to a single branch.

**Note**: SMS notification support has been removed. The application no longer sends
text messages when actions occur.

## Front-end

The React front-end (inside `src/`) was generated with Vite and now uses the Express API for authentication. Run the front-end with `npm run dev` and use the `/signin` page to log in. User accounts are provisioned by a DesiCargo Account Manager. You can also create new organizations via `/new-organization`.


## Seeding Supabase Data

For development you can populate Supabase with some sample data using:

```bash
npm run seed:supabase
```

The script expects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables (you can place them in a `.env` file). It will create an organization, a couple of branches, example users, customers, articles and vehicles.
=======
## Backend

A new Express backend is located in `backend/`. It uses Supabase as the database and verifies Supabase issued JWTs. To run it:

```bash
cd backend && npm install
npm run dev
```

Environment variables are defined in `backend/.env.example`.

## Warehouse & Inventory Management

Additional endpoints provide a lightweight way to track cargo inside warehouses.
See [docs/warehouse_inventory.md](docs/warehouse_inventory.md) for details.

## Invite User Edge Function

The `invite-user` function creates a pending user in Supabase and sends the
invite email. Deploy it with the Supabase CLI:

```bash
supabase functions deploy invite-user
```

The following environment variables must be available when running the
function:

- `SUPABASE_URL` – your project URL
- `SUPABASE_SERVICE_ROLE_KEY` – service role key used to create the user
- `SMTP_HOST` – SMTP server host
- `SMTP_PORT` – SMTP server port
- `SMTP_USER` – SMTP username
- `SMTP_PASS` – SMTP password
- `EMAIL_REDIRECT_TO` – (optional) URL the user is sent to after accepting the invite

Configure these values in your Supabase project or in `supabase/.env` before
deploying.

