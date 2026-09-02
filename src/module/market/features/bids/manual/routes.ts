// ----------------------------------------------------------------------
// Local path constants. `src/routes/paths.ts` is master-owned (Hot-File
// Protocol) and not wired for this feature yet — see task file FE-F
// "Routing — do NOT wire it yourself". These are only used for in-feature
// navigation (list -> detail, detail -> list) and mirror the shape reported
// to the master for `src/routes/paths.ts` + `src/routes/sections/dashboard.tsx`.
// ----------------------------------------------------------------------

export const MANUAL_BID_LIST_PATH = '/market/bids/manual';

export const manualBidDetailPath = (id: string) => `/market/bids/manual/${id}`;
