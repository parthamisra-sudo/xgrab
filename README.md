# XGrab - X (Twitter) Export & Delete Tool

A production-ready application for searching, exporting, and bulk deleting tweets. Built for researchers, marketers, data analysts, and anyone who needs to manage their Twitter/X data.

## Features

### Search & Export
- Search tweets by any public Twitter handle
- Filter by date range or fetch all available tweets
- Filter by content type: Posts only, Replies only, or Both
- Real-time profile autocomplete with avatars and follower counts
- Export up to 3,200 tweets (Twitter API limit)
- **5 export formats**: CSV, Excel (XLSX), JSON, PDF, TXT
- Real-time tweet preview before exporting
- Interest-based trending profile suggestions

### Bulk Delete
- Load and view your own tweets via OAuth 1.0a
- Filter tweets by date range for targeted deletion
- Select individual tweets or bulk select all
- Safety confirmation requiring typed phrase "DELETE PERMANENTLY"
- Progress tracking with visual progress bar
- Rate-limit-aware deletion (3.2s between requests)

### Developer Experience
- Rate limit handling (450 requests per 15 minutes)
- Connection testing and server health monitoring
- Standalone diagnostics tool
- Secure credential storage (browser localStorage only)

---

## Architecture

```
┌───────────────────┐         ┌────────────────────┐         ┌─────────────────┐
│  Frontend (HTML)  │ ◄─────► │  Backend (Express)  │ ◄─────► │  Twitter API v2 │
│  React 18 SPA     │  REST   │  Node.js Server     │  HTTPS  │  OAuth 1.0a +   │
│  Single HTML file │         │  Port 3001          │         │  Bearer Token   │
└───────────────────┘         └────────────────────┘         └─────────────────┘
```

- **Frontend**: React 18 SPA (single HTML file, CDN-loaded)
- **Backend**: Express.js API proxy with OAuth 1.0a signing
- **Auth**: Bearer Token (read operations) + OAuth 1.0a (write/delete operations)
- **Storage**: Browser localStorage for credentials (nothing stored server-side)

---

## Installation & Setup

### Prerequisites

- Node.js 14+ (v18+ recommended) and npm
- Twitter/X Developer Account with API access
- Modern web browser

### Step 1: Get Twitter API Credentials

1. Visit the [X Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Create a Project and App
3. Set **App permissions** to **Read and Write**
4. Set **Type of App** to **Web App, Automated App or Bot**
5. Generate your keys:
   - **Consumer Key** (API Key)
   - **Consumer Secret** (API Secret)
   - **Bearer Token**
   - **Access Token** (for delete operations)
   - **Access Token Secret** (for delete operations)

> **Important**: If you change app permissions, you must regenerate your Access Token and Secret for the new permissions to take effect.

### Step 2: Install Dependencies

```bash
cd XGrab
npm install
```

### Step 3: Start the Server

```bash
# Production
node xgrab-server.js

# Or with npm
npm start

# Development (auto-restart on changes)
npm run dev
```

You should see:
```
╔════════════════════════════════════════════╗
║         XGrab Backend Server v1.0          ║
╠════════════════════════════════════════════╣
║  Status: Running                           ║
║  Port: 3001                                ║
║  Endpoints: 7 available                    ║
╚════════════════════════════════════════════╝
```

### Step 4: Configure the App

1. Open `xgrab-frontend.html` in your browser
2. Go to **⚙️ Configuration** tab
3. Enter your credentials:
   - Consumer Key & Secret
   - Bearer Token
   - Access Token & Secret (optional, needed for Bulk Delete)
4. Click **Save Configuration**
5. Click **Test Connection** to verify

### Step 5: Start Using XGrab

**To export tweets:**
1. Go to **Search & Export** tab
2. Enter a Twitter handle
3. Choose filters (date range, content type, max tweets)
4. Click **Search Tweets**
5. Export in your preferred format (CSV, Excel, JSON, PDF, TXT)

**To delete tweets:**
1. Go to **Bulk Delete** tab
2. Click **Load My Recent Tweets** or filter by date range
3. Select tweets to delete
4. Confirm by typing "DELETE PERMANENTLY"

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Server health & diagnostics |
| POST | `/api/test` | Bearer | Validate API connection |
| POST | `/api/tweets` | Bearer | Fetch user tweets (paginated) |
| POST | `/api/search-users` | Bearer | User search / autocomplete |
| POST | `/api/user` | Bearer | Get user profile info |
| POST | `/api/my-tweets` | OAuth 1.0a | Fetch authenticated user's tweets |
| POST | `/api/delete-tweet` | OAuth 1.0a | Delete a tweet by ID |

---

## Configuration

### Frontend Settings

| Setting | Required | Description |
|---------|----------|-------------|
| Consumer Key | For delete | Twitter API Key |
| Consumer Secret | For delete | Twitter API Secret |
| Bearer Token | Yes | App authentication token |
| Access Token | For delete | OAuth 1.0a user token |
| Access Token Secret | For delete | OAuth 1.0a user secret |
| API Endpoint | Yes | Backend URL (default: `http://localhost:3001`) |

### Environment Variables (Optional)

Create a `.env` file from the template:
```bash
cp env.example .env
```

```
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=450
```

---

## Export Formats

### CSV
| Column | Description |
|--------|-------------|
| ID | Unique tweet ID |
| Author | Display name |
| Handle | Twitter handle |
| Date | Tweet timestamp |
| Content | Full tweet text |
| Type | Post or Reply |
| Likes | Like count |
| Retweets | Retweet count |
| Replies | Reply count |
| URL | Direct link to tweet |

### Excel (XLSX)
Same columns as CSV with formatted column widths.

### JSON
Structured export with metadata (export date, handle, content type, tweet count) and nested metrics objects.

### PDF
Table format with date, type, content preview, likes, and retweets.

### TXT
Plain text format with full tweet details, numbered entries.

---

## Security

### Best Practices
- Store credentials only on trusted devices
- Regenerate credentials immediately if exposed
- Use HTTPS in production deployments
- Never commit `.env` or credential files to git
- Clear configuration before sharing screenshots

### How Credentials Are Handled
- All credentials stored in browser localStorage only
- Backend server does not persist any credentials
- OAuth signatures generated server-side using HMAC-SHA1
- Bearer tokens passed per-request, never logged

---

## Rate Limits

Twitter API v2 (Essential Access):
- **Requests**: 450 per 15-minute window
- **User timeline**: Up to 3,200 most recent tweets
- **Tweet deletion**: ~50 per 15 minutes (rate limited with 3.2s delays)

XGrab automatically tracks rate limits and provides reset time information.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot connect to backend server" | Ensure server is running (`node xgrab-server.js`) and port 3001 is open |
| "Invalid credentials" | Regenerate Bearer Token, check for extra spaces |
| "Unauthorized" on Bulk Delete | Ensure app has "Read and Write" permissions; regenerate Access Token after changing permissions |
| "User not found" | Check username spelling, ensure account is public |
| "Rate limit exceeded" | Wait 15 minutes, reduce max tweets setting |
| "Endpoint not found" | Restart the server to pick up latest code changes |
| Server health button shows offline | Restart server, check if port 3001 is in use |

---

## Project Structure

```
XGrab/
├── xgrab-server.js           # Express backend server (OAuth 1.0a + Bearer Token)
├── xgrab-frontend.html       # React 18 SPA (complete UI)
├── xgrab-diagnostics.html    # Standalone endpoint diagnostics tool
├── package.json              # Dependencies and scripts
├── env.example               # Environment variable template
├── test-server.ps1           # PowerShell test script (Windows)
├── README.md                 # This file
├── QUICKSTART.md             # 5-minute setup guide
├── CONTRIBUTING.md           # Contribution guidelines
├── LICENSE                   # MIT License
└── GitHub/
    └── README.md             # Product management documentation
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18, Babel Standalone, Vanilla CSS |
| Backend | Node.js, Express 4.18, Axios 1.6 |
| Auth | OAuth 1.0a (HMAC-SHA1), OAuth 2.0 Bearer Token |
| Export | SheetJS (Excel), jsPDF (PDF) |
| API | Twitter API v2 |

---

## Legal Notice

- Respect Twitter/X Terms of Service
- Only export publicly available data
- Do not use exported data for spam or harassment
- Rate limit compliance is built-in
- Users are responsible for their use of exported/deleted data

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

**Made with love in India** 🇮🇳

Version 2.0.0 - Export & Delete
