# Nass Library Mobile

Production-ready native mobile app (Android & iOS) for the Nass Library API. Built with **Expo** and **React Native** (TypeScript).

## Features

- **Auth**: Register, login, logout, profile (get/update), token refresh with secure storage
- **Categories**: List and category detail with resources
- **Resources**: List, detail, and file open/download (auth-aware for restricted content)
- **Search**: Advanced search across categories, resources, and FAQs (with type filter)
- **Reading list**: Member reading list (requires sign-in)
- **FAQs**: List and FAQ detail
- **Profile**: View/edit profile, change password, sign out

## Requirements

- Node.js 18+
- npm or yarn
- Expo Go (for device testing) or Xcode/Android Studio for simulators

## Setup

1. **Install dependencies**

   ```bash
   cd mobile
   npm install
   ```

2. **Configure API URL**

   Copy `.env.example` to `.env` and set your API base URL:

   ```bash
   cp .env.example .env
   # Edit .env: set EXPO_PUBLIC_API_BASE to your API URL (e.g. https://api.example.com/api)
   ```

   For local development with the Laravel API:

   - iOS Simulator: `http://localhost:8000/api`
   - Android Emulator: `http://10.0.2.2:8000/api` (or your machine’s LAN IP)
   - Physical device: use your computer’s IP, e.g. `http://192.168.1.10:8000/api`

3. **Assets (optional)**

   Replace placeholder assets if needed:

   - `assets/icon.png` – app icon (1024×1024)
   - `assets/splash-icon.png` – splash screen image
   - `assets/adaptive-icon.png` – Android adaptive icon foreground

   The app will run with Expo defaults if these are missing; add them before production builds.

## Run

- **Start dev server**: `npm start`
- **iOS**: `npm run ios` (or press `i` in the terminal)
- **Android**: `npm run android` (or press `a` in the terminal)

## Project structure

- `app/` – Expo Router screens and layouts
  - `(auth)/` – login, register
  - `(tabs)/` – main tabs: Home, Categories, Resources, Search, Reading List, FAQs, Profile
  - Nested stacks for categories, resources, and FAQs (list + detail)
- `lib/api/` – API client and endpoint modules
  - `client.ts` – HTTP client, auth header, token refresh on 401
  - `endpoints/` – auth, categories, resources, faqs, search
- `store/` – auth state (Zustand) and secure token/user storage
- `constants/` – env and API config
- `types/` – shared API types

## Adding new API endpoints

1. **Define the endpoint** in `lib/api/endpoints/` (new file or existing, e.g. `notifications.ts`).
2. **Export it** from `lib/api/endpoints/index.ts`.
3. **Use it** in screens or hooks. The client automatically attaches the stored auth token and handles refresh on 401.

Example:

```ts
// lib/api/endpoints/notifications.ts
import { api } from "../client";
export const notificationsApi = {
  list: () => api.get("/notifications"),
};
```

```ts
// lib/api/endpoints/index.ts
export { notificationsApi } from "./notifications";
```

## Production build

- **iOS**: `eas build --platform ios` (requires EAS and Apple Developer account)
- **Android**: `eas build --platform android` (requires EAS and Google Play / keystore)

Configure `app.json` / `eas.json` for your bundle IDs and signing. See [Expo Application Services](https://docs.expo.dev/build/introduction/).

## API coverage

| Endpoint | Method | Screen / usage |
|----------|--------|----------------|
| `/register` | POST | Register screen |
| `/login` | POST | Login screen |
| `/token/refresh` | POST | Client (auto on 401) |
| `/profile` | GET / PUT | Profile tab |
| `/logout` | POST | Profile tab |
| `/categories` | GET | Home, Categories list |
| `/categories/{id}` | GET | Category detail |
| `/resources` | GET | Home, Resources list, Category detail |
| `/resources/{id}` | GET | Resource detail |
| `/resources/{id}/file` | GET | Resource detail (open file) |
| `/my-reading-list` | GET | Reading list tab |
| `/faqs` | GET | FAQs list |
| `/faqs/{id}` | GET | FAQ detail |
| `/search` | GET | Search tab (q, type) |
