export type ApiEnvelope<T> = {
  data: T | null;
  message: string;
  meta: unknown | null;
  // `/core/v1/*` sends a plain string; the SIAKANG contract pins
  // map<string, string[]> with `detail` reserved for non-field errors.
  errors: string | Record<string, string[]> | null;
};

export type User = {
  id: string;
  email: string;
  username: string;
  full_name: string;
};

export type Company = {
  id: string;
  name: string;
};

export type Client = {
  id: string;
  slug: string;
  name: string;
};

export type CompanyType = 'holding' | 'subsidiary';

export type CompanyMembership = {
  id: string;
  name: string;
  type: CompanyType;
  logo_url: string | null;
  parent_id: string | null;
  is_primary: boolean;
  is_owner: boolean;
  role_name: string | null;
  role_code: string | null;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
};

export type SignInResponse = TokenPair & {
  user: User;
  company: Company | null;
  client: Client | null;
  roles: string[];
  permissions: string[];
};

export type SignUpResponse = {
  message: string;
  user: User;
  company: Company;
};

export type GoogleSignInParams = {
  id_token: string;
};

export type GoogleSignInResponse = SignInResponse & {
  is_new_user: boolean;
};

export type SwitchCompanyResponse = TokenPair & {
  company: Company;
  roles: string[];
  permissions: string[];
};

export type MeResponse = {
  user: User;
  company: Company | null;
  client: Client | null;
  roles: string[];
  permissions: string[];
  is_super_admin: boolean;
};

/**
 * SIAKANG marketplace identity. Core `/auth/me` performs no join into the
 * `market` schema (product ruling 2026-09-02), so lapak identity comes from
 * `GET /market/v1/me` — fetched once at session start, never per screen.
 */
export type LapakProfile = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  lat?: number;
  lng?: number;
  rating: number;
  is_available: boolean;
};

export type MarketMe = {
  /** Non-null means the caller is a lapak; null means a customer. */
  lapak: LapakProfile | null;
};

export type AuthState = {
  loading: boolean;
  user: User | null;
  company: Company | null;
  client: Client | null;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  // Bumped every time the active company changes so data-fetching hooks can
  // depend on it to refetch after a company switch.
  companyVersion: number;
  // Marketplace identity, hydrated once from GET /market/v1/me. Null for a
  // customer (and for any non-marketplace user).
  lapak: LapakProfile | null;
};

export type SignInParams = {
  login: string;
  password: string;
};

export type SignUpParams = {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  phone?: string;
  company_name: string;
};

export type AuthContextValue = AuthState & {
  authenticated: boolean;
  unauthenticated: boolean;
  signIn: (params: SignInParams) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  signInWithGoogle: () => Promise<{ isNewUser: boolean }>;
  signOut: (options?: { allDevices?: boolean }) => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
  checkUserSession: () => Promise<void>;
};
