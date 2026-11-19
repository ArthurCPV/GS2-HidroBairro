import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { SidebarTabBar } from '@/components/SidebarTabBar';
import { useAuth } from '@/store/AuthProvider';
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
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const isManager =
    session.status === 'authenticated' && session.user.role === 'GESTOR';
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <SidebarTabBar
          {...props}
          expanded={isSidebarExpanded}
          onSelectTab={() => {
            if (width < 720) {
              setIsSidebarExpanded(false);
            }
          }}
          onToggleExpanded={() =>
            setIsSidebarExpanded((isExpanded) => !isExpanded)
          }
        />
      )}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderRightColor: theme.colors.border,
        },
        tabBarPosition: 'left',
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
        options={{ title: isManager ? 'Painel' : 'Solicitações' }}
      />
    </Tab.Navigator>
  );
}
