# XGrab Quick Start Guide

## 5-Minute Setup

### Step 1: Get Twitter API Access

1. Visit: https://developer.x.com/en/portal/dashboard
2. Create a Project and App
3. Set **App permissions** to **Read and Write**
4. Set **Type of App** to **Web App, Automated App or Bot**
5. Generate your keys:
   - **Bearer Token** (required for search & export)
   - **Consumer Key & Secret** (required for delete)
   - **Access Token & Secret** (required for delete)

> After changing permissions, always regenerate your Access Token & Secret.

### Step 2: Install & Run

```bash
npm install
node xgrab-server.js
```

### Step 3: Configure

1. Open `xgrab-frontend.html` in your browser
2. Go to **Configuration** tab
3. Paste your **Bearer Token** (minimum required)
4. For delete functionality, also add Consumer Key/Secret and Access Token/Secret
5. Click **Save Configuration**
6. Click **Test Connection** (should show success)

### Step 4: Export Tweets

1. Go to **Search & Export** tab
2. Enter a Twitter handle (e.g., `elonmusk`)
3. Choose content type (Posts, Replies, or Both)
4. Click **Search Tweets**
5. Export as **CSV, Excel, JSON, PDF, or TXT**

### Step 5: Delete Tweets (Optional)

1. Go to **Bulk Delete** tab
2. Click **Load My Recent Tweets**
3. Select tweets to delete
4. Type "DELETE PERMANENTLY" to confirm

Done!

---

## Security Reminders

- **NEVER** share your API credentials
- **REGENERATE** credentials if exposed
- Credentials are stored in browser localStorage only
- Backend server never stores credentials

---

## What You Can Do

- Export up to 3,200 tweets per user in 5 formats
- Filter by date range and content type
- Search any public Twitter account
- Bulk delete your own tweets
- Autocomplete profile search

## Limitations

- Cannot access protected/private accounts
- 3,200 tweet limit per user (Twitter restriction)
- 450 requests per 15-minute window
- ~50 deletions per 15 minutes

---

## Troubleshooting

**Server won't start?**
- Run `npm install` first
- Check if port 3001 is available

**Connection failed?**
- Verify Bearer Token is correct
- Ensure server is running
- Try regenerating your token

**Unauthorized on delete?**
- Ensure app permissions are set to "Read and Write"
- Regenerate Access Token after changing permissions

**No tweets found?**
- Check username spelling
- Verify account is public

---

## Common Commands

```bash
# Start server
node xgrab-server.js

# Start with auto-restart (development)
npm run dev

# Stop server
Ctrl + C

# Check server health
curl http://localhost:3001/health
```

---

**You're ready to go!**
