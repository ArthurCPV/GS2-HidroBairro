import { RoutePlaceholder } from '@/components/RoutePlaceholder';
import { APP_ROUTES } from '@/constants/routes';

export default function NewRequestScreen() {
  return (
    <RoutePlaceholder
      title="Nova solicitação"
      description="O formulário de zeladoria será implementado em uma etapa posterior."
      links={[
        { label: 'Voltar às solicitações', href: APP_ROUTES.requests },
      ]}
    />
  );
}
