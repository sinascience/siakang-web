import type { NavSectionProps } from 'src/shared/ui/nav-section';
import type { NavItemDataProps } from 'src/shared/ui/nav-section/types';

import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/shared/config';
import { SvgColor } from 'src/shared/ui/svg-color';
import { usePermission } from 'src/module/core/features/auth/hooks/use-permission';

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
};

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

  return useMemo(() => {
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
  }, [t, can, canAny]);
}
