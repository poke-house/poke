# Poke House Training

An internal training and gamification platform for Poke House staff, designed to teach and test knowledge of ingredients, portions, recipe builds, and house-specific rules.

## Overview

The platform contains five interactive training and client-simulation modes:

1. **Bowl Training**: Practice making standard House and Green Bowls step-by-step.
2. **Custom Bowl**: Simulate a real-time customer interaction to craft custom bowls based on preferences.
3. **Rush Mode (Hora do Lodo)**: A fast-paced, high-pressure mode where players must assemble bowls accurately against a ticking timer.
4. **Quiz (Pensa Rápido)**: Test knowledge of portions, ingredients, liquids, and operational modes.
5. **University Bowl (University)**: Learn individual bowl builds at your own pace with visual cards.

---

## Tech Stack

The application is built on a modern, high-performance stack:

- **Frontend Framework**: [React 19](https://react.dev/)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (using native `@tailwindcss/vite` integration)
- **Database / Backend-as-a-Service**: [Supabase](https://supabase.com/)
- **Interactions & Effects**: [Canvas Confetti](https://github.com/catdad/canvas-confetti)

---

## Requirements

- **Node.js**: Recommended Active LTS version (`v18` or `v20+`)
- **Package Manager**: `npm` (configured with lockfile)

---

## Installation

To get a local development instance running:

1. Clone the repository to your local machine.
2. Install the workspace dependencies:
   ```bash
   npm install
   ```

---

## Environment Variables

Copy the example file to create your local environment variables configuration:
```bash
cp .env.example .env.local
```

Configure the following variables in your `.env.local`:

| Variable Name | Purpose | Required/Optional | Fail-safe Behavior |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | The endpoint URL of your Supabase project. | Optional (highly recommended) | If missing, the game runs fully offline-equivalent; ranking and leaderboard submission features are gracefully disabled. |
| `VITE_SUPABASE_ANON_KEY` | The anonymous API key for public client access. | Optional (highly recommended) | If missing, ranking and leaderboard submissions are gracefully disabled. |

*Note: The app is built with built-in fallbacks. Leaderboards will show a clean "Unavailable" message rather than crashing if credentials are omitted.*

---

## Local Development

Start the development server with HMR:
```bash
npm run dev
```
The server will boot, by default, on http://localhost:3000 or the next available port.

---

## Production Build

To build and compile a fully optimized production bundle:
```bash
npm run build
```
Vite will output the static assets into the `/dist` directory.

To preview the built production app locally:
```bash
npm run preview
```

---

## Supabase Setup

The leaderboard and Rush mode submission use Supabase for storage and ranking.

### Database Migrations
The SQL schema and RPC definitions are saved in two migration scripts located at the repository root:
1. `supabase_migration.sql`: Establishes the core table `rush_scores` and enables Row Level Security (RLS).
2. `supabase_migration_v2.sql`: Hardens database security. It drops direct anonymous insert permissions and installs the controlled `submit_rush_score` RPC function. This function validates inputs (trimming white space, collapsing duplicate spaces, checking name length limits, validating human-playable scores up to 1000 points, and enforcing unique transaction IDs to avoid duplicate submissions).

### Setup Instructions
1. Create a new project in your Supabase Dashboard.
2. Open the **SQL Editor** in Supabase and run the raw queries from `supabase_migration.sql` first, followed by `supabase_migration_v2.sql`.
3. Go to **Project Settings** > **API** to copy your Project URL and Anon Key.
4. Paste them as values in your `.env.local` file.

*Important: No direct table inserts are performed by the application. The frontend submits scores securely through the RPC function.*

---

## Project Structure

```text
├── components/
│   └── Modals.tsx                 # Popups (Changelog, Identification, Result Feedback)
├── features/
│   └── quiz/
│       └── QuizMode.tsx           # Extracted module containing the "Pensa Rápido" quiz loop
├── utils/
│   └── supabaseClient.ts          # Safe wrapper initializing the Supabase client
├── App.tsx                        # Main application controller, state manager, and UI container
├── translations.ts                # Locale dictionary for EN and default pt-PT (Portuguese from Portugal)
├── types.ts                       # Shared TypeScript types, interfaces, and structures
├── constants.ts                   # Centralized list of recipes, changelog items, and static definitions
├── index.css                      # Global styles importing Tailwind CSS v4
├── index.html                     # HTML root file
├── index.tsx                      # Mount entrypoint
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite bundler and Tailwind CSS plugins config
```

---

## Quality Checks

Ensure code style and TypeScript type coverage remain intact with:

- **Typecheck & Linter Check**:
  ```bash
  npm run lint
  ```
- **Production Compilation Check**:
  ```bash
  npm run build
  ```

---

## Troubleshooting

### 1. Leaderboard / Ranking displays "Unavailable"
This means the client is running without active Supabase credentials or the credentials in your `.env.local` are incorrect. The application will remain fully functional and playable offline-equivalent.

### 2. Styles are missing or failing to compile
Ensure you are using `npm install` and that `/index.css` correctly includes `@import "tailwindcss";` at the top. The Tailwind build is driven by the native `@tailwindcss/vite` plugin in `vite.config.ts`.

### 3. Scores fail to submit or trigger an API error
Make sure you have executed the `supabase_migration_v2.sql` file in your Supabase project. The server uses the `submit_rush_score` RPC function; direct insertions into the `rush_scores` table are disallowed by Row Level Security.

---

## Security Notes

1. **Environment Integrity**: Never commit `.env.local` or any environment files containing real keys.
2. **Restricted Privileges**: The Anonymous Key (`anon`) is public by design, but its permissions are restricted. It can only read from `rush_scores` and execute the secure `submit_rush_score` validation function.
3. **No Service Role Keys**: Never expose Supabase service role keys (`service_role`) in the client application.

---

## Planned Development

- **House Arena**: A planned multiplayer, real-time room-based training mode (under design/active development). Currently not implemented.
