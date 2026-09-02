// ----------------------------------------------------------------------
// Local navigation paths — NOT `src/routes/paths.ts`. That file, and
// `src/routes/sections/dashboard.tsx`, are hot files the master wires after
// merge (see task file "Routing — do NOT wire it yourself"). These exist only
// so the list/detail views can navigate between each other before that
// happens.
//
// Requested wiring (matches the `/market/orders`, `/market/orders/:id`
// convention already in paths.ts):
//   list   /market/bids/auto      -> src/module/market/features/bids/auto/pages/list.tsx
//   detail /market/bids/auto/:id  -> src/module/market/features/bids/auto/pages/detail.tsx (id via useParams())
// ----------------------------------------------------------------------

export const autoBidPaths = {
  list: '/market/bids/auto',
  detail: (id: string) => `/market/bids/auto/${id}`,
};
