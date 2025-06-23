# DesiCargo Prototype

This project contains a React front-end and a small Express backend used for demonstration purposes. The backend supports username based login with hierarchical organization, branch, and user IDs.

## Running the API server

```bash
npm run start:server
```

The server listens on `http://localhost:3000` and exposes the following endpoints:

- `POST /api/signup` – create a user within a branch. The username must be unique within the organization.
- `POST /api/login` – login using organization ID, username and password. Returns a JWT.
- `GET /api/bookings` – list bookings scoped to the authenticated user.
- `POST /api/bookings` – create a booking scoped to the authenticated user.

The data is stored in memory for now, so restarting the server will clear all users and bookings.

## Front-end

The React front-end (inside `src/`) was generated with Vite and uses Supabase for authentication. Run the front-end with `npm run dev` and use the `/signup` and `/signin` pages to create an account in Supabase and log in. The Express server remains as a small example of username based APIs but is not required for Supabase auth.
