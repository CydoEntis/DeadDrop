# DeadDrop

Secure, self-destructing file transfers. Generate a one-time link, send it to someone, and they upload a file that auto-deletes after download or 30 minutes — whichever comes first.

## What is DeadDrop?

DeadDrop is a self-hosted file transfer tool built for privacy-first, ephemeral sharing. You generate a drop link from the admin console, share it with someone, and they upload a file through a clean, anonymous interface. The file is stored in S3, encrypted at rest, and automatically destroyed after a single download or when the timer expires.

No accounts needed for uploaders or downloaders. No file lingering on servers.

### Key Features

- **One-Time Drop Links** — Generate invite links from the admin console with optional storage limits. Each link expires in 30 minutes and allows a single upload.
- **Self-Destructing Files** — Uploaded files auto-delete after 1 download or 30 minutes, whichever comes first.
- **Resumable Uploads** — TUS protocol for chunked, resumable file uploads. Connection drops? Pick up where you left off.
- **Password Protection** — Optionally lock drops with a password that only the recipient knows.
- **S3 Storage** — Files stored in S3-compatible object storage (Garage, MinIO, AWS S3). No files on the application server.
- **Admin Console** — Manage drop links, view active drops, delete files manually, and monitor system stats.
- **Cleanup Service** — Background service automatically purges expired drops and orphaned files.

## Tech Stack

### Frontend
- React 19, TypeScript, Vite 7
- TanStack Router (file-based routing) + TanStack Query (data fetching)
- Zustand (state management)
- React Hook Form + Zod 4 (form validation)
- Tailwind CSS v4
- Axios, Lucide icons, Sonner toasts

### Backend
- .NET 9 Minimal API
- Entity Framework Core + PostgreSQL
- tusdotnet (TUS resumable uploads)
- Serilog (structured logging)

### Custom Libraries
- **Pawthorize** — Authentication (JWT, refresh tokens, CSRF)
- **SuccessHound** — Standardized API response envelopes and pagination
- **ErrorHound** — Typed exception handling middleware
- **StashPup** — S3 file storage abstraction

### Infrastructure
- **Garage** (or any S3-compatible storage) — Object storage for uploaded files
- **PostgreSQL** — Database for drop metadata, invite codes, and download tracking

## Getting Started

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 16+](https://www.postgresql.org/download/)
- S3-compatible storage (Garage, MinIO, or AWS S3)

### Setup

1. **Install dependencies:**
   ```bash
   npm run setup
   ```

2. **Create the database:**
   ```sql
   CREATE DATABASE deaddrop;
   ```

3. **Configure secrets:**
   ```bash
   cd backend/DeadDrop.Api
   dotnet user-secrets init
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=deaddrop;Username=postgres;Password=yourPassword"
   dotnet user-secrets set "Jwt:Secret" "your-64-character-secret-here"
   dotnet user-secrets set "StashPup:AccessKey" "your-s3-access-key"
   dotnet user-secrets set "StashPup:SecretKey" "your-s3-secret-key"
   ```

4. **Create the S3 bucket:**
   ```bash
   # Example using Garage CLI
   garage bucket create deaddrop
   garage bucket allow deaddrop --read --write --owner --key YOUR_KEY_ID
   ```

5. **Run migrations:**
   ```bash
   npm run db:migrate
   ```

6. **Start the app:**
   ```bash
   npm run dev
   ```

   Frontend runs on http://localhost:3000, backend on http://localhost:5135.

### Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Run frontend + backend together |
| `npm run dev:frontend` | Frontend only (Vite dev server) |
| `npm run dev:backend` | Backend only (.NET API server) |
| `npm run build:frontend` | Production frontend build |
| `npm run build:backend` | Production backend build |
| `npm run db:migrate` | Apply pending EF Core migrations |
| `npm run db:migration -- MigrationName` | Create a new migration |

## Project Structure

```
DeadDrop/
├── backend/DeadDrop.Api/
│   ├── Domain/Entities/         # EF Core entities
│   ├── Features/
│   │   ├── DropLink/            # Core feature (uploads, downloads, admin, cleanup)
│   │   └── Dashboard/           # Dashboard stats
│   ├── Infrastructure/          # Auth, database, email, file storage
│   ├── Migrations/              # EF Core migrations
│   └── Program.cs               # Entry point
├── frontend/app/
│   ├── src/
│   │   ├── components/ui/       # UI component library
│   │   ├── features/
│   │   │   ├── droplink/        # Core feature (upload form, download page, admin console)
│   │   │   ├── auth/            # Authentication
│   │   │   ├── landing/         # Landing page
│   │   │   └── layouts/         # Page layouts
│   │   ├── lib/                 # API client, constants, utilities
│   │   ├── routes/              # TanStack Router file-based routes
│   │   └── stores/              # Zustand stores
│   └── public/                  # Static assets
└── package.json                 # Workspace scripts
```

## How It Works

1. **Admin generates a drop link** from the console with an agent name and optional storage limit
2. **Admin shares the link** with the person who needs to send a file
3. **Uploader visits the link**, selects a file, optionally sets a password, and uploads
4. **Uploader gets a download link** to share back with the admin (or anyone)
5. **Recipient downloads the file** — one click triggers authorization and download
6. **File self-destructs** — automatically deleted from S3 after download or expiry

## License

This project is for personal/portfolio use.
