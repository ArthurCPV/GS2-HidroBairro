import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { ThemeContext } from '@/store/useTheme';
import { themes, type ThemeMode } from '@/styles/theme';

const THEME_STORAGE_KEY = '@hidrobairro/theme-mode';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme() ?? 'light';
  const [mode, setMode] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadThemePreference() {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isMounted && isThemeMode(savedMode)) {
          setMode(savedMode);
        }
      } catch (error) {
        console.error('Unable to load the saved theme preference.', error);
        if (isMounted) {
          setStorageError('A preferência de aparência não pôde ser carregada.');
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void loadThemePreference();
    return () => {
      isMounted = false;
    };
  }, []);

  const colorScheme = mode === 'system' ? systemColorScheme : mode;
  const theme = themes[colorScheme];

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Appearance.setColorScheme(mode === 'system' ? 'auto' : colorScheme);
    }
  }, [colorScheme, mode]);

  const setThemeMode = useCallback(async (nextMode: ThemeMode) => {
    setMode(nextMode);
    setStorageError(null);

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (error) {
      console.error('Unable to save the theme preference.', error);
      setStorageError('A preferência mudou, mas não pôde ser salva neste aparelho.');
    }
  }, []);

  const value = useMemo(
    () => ({ colorScheme, isReady, mode, setThemeMode, storageError, theme }),
    [colorScheme, isReady, mode, setThemeMode, storageError, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
