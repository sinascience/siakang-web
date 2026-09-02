import type { ButtonProps } from '@mui/material/Button';

import { useCallback } from 'react';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/module/core/features/auth/hooks';

type Props = ButtonProps & {
  onClose?: () => void;
};

export function SignOutButton({ onClose, sx, ...other }: Props) {
  const router = useRouter();
  const { signOut } = useAuthContext();

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      onClose?.();
      // SPA navigation, not router.refresh() — see account-drawer.tsx.
      router.replace(paths.auth.jwt.signIn);
    } catch (error) {
      console.error(error);
    }
  }, [signOut, onClose, router]);

  return (
    <Button
      fullWidth
      variant="soft"
      size="large"
      color="error"
      onClick={handleLogout}
      sx={sx}
      {...other}
    >
      Logout
    </Button>
  );
}
