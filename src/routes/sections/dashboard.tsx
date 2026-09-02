import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { CONFIG } from 'src/shared/config';
import { PERM } from 'src/shared/lib/permissions';
import { DashboardLayout } from 'src/layouts/dashboard';
import { LoadingScreen } from 'src/shared/ui/loading-screen';
import { AuthGuard, PermissionGuard } from 'src/module/core/features/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const HomePage = lazy(() => import('src/module/core/features/home/pages'));

const FinanceDashboardPage = lazy(() => import('src/module/dashboard/features/finance/pages'));
const MonitoringDashboardPage = lazy(
  () => import('src/module/dashboard/features/monitoring/pages')
);
const SalesDashboardPage = lazy(() => import('src/module/dashboard/features/sales/pages'));

const BranchesListPage = lazy(() => import('src/module/core/features/branches/pages/list'));
const RolesListPage = lazy(() => import('src/module/core/features/roles/pages/list'));
const UsersListPage = lazy(() => import('src/module/core/features/users/pages/list'));
const TranslationOverridePage = lazy(
  () => import('src/module/core/features/translation-override/pages/list')
);

const WalletPage = lazy(() => import('src/module/market/features/wallet/pages'));
const AutoBidListPage = lazy(() => import('src/module/market/features/bids/auto/pages/list'));
const AutoBidDetailPage = lazy(() => import('src/module/market/features/bids/auto/pages/detail'));
const LapakBidsPage = lazy(() => import('src/module/market/features/bids/lapak/pages/list'));
const GigsListPage = lazy(() => import('src/module/market/features/gigs/pages/list'));
const GigDetailPage = lazy(() => import('src/module/market/features/gigs/pages/detail'));
const CatalogListPage = lazy(() => import('src/module/market/features/catalog/pages/list'));
const ProductDetailPage = lazy(() => import('src/module/market/features/catalog/pages/detail'));
const OrdersListPage = lazy(() => import('src/module/market/features/orders/pages/list'));
const OrderDetailPage = lazy(() => import('src/module/market/features/orders/pages/detail'));
const ChatListPage = lazy(() => import('src/module/market/features/chat/pages/list'));
const ChatThreadPage = lazy(() => import('src/module/market/features/chat/pages/thread'));

const DemoItemPage = lazy(() => import('src/module/core/features/demo/pages/list'));
const DemoItemEmptyPage = lazy(() => import('src/module/core/features/demo/pages/list-empty'));
const DemoOrderPage = lazy(() => import('src/module/core/features/demo-order/pages/list'));
const DemoOrderDetailPage = lazy(() => import('src/module/core/features/demo-order/pages/detail'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

function gated(require: string | string[], element: React.ReactElement) {
  return (
    <PermissionGuard require={require} showForbidden>
      {element}
    </PermissionGuard>
  );
}

export const dashboardRoutes: RouteObject[] = [
  {
    path: '/',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      { element: <HomePage />, index: true },
      { path: 'dashboards/finance', element: <FinanceDashboardPage /> },
      { path: 'dashboards/monitoring', element: <MonitoringDashboardPage /> },
      { path: 'dashboards/sales', element: <SalesDashboardPage /> },
      { path: 'settings/branches', element: gated(PERM.branches.read, <BranchesListPage />) },
      { path: 'settings/roles', element: gated(PERM.roles.read, <RolesListPage />) },
      {
        path: 'settings/users',
        element: gated(PERM.userManagement.read, <UsersListPage />),
      },
      {
        path: 'settings/translation-override',
        element: gated(PERM.translationOverrides.read, <TranslationOverridePage />),
      },
      // SIAKANG marketplace. Not wrapped in PermissionGuard: /market/v1/* runs
      // JWTAuth() only, so `permissions` is empty for marketplace users by design.
      { path: 'market/wallet', element: <WalletPage /> },
      { path: 'market/bids/auto', element: <AutoBidListPage /> },
      { path: 'market/bids/auto/:id', element: <AutoBidDetailPage /> },
      { path: 'market/bids/lapak', element: <LapakBidsPage /> },
      { path: 'market/gigs', element: <GigsListPage /> },
      { path: 'market/gigs/:id', element: <GigDetailPage /> },
      { path: 'market/catalog', element: <CatalogListPage /> },
      { path: 'market/catalog/:id', element: <ProductDetailPage /> },
      { path: 'market/orders', element: <OrdersListPage /> },
      { path: 'market/orders/:id', element: <OrderDetailPage /> },
      { path: 'market/chat', element: <ChatListPage /> },
      { path: 'market/chat/:id', element: <ChatThreadPage /> },
      { path: 'demo/item', element: <DemoItemPage /> },
      { path: 'demo/item-empty', element: <DemoItemEmptyPage /> },
      { path: 'demo/order', element: <DemoOrderPage /> },
      { path: 'demo/order/:id', element: <DemoOrderDetailPage /> },
    ],
  },
];
