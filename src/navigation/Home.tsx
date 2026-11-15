import { Tabs } from 'expo-router';

export default function HomeNavigation() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="map" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alertas' }} />
      <Tabs.Screen name="guidance" options={{ title: 'Orientação' }} />
      <Tabs.Screen name="requests" options={{ title: 'Solicitações' }} />
    </Tabs>
  );
}
