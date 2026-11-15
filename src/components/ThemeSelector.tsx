import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/store/useTheme';
import type { ThemeMode } from '@/styles/theme';

const options: { label: string; value: ThemeMode }[] = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Escuro', value: 'dark' },
];

export function ThemeSelector() {
  const { isReady, mode, setThemeMode, storageError, theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: theme.spacing.compact,
          padding: theme.spacing.element,
          borderRadius: theme.radius.control,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        label: {
          color: theme.colors.heading,
          fontSize: 15,
          fontWeight: '600',
        },
        options: {
          flexDirection: 'row',
          gap: 8,
        },
        option: {
          flex: 1,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 8,
          borderRadius: 10,
          backgroundColor: theme.colors.control,
        },
        selectedOption: {
          backgroundColor: theme.colors.actionSurface,
          borderWidth: 1,
          borderColor: theme.colors.action,
        },
        pressedOption: {
          opacity: 0.72,
        },
        optionText: {
          color: theme.colors.body,
          fontSize: 14,
          fontWeight: '600',
        },
        selectedOptionText: {
          color: theme.colors.action,
        },
        error: {
          color: theme.colors.error,
          fontSize: 14,
          lineHeight: 20,
          padding: 10,
          borderRadius: 8,
          backgroundColor: theme.colors.errorSurface,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Aparência</Text>
      <View style={styles.options}>
        {options.map(({ label, value }) => {
          const isSelected = mode === value;

          return (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected, disabled: !isReady }}
              disabled={!isReady}
              onPress={() => {
                void setThemeMode(value);
              }}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.selectedOption,
                pressed && styles.pressedOption,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {storageError && (
        <Text accessibilityRole="alert" style={styles.error}>
          {storageError}
        </Text>
      )}
    </View>
  );
}
