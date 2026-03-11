# Lemlist Data Sync System

This document explains the data sync architecture for efficiently handling large Lemlist campaigns.

## Problem

- Lemlist API has rate limits (20 requests/minute)
- Campaigns can have 3,000+ leads
- Real-time fetching is too slow for dashboards

## Solution: Cached Data Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Lemlist API    │────▶│  Sync Script │────▶│  Supabase       │
│  (Source)       │     │  (Periodic)  │     │  (Cache)        │
└─────────────────┘     └──────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Dashboard      │
                                               │  (Fast Reads!)  │
                                               └─────────────────┘
```

## Database Schema

### Tables Created

1. **`lemlist_campaigns`** - Cached campaign data
   - Campaign ID, name, status
   - Last sync timestamp
   - Total lead count

2. **`lemlist_campaign_stats`** - Historical stats snapshots
   - Total leads, sent, opened, replied counts
   - Calculated rates (open rate, reply rate, etc.)
   - Timestamp for each snapshot

3. **`lemlist_leads`** - Cached lead data (top engaged leads only)
   - Lead ID, email, name, status
   - Campaign association
   
4. **`lemlist_sync_log`** - Sync history
   - When sync started/completed
   - Status (running, completed, failed)
   - Number of campaigns/leads synced

## Setup Instructions

### 1. Run the Database Migration

```bash
# In Supabase SQL Editor, run:
supabase/migrations/003_create_lemlist_cache.sql
```

### 2. Run Initial Sync

```bash
# Set your environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Run the sync for your user ID
npx tsx scripts/sync-lemlist-data.ts 53ffa8c8-95ae-44df-920a-afec2d17158f
```

### 3. Set Up Automated Sync (Options)

#### Option A: Cron Job (Server/VPS)
```bash
# Edit crontab
crontab -e

# Add line to sync every hour
0 * * * * cd /path/to/lemlist-portal && USER_ID=53ffa8c8-95ae-44df-920a-afec2d17158f npx tsx scripts/sync-lemlist-data.ts >> /var/log/lemlist-sync.log 2>&1
```

#### Option B: GitHub Actions (Free)
Create `.github/workflows/sync.yml`:
```yaml
name: Sync Lemlist Data
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npx tsx scripts/sync-lemlist-data.ts ${{ secrets.USER_ID }}
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

#### Option C: Vercel Cron (Pro Plan)
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "0 * * * *"
    }
  ]
}
```

#### Option D: Supabase Edge Functions
Use Supabase's built-in cron extension to trigger edge functions.

## Usage

### Dashboard (Fast Loading)

The dashboard now has two modes:

1. **Cached Mode** (Default) - Reads from Supabase
   - Loads in < 1 second
   - Shows "Last synced: X minutes ago"
   - Data is accurate up to last sync

2. **Real-time Mode** - Fetches from Lemlist API
   - Use for immediate updates
   - Slower (5-10 minutes for large campaigns)
   - "Refresh" button triggers this

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/cached/campaigns` | Fast cached data |
| `/api/sync` | Check/trigger sync |
| `/api/lemlist/campaigns` | Real-time (slow) |

### Checking Sync Status

```javascript
// In browser console or API
const response = await fetch('/api/sync', {
  headers: { Authorization: `Bearer ${token}` }
})
const data = await response.json()

console.log(data)
// {
//   sync: { status: 'completed', campaigns_synced: 18, ... },
//   isStale: false,
//   lastSync: '2026-03-11T12:00:00Z'
// }
```

## Sync Performance

| Campaign Size | Sync Time | API Calls |
|---------------|-----------|-----------|
| 100 leads     | 5s        | 2         |
| 1,000 leads   | 30s       | 11        |
| 3,000 leads   | 2 min     | 31        |
| 10,000 leads  | 7 min     | 101       |

With rate limiting (20 req/min), max sync speed is:
- ~1,000 leads per minute

## Data Freshness

- **Sync Frequency**: Every hour recommended
- **Stale Threshold**: > 1 hour = stale
- **Dashboard Warning**: Shows "Data may be outdated" if stale

## Troubleshooting

### Sync Fails with Rate Limit
The script handles rate limits automatically with 3-second delays. If it still fails:
1. Wait 1 minute
2. Re-run the sync
3. Check `lemlist_sync_log` table for errors

### Dashboard Shows No Data
1. Check if sync has run: `SELECT * FROM lemlist_sync_log`
2. Run manual sync: `npx tsx scripts/sync-lemlist-data.ts <user_id>`
3. Check browser console for API errors

### Data Seems Outdated
1. Check last sync time in dashboard
2. Click "Refresh Data" button
3. Or run manual sync from terminal

## Future Improvements

1. **Incremental Sync** - Only fetch changed data
2. **Webhook Support** - Lemlist webhooks for real-time updates
3. **Multi-tenant** - Sync all users' data in one job
4. **Data Retention** - Auto-delete old sync logs
5. **Email Notifications** - Alert on sync failures
