import { useMemo, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/store/useTheme';
import { createGlobalStyles } from '@/styles/global';
import type { RouteLink } from '@/types';

type RoutePlaceholderProps = {
  title: string;
  description: string;
  links?: RouteLink[];
  children?: ReactNode;
};

export function RoutePlaceholder({
  title,
  description,
  links = [],
  children,
}: RoutePlaceholderProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 520 ? 16 : theme.spacing.page;
  const globalStyles = useMemo(
    () => createGlobalStyles(theme, horizontalPadding),
    [horizontalPadding, theme],
  );

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.screenContent}>
        <Text accessibilityRole="header" style={globalStyles.screenTitle}>
          {title}
        </Text>
        <Text style={globalStyles.screenDescription}>{description}</Text>
        {children}
        {links.length > 0 && (
          <View style={globalStyles.linkList}>
            {links.map(({ label, onPress }) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                onPress={onPress}
                style={({ pressed }) => [
                  globalStyles.link,
                  pressed && globalStyles.linkPressed,
                ]}
              >
                <Text style={globalStyles.linkText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
