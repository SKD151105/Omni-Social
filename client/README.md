# OmniSocial Frontend

Minimal, resume-focused React frontend for core OmniSocial user flows.

## Setup

1. Install dependencies:
   npm install
2. Start app:
   npm run dev

## Product Views

- Dashboard: summary and recent activity from /dashboard.
- Videos: publish, list, toggle publish, delete.
- Tweets: create and delete own tweets.
- Playlists: create and delete own playlists.
- Profile: update account details and change password.

## Usage

1. Open app and set API base URL if needed (default: http://localhost:8000/api/v1).
2. Login or register from the auth panel.
3. Navigate product sections from left sidebar.
4. Use sidebar routes for clean, production-style navigation.

## Notes

- Settings are stored in localStorage:
   - omnisocial_base_url
   - omnisocial_access_token
