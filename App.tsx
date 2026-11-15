import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AlertDetailsScreen from './src/screens/AlertDetails';
import NewRequestScreen from './src/screens/NewRequest';
import Home from './src/navigation/Home';
import { ThemeProvider } from './src/store/ThemeProvider';
import { useTheme } from './src/store/useTheme';
import type { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigation() {
  const { colorScheme, theme } = useTheme();
  const navigationTheme = useMemo(() => {
    const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: theme.colors.background,
        border: theme.colors.border,
        card: theme.colors.surface,
        notification: theme.colors.action,
        primary: theme.colors.action,
        text: theme.colors.heading,
      },
    };
  }, [colorScheme, theme]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          screenOptions={{
            contentStyle: { backgroundColor: theme.colors.background },
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.heading,
            headerTitleStyle: { fontWeight: '600' },
          }}
        >
          <Stack.Screen
            name="Main"
            component={Home}
            options={{ headerShown: false, title: 'Início' }}
          />
          <Stack.Screen
            name="AlertDetails"
            component={AlertDetailsScreen}
            options={{ title: 'Detalhe do alerta' }}
          />
          <Stack.Screen
            name="NewRequest"
            component={NewRequestScreen}
            options={{ title: 'Nova solicitação' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigation />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
