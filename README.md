# CloudExtract Pro 🚀
### Production-Ready Serverless Archive Uploader & Auto-Extractor for Vercel

CloudExtract Pro is a high-performance web application designed to handle high-volume file, folder, and archive uploads with automated streaming serverless decompression. Built from the ground up for Vercel deployment, all heavy compute operations (decompression, checksum validation, and streaming re-packaging) execute purely on the cloud—protecting client devices from high CPU or RAM exhaustion.

---

## 🌟 Key Features

1. **Lightweight Client Architecture**:
   - Zero browser compression or client-side decompression.
   - Direct-to-storage multipart chunked streaming via `@vercel/blob/client`.
   - Completely avoids Vercel's 4.5MB Serverless Function payload limit.
   - Concurrency limiter (maximum 3 concurrent uploads) with Pause, Resume, Cancel, and automatic exponential backoff retries.
   - Smooth Web Worker-driven progress calculation (speed, ETA, percentages).

2. **Serverless Auto-Extraction Pipeline**:
   - Automatic background extraction for `.zip`, `.tar`, `.tar.gz`, and `.tgz`.
   - Entry-by-entry streaming extraction using `yauzl` and `tar-stream`—never buffers entire archives into memory.
   - Safe execution configured for up to 300s runtime via Vercel Fluid Compute.

3. **Enterprise-Grade Extraction Hardening**:
   - **Zip-Slip Protection**: Sanitizes all entry paths against null bytes, drive roots, absolute paths, and `../` traversal attacks.
   - **Zip-Bomb Protection**: Rejects archives exceeding safety limits (cumulative extracted size, max file count, folder nesting depth, and compression ratio > 100:1).
   - **Encrypted Archive Support**: Detects encrypted headers and triggers a glassmorphic password modal to resume extraction.
   - **Symlink Protection**: Automatically neutralizes and blocks dangerous links pointing outside the extraction boundary.

4. **Rich Interactive Exploration**:
   - Expandable & collapsible hierarchical file tree with real-time fuzzy search.
   - Built-in in-browser previews for images, video, audio, syntax-highlighted code/text, and PDF documents.
   - Instant single-file downloads and server-streamed ZIP generation for entire folders or the complete archive.
   - Public share links with custom expiration (1h, 24h, 3d, 7d) and optional password protection.

5. **Automated Lifecycle & Retention**:
   - Hourly Vercel Cron worker (`/api/cron/cleanup`) securely purges expired jobs and deletes all associated blobs from storage.
   - Real-time countdown badges across dashboard, history, and public views.

---

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling & UI**: Tailwind CSS + Framer Motion (Glassmorphism & Neon Glow theme)
- **Icons**: Lucide React
- **Storage**: Vercel Blob Storage (Multipart Client Uploads)
- **Database**: PostgreSQL (Vercel Postgres, Neon, or Supabase) with in-memory fallback for immediate zero-config local dev
- **Extraction Engines**: `yauzl` (streaming ZIP reader) & `tar-stream` (TAR / TAR.GZ reader)
- **Archive Streamer**: `archiver` for on-the-fly streaming ZIP downloads

---

## 📁 Project Structure

```
cloudextract-pro/
├── public/
│   ├── hero-poster.svg             # Lazy load fallback poster for hero video
│   ├── hero-video.mp4              # Lightweight hero loop video
│   └── hero-video.webm             # Modern WebM video source
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── blob-local/route.ts       # Local file serving fallback for offline dev
│   │   │   ├── cron/cleanup/route.ts     # Vercel Cron retention cleanup (24h/7d)
│   │   │   ├── download-zip/route.ts     # Serverless streaming ZIP generator
│   │   │   ├── extract/route.ts          # Serverless fluid compute extraction worker
│   │   │   ├── jobs/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── events/route.ts   # Realtime SSE progress updates
│   │   │   │   │   └── route.ts          # Job detail fetch & deletion
│   │   │   │   └── route.ts              # Job list & creation
│   │   │   ├── share/
│   │   │   │   ├── [shareId]/route.ts    # Public share access & password unlock
│   │   │   │   └── route.ts              # Share link creation
│   │   │   └── upload/token/route.ts     # Vercel Blob client upload token handler
│   │   ├── dashboard/page.tsx            # Full-featured uploader & active queue
│   │   ├── faq/page.tsx                  # Limits, technical documentation, & architecture
│   │   ├── history/page.tsx              # Job history, filters, & multi-select actions
│   │   ├── jobs/[id]/page.tsx            # Extracted file tree, details, & preview
│   │   ├── share/[shareId]/page.tsx      # Public shared link portal
│   │   ├── globals.css                   # Glassmorphism, neon tokens, & scrollbars
│   │   ├── layout.tsx                    # Root layout with ToastProvider & Navbar
│   │   └── page.tsx                      # Hero landing page with live interactive dropzone
│   ├── components/
│   │   ├── extractor/
│   │   │   ├── file-preview-modal.tsx    # Multi-format media & code viewer
│   │   │   ├── file-tree.tsx             # Interactive hierarchical tree explorer
│   │   │   └── password-prompt-modal.tsx # Decryption password modal
│   │   ├── layout/
│   │   │   ├── footer.tsx                # Technical specs footer
│   │   │   ├── hero-video.tsx            # Optimized video background component
│   │   │   └── navbar.tsx                # Glassmorphic header & mobile drawer
│   │   ├── shared/
│   │   │   ├── countdown-badge.tsx       # Live remaining lifetime badge
│   │   │   └── share-dialog.tsx          # Public link creator dialog
│   │   ├── ui/
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── toast.tsx
│   │   └── uploader/
│   │       ├── dropzone.tsx              # Multi-mode dropzone (files, folder, archive)
│   │       └── upload-queue-item.tsx     # Queue card with pause/resume/cancel/retry
│   └── lib/
│       ├── db/
│       │   ├── index.ts                  # PostgreSQL connection pool with fallback
│       │   ├── repository.ts             # Job, ExtractedFile, and Share data queries
│       │   └── schema.sql                # PostgreSQL DDL schema & performance indexes
│       ├── extractor/
│       │   ├── guards.ts                 # Zip-slip & Zip-bomb safety guards
│       │   ├── safe-extractor.ts         # Main archive extraction dispatcher
│       │   ├── tar-extractor.ts          # Streaming tar/tar.gz extractor
│       │   └── zip-extractor.ts          # Safe entry-by-entry yauzl extractor
│       ├── rate-limit/
│       │   └── ip-limiter.ts             # Token-bucket sliding window rate limiter
│       ├── storage/
│       │   └── blob-service.ts           # Vercel Blob client & stream helpers
│       ├── types/
│       │   └── job.ts                    # TypeScript domain definitions
│       ├── uploader/
│       │   └── client-uploader.ts        # Client concurrency & upload manager
│       ├── utils/
│       │   ├── format.ts                 # Byte formatting, icons, & tree builder
│       │   └── hash.ts                   # SHA-256 hash generator
│       └── workers/
│           └── upload-worker.ts          # Web Worker for smooth progress computation
├── .env.example
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## ⚙️ Environment Variables

Create a `.env.local` file or configure these variables in the **Vercel Project Dashboard** (`Settings > Environment Variables`):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob access token | `vercel_blob_rw_...` |
| `POSTGRES_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db?sslmode=require` |
| `CRON_SECRET` | Secret token to authenticate hourly cleanup cron | `cr_sec_xxxxxxxxxxxx` |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL for share links | `https://your-domain.vercel.app` |
| `MAX_EXTRACT_SIZE_MB` | Maximum allowed uncompressed archive size (Zip-Bomb guard) | `1024` (1GB) |
| `MAX_EXTRACT_FILE_COUNT` | Maximum files allowed inside an archive | `5000` |
| `MAX_COMPRESSION_RATIO` | Max decompressed/compressed ratio | `100` |
| `RATE_LIMIT_MAX_REQUESTS`| Rate limit requests per window per IP | `60` |
| `NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB` | Maximum single upload size displayed to client | `500` |

---

## 🚀 Deployment Guide to Vercel (Step-by-Step)

### Step 1: Push Code to GitHub / GitLab
```bash
git init
git add .
git commit -m "feat: Initial commit of CloudExtract Pro"
git branch -M main
git remote add origin https://github.com/your-username/cloudextract-pro.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project** and select your GitHub repository.
3. Framework Preset will automatically detect **Next.js**.

### Step 3: Link Vercel Blob & PostgreSQL Storage
1. In your Vercel Project, navigate to the **Storage** tab.
2. Click **Create Database** > Select **Blob** (Storage for archives & extracted assets) > Link to your project. Vercel will automatically inject `BLOB_READ_WRITE_TOKEN`.
3. Click **Create Database** > Select **Postgres** (or connect existing Neon/Supabase) > Link to your project. Vercel will automatically inject `POSTGRES_URL`.
4. Open the SQL Query editor in Vercel Postgres and run the DDL schema provided in `src/lib/db/schema.sql`.

### Step 4: Configure Vercel Cron & Secret
1. Go to **Settings** > **Environment Variables**.
2. Add `CRON_SECRET` with any strong random string (e.g., `openssl rand -hex 24`).
3. Add `NEXT_PUBLIC_APP_URL` with your deployment URL (e.g., `https://cloudextract-pro.vercel.app`).
4. Click **Deploy**.

---

## 📊 Vercel Plan Limits (Hobby vs. Pro) & Workarounds

| Feature | Hobby Plan (Free) | Pro Plan ($20/mo) | How CloudExtract Pro Handles It |
| :--- | :--- | :--- | :--- |
| **Max Function Duration** | 60 seconds (or fluid compute) | Up to 300 seconds (5 min) | `maxDuration: 300` set in `vercel.json` and API route exports. Operations stream entries directly to minimize execution time. |
| **Max Request Body** | 4.5 MB | 4.5 MB | **Bypassed completely**: Uploads stream directly from the browser to Vercel Blob via signed client tokens. |
| **Serverless Memory** | 1024 MB | Up to 3008 MB | Extractor streams each entry sequentially, keeping memory consumption < 120 MB even on 500MB+ archives. |
| **Cron Invocations** | Once per day | Hourly (`0 * * * *`) | Configured in `vercel.json`. On Hobby, if hourly cleanup is desired, you can use a free external cron service (like cron-job.org) targeting `GET /api/cron/cleanup` with `Authorization: Bearer <CRON_SECRET>`. |

---

## 🛠️ Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000).
   > *Note: If `POSTGRES_URL` or `BLOB_READ_WRITE_TOKEN` are omitted in local development, CloudExtract Pro automatically switches to internal fallback storage and in-memory mock database for zero-config testing!*
