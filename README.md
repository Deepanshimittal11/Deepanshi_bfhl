# BFHL — Chitkara Full Stack Engineering Challenge

Plain **JavaScript** REST API + **HTML/CSS/JS** frontend for processing hierarchical node relationships.

## Stack

- **Backend:** Node.js + Express (`server.js`)
- **Frontend:** Plain HTML, CSS, JavaScript (`public/`)
- **Logic:** `lib/bfhl.js`

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your actual user_id, email, and roll number
npm run dev
```

- Frontend: http://localhost:3000
- API: POST http://localhost:3000/bfhl

## API

**POST /bfhl**

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

Returns hierarchies, invalid entries, duplicate edges, and summary stats. CORS is enabled.

## Environment Variables

| Variable | Description |
|---|---|
| `USER_ID` | Format: `fullname_ddmmyyyy` (e.g. `johndoe_17091999`) |
| `EMAIL_ID` | Your college email |
| `COLLEGE_ROLL_NUMBER` | Your college roll number |
| `PORT` | Server port (default: 3000) |

## Deploy to Render / Railway

1. Push to a public GitHub repository
2. Create a new Web Service on [Render](https://render.com) or [Railway](https://railway.app)
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables in the dashboard

Both frontend and API will be served from the same URL (`/` and `/bfhl`).

## Test

```bash
npm test
```

## Submission Checklist

- [ ] Update `.env` / hosting env vars with your real credentials
- [ ] Deploy to Render, Railway, or Vercel
- [ ] Push to public GitHub repo
- [ ] Submit: API URL, frontend URL, GitHub repo URL
