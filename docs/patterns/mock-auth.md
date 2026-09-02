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
   `yarn dev --port 3000`.

   The default is now 3000, not 8081 — a bare `yarn dev` no longer takes QA's
   port. Still pass your assigned port explicitly when several minors run at
   once, or you will collide with each other. **QA starts with `yarn dev:qa`**,
   which pins 8081; never run that yourself.

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

## Switching persona mid-flow — READ THIS, the obvious way does not work

Sign out and sign in as the other account.

> **⚠️ Known defect (found 2026-09-02 by `fe-task-i2`, verified): signing out
> WIPES the mock's state.**
>
> An earlier version of this page told you to sign out rather than reload,
> "because a reload wipes the mock and a sign-out does not". **That was wrong.**
> `account-drawer.tsx`'s logout calls `signOut()` and then `router.refresh()`,
> which is `navigate(0)` — a real document reload. So a sign-out *is* a reload,
> and the orders, payments, bids, offers and chat threads you built up are gone
> with it. Three phase-4 minors were given that wrong guidance.

The mock's state lives in **module memory of one page context**. That means it
does not survive a reload, and it is **not shared between tabs** — two tabs are
two separate JavaScript contexts with two separate sets of fixtures. Signing in
as the other persona in a second tab gives you a second, empty world.

So, until this is fixed, to walk a two-party flow:

- **Do the setup and the cross-persona step in one page context.** Build what you
  need as the first persona, then switch without a document load.
- If you are using a throwaway harness inside your `allowed_paths`, an in-page
  persona swap is legitimate and is what previous minors did successfully.
- **Say in your report which persona steps you actually exercised** and which you
  could not. Do not describe a two-party flow as verified if the state was reset
  between the halves.

**Master follow-up, deliberately not done during the shutdown pause:** persist the
mock's state to `sessionStorage` so a reload and therefore a sign-out stops
destroying it. That is the real fix and it makes this whole section unnecessary.
Removing the old `?lapak` URL flag in favour of real sign-in is what exposed this
— the flag switched persona without a page load, which is exactly the property
that got lost.

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

## If you need a full-page view before your routes are wired

Your master wires routes after merge, so your pages have no URL yet. A throwaway
harness inside your own `allowed_paths`, composing the real `App` / `AuthGuard` /
`DashboardLayout` with a local `MemoryRouter`, is the accepted way to see them.
Delete it before committing.

One trap, found the hard way: **`GuestGuard` redirects with
`window.location.href` on a successful sign-in**, which throws away an
in-harness sign-in route. Sign in through the **real** app at
`/auth/jwt/sign-in` first, then navigate to your harness — `AuthProvider`
re-hydrates the session from storage and the harness comes up already
authenticated.

Prefer no harness at all where you can: with auth mocked, existing wired routes
often reach what you need with fewer moving parts.

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
