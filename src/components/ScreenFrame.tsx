import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/store/useTheme';

type ScreenFrameProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function ScreenFrame({
  title,
  description,
  children,
}: ScreenFrameProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          flexGrow: 1,
          gap: theme.spacing.element,
          padding: theme.spacing.page,
          paddingBottom: theme.spacing.page * 1.5,
        },
        header: {
          gap: 6,
        },
        title: {
          color: theme.colors.heading,
          fontSize: theme.typography.heading,
          fontWeight: '700',
        },
        description: {
          color: theme.colors.body,
          fontSize: theme.typography.body,
          lineHeight: theme.typography.bodyLine,
        },
      }),
    [theme],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
