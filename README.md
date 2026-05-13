# Medical Health Management System

This workspace contains a React-based medical health management system with a Supabase backend for data management and Google services integration.

## Setup

### Frontend Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment variables (copy `.env` is already created with Supabase credentials)

3. Start the development server

```bash
npm run dev
```

### Backend Setup

1. Navigate to backend directory

```bash
cd backend
```

2. Install backend dependencies

```bash
npm install
```

3. Set up Supabase database:
   - Go to your Supabase dashboard
   - Open SQL Editor
   - Run the SQL from `backend/supabase-schema.sql`

4. Configure environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your Supabase service role key and Google credentials (optional)

5. Start the backend server

```bash
npm run dev
```

The backend runs on `http://localhost:4000` and the frontend on `http://localhost:5173`.

## Build

Build for production

```bash
npm run build
```

## Features

- Medical clinic management
- Drug inventory tracking
- Patient appointments
- Sales and billing
- Performance analytics
- Google Calendar integration
- Email notifications via Gmail

```bash
npm run build
```

4. Preview the production build

```bash
npm run serve
```

## Notes

- The app entrypoint is `js/index.js`.
- The UI uses React Router, Material UI, FontAwesome, Chart.js, and other libraries.
- API endpoints are configured in `js/config.dev.js`.
