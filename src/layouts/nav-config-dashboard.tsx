import type { NavSectionProps } from 'src/shared/ui/nav-section';
import type { NavItemDataProps } from 'src/shared/ui/nav-section/types';

import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';
import { SvgColor } from 'src/shared/ui/svg-color';
import { usePermission } from 'src/module/core/features/auth/hooks/use-permission';
import { useAuthContext } from 'src/module/core/features/auth/hooks/use-auth-context';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  home: icon('ic-dashboard'),
  finance: icon('ic-banking'),
  monitoring: icon('ic-analytics'),
  sales: icon('ic-ecommerce'),
  demoItem: icon('ic-menu-item'),
  demoOrder: icon('ic-order'),
  wallet: icon('ic-banking'),
  chat: icon('ic-chat'),
  orders: icon('ic-order'),
};

// SIAKANG marketplace personas. A marketplace user gets the market shell
// instead of the Tuai back-office nav — they have no company, and none of the
// back-office screens apply to them.
const MARKET_ROLES = ['customer', 'lapak'];

// ----------------------------------------------------------------------

/**
 * Recursively filter nav items by the user's permissions.
 *
 * Rules:
 * - If item has no `permission` / `permissionAny`, it stays.
 * - Leaf with `permission`: drop if user can't read.
 * - Parent with `children`: filter children first; drop parent if no child remains
 *   (unless it has its own gate that the user passes).
 */
function filterNav(
  items: NavItemDataProps[],
  can: (k: string) => boolean,
  canAny: (k: string[]) => boolean
): NavItemDataProps[] {
  return items
    .map((item): NavItemDataProps | null => {
      const hasGate = !!item.permission || !!item.permissionAny;
      const passesGate =
        !hasGate ||
        (item.permission ? can(item.permission) : false) ||
        (item.permissionAny ? canAny(item.permissionAny) : false);

      if (item.children && item.children.length > 0) {
        const filteredChildren = filterNav(item.children, can, canAny);
        if (filteredChildren.length === 0) {
          // Hide parent if no children survive AND it doesn't have its own
          // standalone permission that the user passes
          return passesGate && hasGate ? { ...item, children: undefined } : null;
        }
        return { ...item, children: filteredChildren };
      }

      return passesGate ? item : null;
    })
    .filter((it): it is NavItemDataProps => it !== null);
}

// ----------------------------------------------------------------------

export function useNavData(): NavSectionProps['data'] {
  const { t } = useTranslate('navigation');
  const { can, canAny } = usePermission();
  const { roles, lapak } = useAuthContext();

  const isMarketUser = roles.some((role) => MARKET_ROLES.includes(role));
  // `lapak` is non-null only for a lapak account (GET /market/v1/me), so it is
  // the authoritative persona signal; roles alone would also match a customer.
  const isLapak = !!lapak;

  return useMemo(() => {
    if (isMarketUser) {
      // Marketplace nav is not permission-gated: /market/v1/* runs JWTAuth()
      // only, so `permissions` is empty for these users by design.
      return [
        {
          subheader: isLapak ? t('market.lapak') : t('market.customer'),
          items: [
            {
              title: t('market.orders'),
              path: paths.dashboard.market.orders,
              icon: ICONS.orders,
            },
            {
              title: t('market.chat'),
              path: paths.dashboard.market.chat,
              icon: ICONS.chat,
            },
            {
              title: t('market.wallet'),
              path: paths.dashboard.market.wallet,
              icon: ICONS.wallet,
            },
          ],
        },
      ];
    }

    const sections: NavSectionProps['data'] = [
      {
        items: [
          {
            title: t('home'),
            path: paths.dashboard.root,
            icon: ICONS.home,
          },
          {
            title: t('dashboards.finance'),
            path: paths.dashboard.dashboards.finance,
            icon: ICONS.finance,
          },
          {
            title: t('dashboards.monitoring'),
            path: paths.dashboard.dashboards.monitoring,
            icon: ICONS.monitoring,
          },
          {
            title: t('dashboards.sales'),
            path: paths.dashboard.dashboards.sales,
            icon: ICONS.sales,
          },
        ],
      },
      {
        subheader: t('demo.root'),
        items: [
          {
            title: t('demo.item'),
            path: paths.dashboard.demo.item,
            icon: ICONS.demoItem,
          },
          {
            title: t('demo.itemEmpty'),
            path: paths.dashboard.demo.itemEmpty,
            icon: ICONS.demoItem,
          },
          {
            title: t('demo.order'),
            path: paths.dashboard.demo.order,
            icon: ICONS.demoOrder,
          },
        ],
      },
    ];

    // Apply permission filter to each section, then drop empty sections
    return sections
      .map((section) => ({ ...section, items: filterNav(section.items, can, canAny) }))
      .filter((section) => section.items.length > 0);
  }, [t, can, canAny, isMarketUser, isLapak]);
}
