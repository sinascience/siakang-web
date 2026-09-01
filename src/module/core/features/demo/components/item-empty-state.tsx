import { useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { Iconify } from 'src/shared/ui/iconify';
import { MotionDialog } from 'src/shared/ui/animate';

// ----------------------------------------------------------------------
// Split-hero empty state:
//   left  → title · description · Create / Import actions
//   right → on-brand framed preview; clicking opens a short tour in a modal
//
// The tour video (a free, embeddable Creative Commons clip) is only loaded
// once the user clicks play — it never dominates the page by default.
// ----------------------------------------------------------------------

const VIDEO_EMBED_URL = 'https://www.youtube.com/embed/aqz-KE-bpKQ?autoplay=1&rel=0';

type Props = {
  onCreate: () => void;
  onImport: () => void;
  importing?: boolean;
  showVideo?: boolean;
};

export function ItemEmptyState({ onCreate, onImport, importing, showVideo = true }: Props) {
  const { t } = useTranslate('demo');
  const [videoOpen, setVideoOpen] = useState(false);

  const renderActions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: { xs: 'center', md: 'flex-start' } }}
    >
      <Button
        size="large"
        variant="contained"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={onCreate}
      >
        {t('emptyState.create')}
      </Button>

      <Button
        size="large"
        color="inherit"
        variant="outlined"
        startIcon={<Iconify icon="solar:import-bold" />}
        onClick={onImport}
        loading={importing}
      >
        {t('emptyState.import')}
      </Button>
    </Stack>
  );

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          alignItems: 'center',
          p: { xs: 3, md: 5 },
          gap: { xs: 4, md: 6 },
          gridTemplateColumns: { xs: '1fr', md: showVideo ? '1fr 1fr' : '1fr' },
        }}
      >
        <Stack
          spacing={2.5}
          sx={{
            maxWidth: 460,
            mx: { xs: 'auto', md: 0 },
            textAlign: { xs: 'center', md: 'left' },
            alignItems: { xs: 'center', md: 'flex-start' },
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              display: 'flex',
              borderRadius: 1.5,
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.1),
            }}
          >
            <Iconify icon="solar:inbox-in-bold-duotone" width={32} />
          </Box>

          <Typography variant="h4">{t('emptyState.title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('emptyState.description')}
          </Typography>

          {renderActions}
        </Stack>

        {showVideo && (
          <ButtonBase
            onClick={() => setVideoOpen(true)}
            aria-label={t('emptyState.watch')}
            sx={{
              width: 1,
              maxWidth: 460,
              mx: 'auto',
              aspectRatio: '16 / 9',
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: (theme) => `solid 1px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.16)}`,
              background: (theme) =>
                `linear-gradient(135deg, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.16)}, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.02)})`,
              transition: (theme) => theme.transitions.create(['box-shadow']),
              '&:hover': { boxShadow: (theme) => theme.vars.customShadows.z8 },
              '&:hover .play-btn': { transform: 'scale(1.08)' },
            }}
          >
            <Iconify
              icon="solar:inbox-in-bold-duotone"
              sx={{ position: 'absolute', width: 150, height: 150, color: 'primary.main', opacity: 0.14 }}
            />

            <Box
              className="play-btn"
              sx={{
                display: 'flex',
                borderRadius: '50%',
                color: 'primary.main',
                bgcolor: 'common.white',
                transition: (theme) => theme.transitions.create(['transform']),
                boxShadow: (theme) => theme.vars.customShadows.z8,
              }}
            >
              <Iconify icon="solar:play-circle-bold" width={56} />
            </Box>

            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: 10,
                px: 1,
                py: 0.25,
                borderRadius: 0.75,
                fontWeight: 'fontWeightSemiBold',
                color: 'common.white',
                bgcolor: (theme) => varAlpha(theme.vars.palette.grey['900Channel'], 0.64),
              }}
            >
              {t('emptyState.tourBadge')}
            </Typography>
          </ButtonBase>
        )}
      </Box>

      <MotionDialog
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { sx: { overflow: 'hidden' } } }}
      >
        <Box sx={{ position: 'relative', aspectRatio: '16 / 9', bgcolor: 'common.black' }}>
          <IconButton
            onClick={() => setVideoOpen(false)}
            sx={{
              top: 8,
              right: 8,
              zIndex: 9,
              position: 'absolute',
              color: 'common.white',
              bgcolor: (theme) => varAlpha(theme.vars.palette.grey['900Channel'], 0.48),
              '&:hover': { bgcolor: (theme) => varAlpha(theme.vars.palette.grey['900Channel'], 0.72) },
            }}
          >
            <Iconify icon="mingcute:close-line" width={18} />
          </IconButton>

          {videoOpen && (
            <Box
              component="iframe"
              src={VIDEO_EMBED_URL}
              title={t('emptyState.videoTitle')}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sx={{ position: 'absolute', inset: 0, width: 1, height: 1, border: 0 }}
            />
          )}
        </Box>
      </MotionDialog>
    </>
  );
}
