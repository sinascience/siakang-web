# Signing in under mocks — the one supported way

> **If you are a minor and you want to see your work in a browser, this is the whole procedure.**
> Do not invent another one. Three different bypasses were improvised before this
> existed, one of which required editing a hot file. That is what this replaces.

## The problem it solves

`AuthGuard` wraps every dashboard route. It needs a real session, and a session
needs `POST /core/v1/auth/signin` and `GET /core/v1/auth/me` to answer. With
`VITE_USE_MOCKS=true` only `/market/v1/*` used to be mocked, so `checkUserSession`
always failed and **no dashboard route could render at all** without a running
backend. Every minor that wanted a browser check hit this wall and climbed it
differently — a faked auth context, a temporarily patched `main.tsx`, a harness
mounting views outside the router.

`src/shared/lib/market-mock.ts` now mocks `/core/v1/auth/*` as well. You sign in
through the real sign-in page, against the real `AuthProvider`, and every guard,
route and persona behaves as it does in production.

## How to use it

1. Create `.env` **in your own worktree** (gitignored, never committed):

   ```
   VITE_SERVER_URL=http://localhost:8080
   VITE_USE_MOCKS=true
   ```

2. Start the dev server on **the port your task file assigns you**:
   `yarn dev --port 3000`. Never a bare `yarn dev` — it defaults to 8081, which
   is reserved for QA.

3. Go to `/auth/jwt/sign-in` and sign in as any seeded account. Password for all
   of them is `siakang123`, exactly as seeded.

| Login | Persona | Wallet | Use it for |
|---|---|---|---|
| `budi@siakang.test` | customer | Rp 5.000.000 | the main customer path — affords anything |
| `siti@siakang.test` | customer | Rp 100.000 | insufficient-balance on **purchases**; she *can* pay the 2.500 / 10.000 platform fees |
| `joko@siakang.test` | lapak | Rp 0 | the counterparty — owns the seeded three-tier gig |
| `sari@siakang.test` | lapak | Rp 0 | second lapak; farther away, rated higher (matching ties) |

These mirror the contract's `x-seed-data`, so what you see under mocks is what
the seeders produce.

## Switching persona mid-flow

Sign out and sign in as the other account. **Do not reload the page** if you care
about state you have built up: the mock's orders, payments and chat threads live
in module memory and are wiped by a reload, not by a sign-out. That is how you
walk a two-party flow — buy and pay as `budi@`, sign out, sign in as `joko@`, and
complete the order you just created.

## The badge

With mocks on, a red **"MOCK DATA — not the real backend"** bar is pinned to the
bottom of every page, and the console carries a matching warning. It is
deliberate: mocked data is realistic enough to pass for real, so a mocked run
must be impossible to mistake for a real one in a screenshot.

**Leave it alone.** From phase-3 QA on, the runbook checks for the banner's
*absence* as the positive signal that a run is against the real backend.

## What is mocked, and what that means for you

Mocked: `/core/v1/auth/{signin,refresh,me,logout}` and all of `/market/v1/*`
except the chat SSE stream.

**Not mocked: the SSE stream** (`GET /market/v1/chat/threads/{id}/stream`).
`EventSource` never goes through axios, so an axios adapter cannot intercept it.
Chat history and sending work under mocks; live delivery does not, and it is
first verified at phase QA against the real backend. Make the no-stream case
degrade gracefully rather than treating it as a bug.

## Rules

- **This is the only supported mechanism.** Do not fake the auth context, do not
  patch `main.tsx`, do not mount views outside the router to dodge `AuthGuard`.
- A throwaway harness **inside your own `allowed_paths`**, deleted before
  committing, is still fine for isolated component work. **Editing a hot file to
  enable one is not** — not temporarily, not even if you revert it. The Hot-File
  Protocol governs the act, not just what survives into the commit.
- Do not edit `market-mock.ts`. It is master-owned. If a fixture you need is
  missing, that is a Hot-File Protocol request to your master, and the answer is
  usually "yes, and I will add it" — ask rather than working around it.
- Never commit a `.env`.
