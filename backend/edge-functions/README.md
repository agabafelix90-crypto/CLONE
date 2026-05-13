# Supabase Edge Functions

This directory contains Supabase Edge Functions for handling complex business logic with real-time analytics.

## Functions

- **analytics**: Provides real-time analytics data for clinics (appointments, sales, etc.)
- **notifications**: Manages notifications for clinics
- **billing**: Handles billing calculations and item insertions

## Deployment

To deploy these functions, ensure you have the Supabase CLI installed:

```bash
npm install -g supabase
```

Then, from the project root:

```bash
supabase functions deploy analytics
supabase functions deploy notifications
supabase functions deploy billing
```

## Usage

These functions can be called via HTTP requests to your Supabase project's edge function URLs.

Example for analytics:
```
POST https://your-project.supabase.co/functions/v1/analytics
Headers: Authorization: Bearer <token>
Body: { "clinic_id": "uuid", "metric": "appointments" }
```