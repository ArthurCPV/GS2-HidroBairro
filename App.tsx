import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StartupScreen } from './src/components/StartupScreen';
import AuthScreen from './src/screens/Auth';
import AlertDetailsScreen from './src/screens/AlertDetails';
import NewRequestScreen from './src/screens/NewRequest';
import RequestDetailsScreen from './src/screens/RequestDetails';
import Home from './src/navigation/Home';
import { AuthProvider, useAuth } from './src/store/AuthProvider';
import { ThemeProvider } from './src/store/ThemeProvider';
import { useTheme } from './src/store/useTheme';
import type { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigation() {
  const { colorScheme, isReady, theme } = useTheme();
  const { session } = useAuth();
  const [hasCompletedStartup, setHasCompletedStartup] = useState(false);
  const appIsReady = isReady && session.status !== 'loading';
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

  useEffect(() => {
    if (!appIsReady) {
      return;
    }

    const timeout = setTimeout(() => setHasCompletedStartup(true), 1800);
    return () => clearTimeout(timeout);
  }, [appIsReady]);

  if (!appIsReady || !hasCompletedStartup) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <StartupScreen />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          key={
            session.status === 'authenticated' ? 'app' : 'auth'
          }
          screenOptions={{
            contentStyle: { backgroundColor: theme.colors.background },
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.heading,
            headerTitleStyle: { fontWeight: '600' },
          }}
        >
          {session.status === 'authenticated' ? (
            <>
              <Stack.Screen
                name="Main"
                component={Home}
                options={{ headerShown: false, title: 'Início' }}
              />
              <Stack.Screen
                name="AlertDetails"
                component={AlertDetailsScreen}
                options={{ headerShown: false, title: 'Detalhe do alerta' }}
              />
              <Stack.Screen
                name="NewRequest"
                component={NewRequestScreen}
                options={{ headerShown: false, title: 'Nova solicitação' }}
              />
              <Stack.Screen
                name="RequestDetails"
                component={RequestDetailsScreen}
                options={{
                  headerShown: false,
                  title: 'Detalhe da solicitação',
                }}
              />
            </>
          ) : (
            <Stack.Screen
              name="Authentication"
              component={AuthScreen}
              options={{ headerShown: false, title: 'Acessar' }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigation />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
