// ----------------------------------------------------------------------
// `src/routes/paths.ts` has no gig entry yet — routes are wired by fe-master
// after merge, and that file is outside this task's allowed_paths. These two
// literals are the only place the gig URLs are spelled out; swap them for
// `paths.dashboard.market.gigs` / `.gig(id)` once they exist.
// ponytail: two constants beat a duplicated string literal in three files.
// ----------------------------------------------------------------------

export const GIG_PATHS = {
  list: '/market/gigs',
  detail: (id: string) => `/market/gigs/${id}`,
};
