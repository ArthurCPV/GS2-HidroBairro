import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/store/useTheme';
import type { HomeTabParamList } from '@/types/navigation';
import AIScreen from '@/screens/AI';
import AlertsScreen from '@/screens/Alerts';
import HomeScreen from '@/screens/Home';
import MapScreen from '@/screens/Map';
import RequestsScreen from '@/screens/Requests';

const Tab = createBottomTabNavigator<HomeTabParamList>();

export default function HomeNavigation() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarIcon: () => null,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.action,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Início' }}
      />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Mapa' }} />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ title: 'Alertas' }}
      />
      <Tab.Screen
        name="Guidance"
        component={AIScreen}
        options={{ title: 'Orientação' }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{ title: 'Solicitações' }}
      />
    </Tab.Navigator>
  );
}
