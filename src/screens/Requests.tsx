import { RoutePlaceholder } from '@/components/RoutePlaceholder';
import { APP_ROUTES } from '@/constants/routes';

export default function RequestsScreen() {
  return (
    <RoutePlaceholder
      title="Solicitações"
      description="A abertura e o acompanhamento de solicitações de zeladoria serão implementados nesta área."
      links={[
        { label: 'Nova solicitação', href: APP_ROUTES.newRequest },
      ]}
    />
  );
}
