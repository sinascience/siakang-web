import { paths } from 'src/routes/paths';

import packageJson from '../../../package.json';

export type ConfigValue = {
  appName: string;
  appVersion: string;
  serverUrl: string;
  assetsDir: string;
  /**
   * Dev-only: serve `/market/v1/*` from the in-repo mock adapter instead of the
   * backend, so FE builds against the signed contract without waiting on BE.
   * Off in committed code; QA always runs it off (product ruling 2026-09-02).
   */
  useMocks: boolean;
  auth: {
    method: 'jwt';
    skip: boolean;
    redirectPath: string;
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
  };
};

export const CONFIG: ConfigValue = {
  appName: 'Tuai',
  appVersion: packageJson.version,
  serverUrl: import.meta.env.VITE_SERVER_URL ?? '',
  assetsDir: import.meta.env.VITE_ASSETS_DIR ?? '',
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  auth: {
    method: 'jwt',
    skip: false,
    redirectPath: paths.dashboard.root,
  },
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  },
};
