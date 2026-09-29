# HomeHive

HomeHive is a React/Vite client connected to a MongoDB-backed Express API.

## Project layout

- `backend/` is the canonical application API. It contains the Express entry point, MongoDB models, routes, controllers, and middleware.
- `frontend/` is the canonical React client. It contains the existing dashboard design plus authentication, service discovery/booking, passport, billing, messaging, provider, and admin views.
- `homehive-frontend/` is the untouched source reference copied to `frontend/`. It is retained because Windows had an active workspace watcher locking the directory during the safe rename; run the canonical client from `frontend/`.
- `server/src/` is a separate, smaller provider/passport prototype. It is retained as reference and is not started alongside `backend/`.
- `HomeHive2.O/backend/` is an alternate backend snapshot with overlapping billing, reminder, and service-record models. It is retained but is not part of the canonical run path.

The canonical passport relationship is `User -> Home -> Appliance -> Booking -> ServiceReport -> Provider`, with related bills. `ServiceReport` stores parts, cost, warranty duration, service date, and optional next-service date. Provider profiles support skills, categories, experience, service area, availability, and reviews.

## Run the application

Requirements: Node.js/npm and a MongoDB instance or MongoDB Atlas URI.

1. Install dependencies in `backend/` and `frontend/` with `npm install` in each directory.
2. Configure `backend/.env` with `MONGO_URI`, a strong `JWT_SECRET`, optionally `PORT` (defaults to `5000`), and optionally `CLIENT_ORIGINS` (comma-separated browser origins; defaults to `http://localhost:5173`).
3. Set `frontend/.env` to `VITE_API_URL=http://localhost:5000/api`.
4. Start the API from `backend/` with `npm run dev`.
5. Start the client from `frontend/` with `npm run dev` and open the Vite URL (normally `http://localhost:5173`).

The API connects to MongoDB and idempotently seeds missing default service categories before it begins listening. The frontend calls the API through `VITE_API_URL`; it never connects to MongoDB directly. The backend uses bearer JWTs and stores the browser session token in `sessionStorage`.

### Admin account

Public signup supports customer/provider roles only. To create the first admin, set `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 12 characters in the process environment, then run `npm run create-admin` from `backend/`. The script uses `MONGO_URI`, refuses to alter an existing account, and never prints the credentials.

### API and feature notes

- The canonical API is mounted under `/api`; the client API helper centralizes URL and bearer-token handling.
- Customers can register homes/appliances, view their service passport, discover providers, request bookings, message the assigned provider, view bills, and mark simulated payments paid.
- Providers can create/update their profile, publish availability, handle bookings, submit service reports, and create itemized bills.
- Admin views are role-gated in the client and protected by backend middleware.
- Account profiles support name, phone, and location updates; the Settings page controls the browser-session theme preference.
- Payment is a college-project status simulation; no external gateway is configured. Password changes and broader account settings are not provided by the current backend.
- Page selection is represented in the URL query so navigation survives refresh and browser back/forward.
- `server/` and `HomeHive2.O/` are retained reference snapshots and are not part of the canonical run path.
- The canonical React source is in `frontend/`; `homehive-frontend/` is retained as a backup/reference copy and is not the run path.
