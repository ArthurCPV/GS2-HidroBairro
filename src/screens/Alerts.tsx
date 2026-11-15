import { RoutePlaceholder } from '@/components/RoutePlaceholder';
import { APP_ROUTES } from '@/constants/routes';

export default function AlertsScreen() {
  return (
    <RoutePlaceholder
      title="Alertas"
      description="Os alertas gerados pela API Java serão consultados nesta tela."
      links={[
        {
          label: 'Abrir detalhe de demonstração',
          href: APP_ROUTES.alertDetails('demo'),
        },
      ]}
    />
  );
}
