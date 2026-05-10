# Free Hosting Guide (TrustScore AI)

This guide deploys the app with:
- Backend: Render (free web service)
- Frontend: Vercel (free static hosting)

## 1. Before You Deploy

Prepare these values from your current local `back-end/.env`:
- `API_KEY`
- `NOKIA_API_KEY`
- `NOKIA_APPLICATION_KEY`
- `NOKIA_USE_SDK`
- `NOKIA_SIM_SWAP_MAX_AGE_HOURS`
- `NOKIA_LOCATION_DEFAULT_LATITUDE`
- `NOKIA_LOCATION_DEFAULT_LONGITUDE`
- `NOKIA_LOCATION_DEFAULT_RADIUS_METERS`
- `NOKIA_LOCATION_DEFAULT_MAX_AGE_SECONDS`
- `NOKIA_CAMARA_BASE_URL`
- `NOKIA_SIM_SWAP_PATH`
- `NOKIA_DEVICE_STATUS_PATH`
- `NOKIA_LOCATION_VERIFY_PATH`
- `NOKIA_RAPIDAPI_HOST`
- `NOKIA_API_TIMEOUT_MS`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

Do not commit secrets to git.

## 2. Deploy Backend on Render (Free)

1. Push your repo to GitHub.
2. Open Render dashboard -> New -> Blueprint.
3. Select your repo and apply `render.yaml` from root.
4. In Render service env vars, fill the variables listed above.
5. Keep `CORS_ORIGIN` empty for now until frontend URL exists.
6. Deploy.

After deploy, verify:
- `GET https://<your-backend>.onrender.com/health` returns `{ "status": "OK" }`

## 3. Deploy Frontend on Vercel (Free)

1. Open Vercel dashboard -> Add New Project.
2. Import the same GitHub repo.
3. Set **Root Directory** to `front-end`.
4. Framework preset: Vite.
5. Add env vars:
   - `VITE_TRUSTSCORE_API_BASE_URL=https://<your-backend>.onrender.com`
   - `VITE_TRUSTSCORE_API_KEY=<same API_KEY used in backend>`
6. Deploy.

After deploy, copy the Vercel URL (for example: `https://trustscore-ai.vercel.app`).

## 4. Final CORS Update

1. Go back to Render service env vars.
2. Set:
   - `CORS_ORIGIN=https://<your-vercel-url>`
3. Redeploy backend.

## 5. End-to-End Test

Frontend test:
1. Open Vercel URL.
2. Submit `+99999991000`.
3. Confirm score and breakdown are returned.

API test:
```bash
curl -X POST https://<your-backend>.onrender.com/api/check-number-risk \
  -H "Content-Type: application/json" \
  -H "x-api-key: <API_KEY>" \
  -d '{"phoneNumber":"+99999991000"}'
```

## 6. Free Tier Notes

- Render free services may sleep after inactivity (cold start delay).
- Vercel static hosting stays fast; delay usually comes from waking backend.

## 7. Submission Links to Use

- Demo link: your Vercel URL
- Repository link: your GitHub repo URL
- API health proof: `https://<your-backend>.onrender.com/health`
