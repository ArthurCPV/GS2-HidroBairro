import { useNavigation } from '@react-navigation/native';
import { RoutePlaceholder } from '@/components/RoutePlaceholder';
import type { RootStackNavigationProp } from '@/types/navigation';

export default function AlertDetailsScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <RoutePlaceholder
      title="Detalhe do alerta"
      description="Esta rota receberá os dados do alerta selecionado."
      links={[
        {
          label: 'Voltar aos alertas',
          onPress: () => navigation.navigate('Main', { screen: 'Alerts' }),
        },
      ]}
    />
  );
}
