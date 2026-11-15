import { useNavigation } from '@react-navigation/native';
import { RoutePlaceholder } from '@/components/RoutePlaceholder';
import type { RootStackNavigationProp } from '@/types/navigation';

export default function NewRequestScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <RoutePlaceholder
      title="Nova solicitação"
      description="O formulário de zeladoria será implementado em uma etapa posterior."
      links={[
        {
          label: 'Voltar às solicitações',
          onPress: () => navigation.navigate('Main', { screen: 'Requests' }),
        },
      ]}
    />
  );
}
