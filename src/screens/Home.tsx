import { RoutePlaceholder } from '@/components/RoutePlaceholder';
import { APP_ROUTES } from '@/constants/routes';

export default function HomeScreen() {
  return (
    <RoutePlaceholder
      title="HidroBairro Sul"
      description="Estrutura inicial do aplicativo para o piloto da Zona Sul de São Paulo."
      links={[
        { label: 'Abrir mapa', href: APP_ROUTES.map },
        { label: 'Consultar alertas', href: APP_ROUTES.alerts },
        { label: 'Ver orientação', href: APP_ROUTES.guidance },
        { label: 'Minhas solicitações', href: APP_ROUTES.requests },
        { label: 'Nova solicitação', href: APP_ROUTES.newRequest },
      ]}
    />
  );
}
