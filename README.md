# Lemlist Client Portal

A SaaS client portal for Lemlist users that provides a dashboard to view campaign data and analytics via the Lemlist API.

## Features

### Client Features
- 🔐 **Email/Password Authentication** via Supabase Auth
- 🔑 **API Key Management** with connection testing
- 📊 **Campaign Dashboard** with summary statistics
- 📧 **Campaign Details** with leads and sequence overview
- ⚙️ **Settings** to update or revoke API keys
- 🎨 **Clean B2B SaaS UI** with Tailwind CSS and shadcn/ui

### Admin Portal Features
- 📈 **Admin Dashboard** - Overview stats (total users, active users, new signups)
- 👥 **User Management** - View all users, their API key status, activity count
- 📋 **Activity Logs** - Track user actions (login, API key changes, etc.)
- 🗑️ **Delete Users** - Remove users from the platform
- 🔒 **Admin-Only Access** - Protected routes for admin users

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth & Database**: Supabase
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Language**: TypeScript

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd my-app
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from the project settings
3. Get the service role key (keep this secret!)
4. Run the database migrations in Supabase SQL Editor:
   - `supabase/migrations/001_create_profiles.sql`
   - `supabase/migrations/002_add_admin_and_logs.sql`

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Make Yourself an Admin

After signing up, run this SQL in Supabase to make yourself an admin:

```sql
UPDATE profiles SET is_admin = TRUE WHERE id = 'your-user-uuid';
```

Or check your user UUID in the Auth → Users section of Supabase.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
my-app/
├── app/
│   ├── api/
│   │   ├── activity/                 # Log user activity
│   │   ├── admin/
│   │   │   ├── activity/route.ts     # Get activity logs
│   │   │   ├── stats/route.ts        # Get admin stats
│   │   │   └── users/route.ts        # Manage users
│   │   ├── lemlist/
│   │   │   ├── campaigns/
│   │   │   │   ├── route.ts          # List all campaigns
│   │   │   │   └── [id]/route.ts     # Campaign details
│   │   │   └── test/route.ts         # Test API key
│   │   └── user/api-key/route.ts     # Manage user's API key
│   ├── admin/                        # ADMIN PORTAL
│   │   ├── layout.tsx                # Admin layout with sidebar
│   │   ├── page.tsx                  # Admin dashboard
│   │   ├── users/page.tsx            # Users management
│   │   └── activity/page.tsx         # Activity logs
│   ├── auth/
│   │   ├── login/page.tsx            # Login form
│   │   ├── signup/page.tsx           # Signup form
│   │   └── callback/page.tsx         # OAuth callback
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx        # Main dashboard
│   │   ├── campaigns/
│   │   │   ├── page.tsx              # Campaigns list
│   │   │   └── [id]/page.tsx         # Campaign detail
│   │   ├── settings/page.tsx         # API key settings
│   │   └── layout.tsx                # Dashboard layout
│   ├── onboarding/page.tsx           # API key setup
│   └── page.tsx                      # Root redirect
├── components/
│   ├── navigation.tsx                # Top nav bar with admin link
│   └── ui/                           # shadcn/ui components
├── lib/
│   ├── admin.ts                      # Admin helper functions
│   ├── lemlist.ts                    # Lemlist API client
│   ├── supabase-client.ts            # Browser Supabase client
│   └── supabase-server.ts            # Server Supabase client
├── supabase/migrations/
│   ├── 001_create_profiles.sql       # Database schema
│   └── 002_add_admin_and_logs.sql    # Admin & activity logs
├── middleware.ts                     # Auth protection
└── README.md                         # Documentation
```

## Database Schema

### profiles table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | FK to auth.users |
| lemlist_api_key | TEXT | User's Lemlist API key |
| is_admin | BOOLEAN | Whether user is an admin |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### activity_logs table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users |
| action | TEXT | Action performed |
| details | JSONB | Additional details |
| created_at | TIMESTAMP | When action occurred |

## Admin Portal Access

Once you've made yourself an admin:

1. **Admin Dashboard** (`/admin`):
   - Total users count
   - Active users (with API key configured)
   - New signups today
   - Quick links to manage users

2. **Users Page** (`/admin/users`):
   - View all registered users
   - Search by email
   - See API key status (Connected/No API Key)
   - See activity count
   - Delete users

3. **Activity Logs** (`/admin/activity`):
   - Last 100 user actions
   - Filter by action type
   - See user email and timestamp

## API Routes

### Client API

- `GET /api/lemlist/campaigns` - List all campaigns
- `GET /api/lemlist/campaigns/:id` - Get campaign details, stats, leads, and sequence
- `POST /api/lemlist/test` - Test Lemlist API key
- `GET /api/user/api-key` - Check if user has API key configured
- `POST /api/user/api-key` - Save/update API key
- `DELETE /api/user/api-key` - Revoke API key
- `POST /api/activity` - Log user activity

### Admin API

- `GET /api/admin/stats` - Get admin dashboard stats
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users` - Update user admin status
- `DELETE /api/admin/users` - Delete a user
- `GET /api/admin/activity` - Get recent activity logs

## User Flow

### Regular User Flow

1. **Sign up** → User creates account with email/password
2. **Onboarding** → User pastes their Lemlist API key
3. **Test Connection** → App validates the key with Lemlist API
4. **Dashboard** → User sees all their campaigns with stats
5. **Campaign Detail** → Click any campaign for leads, sequences, detailed stats
6. **Settings** → User can update or revoke their API key anytime

### Admin Flow

1. **Sign up** → Same as regular user
2. **Become Admin** → Run SQL to set `is_admin = TRUE`
3. **Access Admin Portal** → "Admin" link appears in navigation
4. **Monitor Users** → See who's signed up, who has API keys
5. **Track Activity** → View user actions across the platform

## Security Notes

- API keys are stored in Supabase and retrieved server-side only
- Row Level Security (RLS) policies ensure users can only access their own data
- Admin routes are protected and check `is_admin` flag
- Middleware protects authenticated routes
- Service role key is only used server-side

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Make sure to set all environment variables in your Vercel project settings.
