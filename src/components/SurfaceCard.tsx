import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/store/useTheme';

export function SurfaceCard({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const style = useMemo(
    () =>
      StyleSheet.create({
        card: {
          gap: theme.spacing.compact,
          padding: theme.spacing.element,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.control,
          backgroundColor: theme.colors.surface,
        },
      }).card,
    [theme],
  );

  return <View style={style}>{children}</View>;
}
