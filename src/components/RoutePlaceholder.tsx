import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '@/styles/global';
import type { RouteLink } from '@/types';

type RoutePlaceholderProps = {
  title: string;
  description: string;
  links?: RouteLink[];
};

export function RoutePlaceholder({
  title,
  description,
  links = [],
}: RoutePlaceholderProps) {
  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.screenContent}>
        <Text accessibilityRole="header" style={globalStyles.screenTitle}>
          {title}
        </Text>
        <Text style={globalStyles.screenDescription}>{description}</Text>
        {links.length > 0 && (
          <View style={globalStyles.linkList}>
            {links.map(({ label, href }) => (
              <Link key={label} href={href} asChild>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    globalStyles.link,
                    pressed && globalStyles.linkPressed,
                  ]}
                >
                  <Text style={globalStyles.linkText}>{label}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
