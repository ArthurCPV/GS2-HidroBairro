import { useNavigation } from '@react-navigation/native';
import { RoutePlaceholder } from '@/components/RoutePlaceholder';
import type { HomeTabNavigationProp } from '@/types/navigation';

export default function RequestsScreen() {
  const navigation = useNavigation<HomeTabNavigationProp<'Requests'>>();

  return (
    <RoutePlaceholder
      title="Solicitações"
      description="A abertura e o acompanhamento de solicitações de zeladoria serão implementados nesta área."
      links={[
        {
          label: 'Nova solicitação',
          onPress: () => navigation.navigate('NewRequest'),
        },
      ]}
    />
  );
}
