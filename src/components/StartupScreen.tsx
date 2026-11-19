import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@/store/useTheme';

export function StartupScreen() {
  const { theme } = useTheme();
  const [pulse] = useState(() => new Animated.Value(1));
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          padding: theme.spacing.page,
          backgroundColor: theme.colors.background,
        },
        brandMark: {
          width: 144,
          height: 144,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 44,
          backgroundColor: theme.colors.actionSurface,
        },
        brandImage: {
          width: 100,
          height: 100,
          tintColor: theme.colors.action,
        },
        title: {
          color: theme.colors.heading,
          fontSize: 32,
          fontWeight: '800',
          letterSpacing: -0.8,
        },
        subtitle: {
          maxWidth: 280,
          color: theme.colors.body,
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'center',
        },
        loading: {
          position: 'absolute',
          bottom: 52,
          alignItems: 'center',
          gap: 10,
        },
        loadingText: {
          color: theme.colors.muted,
          fontSize: 13,
        },
      }),
    [theme],
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.screen}>
      <Animated.View
        accessibilityLabel="Imagem provisória da marca HidroBairro"
        style={[styles.brandMark, { transform: [{ scale: pulse }] }]}
      >
        <Image
          accessibilityElementsHidden
          importantForAccessibility="no"
          resizeMode="contain"
          source={require('../../assets/splash-icon.png')}
          style={styles.brandImage}
        />
      </Animated.View>
      <Text accessibilityRole="header" style={styles.title}>
        HidroBairro
      </Text>
      <Text style={styles.subtitle}>
        Informação e cuidado para bairros mais preparados.
      </Text>
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.action} size="small" />
        <Text style={styles.loadingText}>Preparando seu espaço...</Text>
      </View>
    </View>
  );
}
