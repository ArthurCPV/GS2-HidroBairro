import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/store/useTheme';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function ActionButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: ActionButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: theme.spacing.element,
          paddingVertical: 10,
          borderRadius: theme.radius.control,
        },
        primary: {
          backgroundColor: theme.colors.actionSurface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        secondary: {
          backgroundColor: theme.colors.actionSurface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        danger: {
          backgroundColor: theme.colors.errorSurface,
          borderWidth: 1,
          borderColor: theme.colors.error,
        },
        pressed: {
          opacity: 0.75,
        },
        disabled: {
          opacity: 0.55,
        },
        primaryText: {
          color: theme.colors.action,
        },
        secondaryText: {
          color: theme.colors.action,
        },
        dangerText: {
          color: theme.colors.error,
        },
        text: {
          fontSize: 15,
          fontWeight: '700',
          textAlign: 'center',
        },
      }),
    [theme],
  );
  const variantStyle =
    variant === 'primary'
      ? styles.primary
      : variant === 'danger'
        ? styles.danger
        : styles.secondary;
  const textStyle =
    variant === 'primary'
      ? styles.primaryText
      : variant === 'danger'
        ? styles.dangerText
        : styles.secondaryText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </Pressable>
  );
}
