# DesiCargo Prototype

This project contains a React front-end and a small Express backend used for demonstration purposes. The backend supports username based login with hierarchical organization, branch, and user IDs.

For a review of logistics-related tables and how the new columns are used, see [docs/table_audit.md](docs/table_audit.md).

## Running the API server

```bash
npm run start:server
```

The server listens on `http://localhost:3000` and exposes the following endpoints:

- `POST /api/signup` – create a user within a branch. The username must be unique within the organization.
- `POST /api/login` – login using organization ID, username and password. Returns a JWT.
- `GET /api/organizations` – list organizations.
- `POST /api/organizations` – create a new organization.
- `GET /api/branches` – list branches, optionally filtered by organization.
- `POST /api/branches` – create a new branch under an organization.
- `GET /api/bookings` – list bookings scoped to the authenticated user.
- `POST /api/bookings` – create a booking scoped to the authenticated user.

The data is stored in memory for now, so restarting the server will clear all users and bookings.

### Default Super Admin

A super admin account is created automatically when the server starts:

- **Email/Username:** `tabateeq@gmail.com`
- **Password:** `superadmin`

This user is not restricted to a single organization or branch and can access all data.

**Note**: SMS notification support has been removed. The application no longer sends
text messages when actions occur.

## Front-end

The React front-end (inside `src/`) was generated with Vite and now uses the Express API for authentication. Run the front-end with `npm run dev` and use the `/signup` and `/signin` pages to create accounts and log in. You can also create new organizations via `/new-organization`.
