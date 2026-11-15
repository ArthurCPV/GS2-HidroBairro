import { useNavigation } from '@react-navigation/native';
import { RoutePlaceholder } from '@/components/RoutePlaceholder';
import type { HomeTabNavigationProp } from '@/types/navigation';

export default function AlertsScreen() {
  const navigation = useNavigation<HomeTabNavigationProp<'Alerts'>>();

  return (
    <RoutePlaceholder
      title="Alertas"
      description="Os alertas gerados pela API Java serão consultados nesta tela."
      links={[
        {
          label: 'Abrir detalhe de demonstração',
          onPress: () => navigation.navigate('AlertDetails', { id: 'demo' }),
        },
      ]}
    />
  );
}
