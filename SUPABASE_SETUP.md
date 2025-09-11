# 🗄️ Supabase Database Setup Guide

This guide will help you set up your Supabase database for the Poker Club Dashboard with real-time synchronization.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/login to your account
3. Click "New Project"
4. Fill in your project details:
   - **Name**: `poker-club-dashboard`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your location
5. Click "Create new project"

### 2. Get Your Project Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **Project API Key** (anon/public key)

### 3. Configure Environment Variables

1. Create `.env.local` file in your project root:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` with your credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Create Database Tables

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the sidebar
3. Create a new query
4. Copy and paste the entire contents from `supabase/schema.sql`
5. Click **Run** to execute the schema

## 📊 Database Structure

### Players Table
- **Primary Key**: `id` (auto-increment)
- **Fields**: name, email, phone, join_date, total_hours, total_sessions, etc.
- **Relationships**: One-to-many with sessions

### Sessions Table (History)
- **Primary Key**: `id` (auto-increment) 
- **Foreign Key**: `player_id` → `players.id`
- **Fields**: seat_in_time, seat_out_time, duration, date, etc.
- **Relationships**: Many-to-one with players

### Promotions Table
- **Primary Key**: `id` (auto-increment)
- **Fields**: name, start_date, end_date, active, deleted
- **Purpose**: Track promotion periods

### Club Settings Table
- **Primary Key**: `id` (auto-increment)
- **Fields**: club_name, location, stakes, currency, timezone
- **Purpose**: Store club configuration

## 🔄 Real-time Features

### Automatic Synchronization
- **Players**: Real-time updates when players are added/modified/deleted
- **Sessions**: Live session tracking across all clients
- **Promotions**: Instant promotion updates
- **Multi-client**: Changes sync across all connected dashboards

### Row Level Security (RLS)
- Currently set to public access for development
- Can be configured for authentication later
- Policies can be customized based on your needs

## 🧪 Testing Your Setup

### 1. Start Development Server
```bash
npm run dev
```

### 2. Check Connection Status
- Dashboard should show "Connecting to Database" briefly
- If successful: Dashboard loads with data
- If failed: Error message with connection details

### 3. Test Database Operations
1. **Add Player**: Use the "Add Player" button
2. **Sit In/Out**: Test session tracking
3. **Create Promotion**: Add a new promotion period
4. **Check Sync**: Open dashboard in multiple tabs to see real-time updates

## 🛠️ Troubleshooting

### Connection Errors
```
Database Connection Error: Failed to connect to Supabase
```
**Solutions**:
- Check `.env.local` file exists and has correct values
- Verify Supabase URL starts with `https://`
- Ensure API key is the anon/public key (not service key)
- Restart development server after changing environment variables

### Schema Errors
```
relation "players" does not exist
```
**Solutions**:
- Run the schema.sql file in Supabase SQL Editor
- Check that all tables were created successfully
- Verify in Supabase Dashboard → Table Editor

### Real-time Issues
```
Real-time subscriptions not working
```
**Solutions**:
- Check if RLS policies are blocking access
- Verify Supabase project has real-time enabled
- Check browser console for WebSocket connection errors

## 🔧 Advanced Configuration

### Enable Row Level Security
```sql
-- Restrict access to authenticated users only
DROP POLICY IF EXISTS "Enable all operations for all users" ON players;
CREATE POLICY "Enable operations for authenticated users" ON players FOR ALL USING (auth.uid() IS NOT NULL);
```

### Custom Indexes for Performance
```sql
-- Add custom indexes for better query performance
CREATE INDEX idx_sessions_player_date ON sessions(player_id, date_string);
CREATE INDEX idx_players_active ON players(total_hours) WHERE total_hours > 0;
```

### Backup and Restore
```bash
# Export data
supabase db dump --file backup.sql

# Restore data  
supabase db reset --file backup.sql
```

## 📈 Production Deployment

### Environment Variables
Set these in your production environment:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-key
```

### Database Optimization
- Enable connection pooling
- Set up database backups
- Monitor query performance
- Configure appropriate RLS policies

## 🆘 Support

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

### Common Commands
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to existing project
supabase link --project-ref your-project-ref

# Generate TypeScript types
supabase gen types typescript --project-id your-project-ref > types/database.types.ts
```

---

🎉 **Your poker club dashboard is now powered by Supabase with real-time synchronization!**

All player data, session history, and promotions will be stored securely in the cloud and sync in real-time across all connected clients.