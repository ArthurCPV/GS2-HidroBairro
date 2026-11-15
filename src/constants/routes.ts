export const APP_ROUTES = {
  home: '/',
  map: '/map',
  alerts: '/alerts',
  guidance: '/guidance',
  requests: '/requests',
  newRequest: '/requests/new',
  alertDetails: (id: string) => ({
    pathname: '/alerts/[id]',
    params: { id },
  }),
} as const;
