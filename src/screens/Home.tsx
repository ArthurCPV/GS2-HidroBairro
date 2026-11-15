import { useNavigation } from '@react-navigation/native';
import { DataSummary } from '@/components/DataSummary';
import { RoutePlaceholder } from '@/components/RoutePlaceholder';
import { ThemeSelector } from '@/components/ThemeSelector';
import type { HomeTabNavigationProp } from '@/types/navigation';

export default function HomeScreen() {
  const navigation = useNavigation<HomeTabNavigationProp<'Home'>>();

  return (
    <RoutePlaceholder
      title="HidroBairro Sul"
      description="Acompanhe alertas e pontos de monitoramento do piloto na Zona Sul de São Paulo."
      links={[
        { label: 'Abrir mapa', onPress: () => navigation.navigate('Map') },
        {
          label: 'Consultar alertas',
          onPress: () => navigation.navigate('Alerts'),
        },
        {
          label: 'Ver orientação',
          onPress: () => navigation.navigate('Guidance'),
        },
        {
          label: 'Minhas solicitações',
          onPress: () => navigation.navigate('Requests'),
        },
        {
          label: 'Nova solicitação',
          onPress: () => navigation.navigate('NewRequest'),
        },
      ]}
    >
      <DataSummary />
      <ThemeSelector />
    </RoutePlaceholder>
  );
}
