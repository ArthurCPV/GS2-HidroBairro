import { createContext, useContext } from 'react';
import type { AppTheme, ColorScheme, ThemeMode } from '@/styles/theme';

export type ThemeContextValue = {
  colorScheme: ColorScheme;
  isReady: boolean;
  mode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  storageError: string | null;
  theme: AppTheme;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }

  return context;
}
