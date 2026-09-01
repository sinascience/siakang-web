// ----------------------------------------------------------------------
// Marketplace personas.
//
// SIAKANG's `/market/v1/*` surface is deliberately NOT company-scoped
// (product ruling 2026-09-02, see siakang-api docs/architecture/
// market-tenancy-deviation.md), so a customer or lapak legitimately has no
// company — for all of them, always.
//
// The skeleton this app is built on assumes the opposite: several places treat
// `authenticated && !company` as "half-signed-in, block the UI until they pick
// a company". That is right for a tenant user and wrong for every marketplace
// persona, so each of those guards needs the same exemption.
//
// It lives here rather than inside any one guard because it was previously
// applied in exactly one place (the auth provider's company-resolution path)
// and missed in two others, which blanked every dashboard route for every
// seeded persona — phase-1 QA, FE-A.1 / FE-H.1 / FE-H.2. One predicate, one
// place to fix, and the next guard that gates on a company has something to
// call instead of re-deriving it.
// ----------------------------------------------------------------------

const MARKET_ROLES = ['customer', 'lapak'];

/** True when the signed-in user is a marketplace persona, which never has a company. */
export function isMarketPersona(roles: string[]): boolean {
  return roles.some((role) => MARKET_ROLES.includes(role));
}

/**
 * True when a missing company should actually block the UI.
 *
 * Use this instead of a bare `authenticated && !company`: a marketplace persona
 * has no company by design and must not be treated as an incomplete signup.
 */
export function needsCompanyOnboarding(
  authenticated: boolean,
  company: unknown,
  roles: string[]
): boolean {
  return authenticated && !company && !isMarketPersona(roles);
}
