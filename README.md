# desi-cargo-mud

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/Ateeq-afk/desi-cargo-mud)

## Login Setup

1. Create a `.env` file with your Supabase credentials:

```bash
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

2. Apply the database migrations to add the `client_name` column:

```bash
supabase migration apply
# or execute the SQL in `supabase/migrations/20250613000000_add_client_name_to_users.sql`
```

3. Start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:5173/login` to sign in with your Supabase credentials. The form asks for a client name along with email and password.
