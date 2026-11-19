import { StyleSheet } from 'react-native';
import type { AppTheme } from '@/styles/theme';

export function createGlobalStyles(
  theme: AppTheme,
  horizontalPadding = theme.spacing.page,
) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    screenContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: horizontalPadding,
      paddingVertical: theme.spacing.page,
      gap: theme.spacing.element,
    },
    screenTitle: {
      color: theme.colors.heading,
      fontSize: theme.typography.heading,
      fontWeight: '700',
    },
    screenDescription: {
      color: theme.colors.body,
      fontSize: theme.typography.body,
      lineHeight: theme.typography.bodyLine,
    },
    linkList: {
      gap: theme.spacing.compact,
      marginTop: 8,
    },
    link: {
      minHeight: 48,
      justifyContent: 'center',
      borderRadius: theme.radius.control,
      backgroundColor: theme.colors.actionSurface,
      paddingHorizontal: theme.spacing.element,
      paddingVertical: theme.spacing.compact,
    },
    linkPressed: {
      opacity: 0.7,
    },
    linkText: {
      color: theme.colors.action,
      fontSize: theme.typography.body,
      fontWeight: '600',
    },
  });
}
