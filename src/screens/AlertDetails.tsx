import { RoutePlaceholder } from '@/components/RoutePlaceholder';
import { APP_ROUTES } from '@/constants/routes';

export default function AlertDetailsScreen() {
  return (
    <RoutePlaceholder
      title="Detalhe do alerta"
      description="Esta rota receberá os dados do alerta selecionado."
      links={[
        { label: 'Voltar aos alertas', href: APP_ROUTES.alerts },
      ]}
    />
  );
}
