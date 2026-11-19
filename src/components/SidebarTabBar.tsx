
import { useEffect, useMemo, useState } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '@/store/useTheme';

type SidebarTabBarProps = BottomTabBarProps & {
  expanded: boolean;
  onToggleExpanded: () => void;
  onSelectTab: () => void;
};

const TAB_ICONS: Record<string, string> = {
  Home: '⌂',
  Map: '◎',
  Alerts: '!',
  Guidance: '✳',
  Requests: '▤',
};

export function SidebarTabBar({
  state,
  descriptors,
  navigation,
  insets,
  expanded,
  onToggleExpanded,
  onSelectTab,
}: SidebarTabBarProps) {
  const { theme, colorScheme, setThemeMode, isReady } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  const [sidebarWidth] = useState(() => new Animated.Value(64));

  const [themeTransition] = useState(
    () => new Animated.Value(colorScheme === 'dark' ? 1 : 0),
  );

  const expandedWidth = Math.min(208, Math.max(164, windowWidth * 0.42));

  const labelWidth = sidebarWidth.interpolate({
    inputRange: [64, expandedWidth],
    outputRange: [0, expandedWidth - 64],
    extrapolate: 'clamp',
  });

  const labelOpacity = sidebarWidth.interpolate({
    inputRange: [64, Math.min(expandedWidth, 120), expandedWidth],
    outputRange: [0, 0.18, 1],
    extrapolate: 'clamp',
  });

  const labelOffset = sidebarWidth.interpolate({
    inputRange: [64, expandedWidth],
    outputRange: [-8, 0],
    extrapolate: 'clamp',
  });

  const overlayOpacity = sidebarWidth.interpolate({
    inputRange: [64, expandedWidth],
    outputRange: [0, 0.45],
    extrapolate: 'clamp',
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        host: {
          width: 64,
          flexGrow: 0,
          flexShrink: 0,
          zIndex: 10,
          elevation: 10,
        },

        overlay: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 64,
          right: -(windowWidth - 64),
          backgroundColor: '#000',
          zIndex: 1,
        },

        sidebar: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          overflow: 'hidden',
          paddingHorizontal: 8,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 12),
          borderRightWidth: 1,
          borderRightColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          zIndex: 2,
          elevation: 12,
        },

        top: {
          minHeight: 50,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          marginBottom: 22,
        },

        menuButton: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          borderRadius: 14,
          backgroundColor: theme.colors.control,
        },

        menuLine: {
          width: 20,
          height: 2,
          borderRadius: 1,
          backgroundColor: theme.colors.heading,
        },

        labelContainer: {
          overflow: 'hidden',
        },

        brandLabel: {
          color: theme.colors.heading,
          fontSize: 14,
          fontWeight: '800',
        },

        items: {
          gap: 8,
        },

        item: {
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 6,
          borderRadius: 14,
        },

        itemActive: {
          backgroundColor: theme.colors.actionSurface,
        },

        itemPressed: {
          opacity: 0.72,
        },

        icon: {
          width: 32,
          color: theme.colors.muted,
          fontSize: 28,
          fontWeight: '700',
          textAlign: 'center',
        },

        iconActive: {
          color: theme.colors.action,
        },

        label: {
          color: theme.colors.body,
          fontSize: 13,
          fontWeight: '600',
          includeFontPadding: false,
        },

        labelActive: {
          color: theme.colors.action,
          fontWeight: '700',
        },

        themeButton: {
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: Math.max(insets.bottom, 12),
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          backgroundColor: theme.colors.control,
        },

        themeIconContainer: {
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
        },

        themeIcon: {
          position: 'absolute',
          fontSize: 23,
          color: theme.colors.heading,
          textAlign: 'center',
        },
      }),
    [insets, theme, windowWidth],
  );

  useEffect(() => {
    const animation = Animated.spring(sidebarWidth, {
      toValue: expanded ? expandedWidth : 64,
      stiffness: 190,
      damping: 24,
      mass: 0.9,
      useNativeDriver: false,
    });

    animation.start();

    return () => animation.stop();
  }, [expanded, expandedWidth, sidebarWidth]);

  useEffect(() => {
    Animated.timing(themeTransition, {
      toValue: colorScheme === 'dark' ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [colorScheme, themeTransition]);

  const toggleTheme = () => {
    const nextMode = colorScheme === 'dark' ? 'light' : 'dark';
    void setThemeMode(nextMode);
  };

  return (
    <View style={styles.host}>
      {expanded && (
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
            },
          ]}
        >
          <Pressable
            accessibilityLabel="Fechar menu"
            accessibilityRole="button"
            style={StyleSheet.absoluteFill}
            onPress={onToggleExpanded}
          />
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.sidebar,
          {
            width: sidebarWidth,
          },
        ]}
      >
        <View style={styles.top}>
          <Pressable
            accessibilityLabel={expanded ? 'Recolher menu' : 'Expandir menu'}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={onToggleExpanded}
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.itemPressed,
            ]}
          >
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </Pressable>

          <Animated.View
            style={[
              styles.labelContainer,
              {
                width: labelWidth,
                opacity: labelOpacity,
                transform: [{ translateX: labelOffset }],
              },
            ]}
          >
            <Text numberOfLines={1} style={styles.brandLabel}>
              HidroBairro
            </Text>
          </Animated.View>
        </View>

        <View style={styles.items}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];

            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : options.title ?? route.name;

            const isFocused = state.index === index;

            function handlePress() {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }

              onSelectTab();
            }

            return (
              <Pressable
                key={route.key}
                accessibilityLabel={
                  options.tabBarAccessibilityLabel ?? label
                }
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                onLongPress={() =>
                  navigation.emit({
                    type: 'tabLongPress',
                    target: route.key,
                  })
                }
                onPress={handlePress}
                style={({ pressed }) => [
                  styles.item,
                  isFocused && styles.itemActive,
                  pressed && styles.itemPressed,
                ]}
              >
                <Text
                  accessible={false}
                  style={[
                    styles.icon,
                    isFocused && styles.iconActive,
                  ]}
                >
                  {TAB_ICONS[route.name] ?? '•'}
                </Text>

                <Animated.View
                  style={[
                    styles.labelContainer,
                    {
                      width: labelWidth,
                      opacity: labelOpacity,
                      transform: [{ translateX: labelOffset }],
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.label,
                      isFocused && styles.labelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityLabel={
            colorScheme === 'dark'
              ? 'Mudar para tema claro'
              : 'Mudar para tema escuro'
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: !isReady }}
          disabled={!isReady}
          onPress={toggleTheme}
          style={({ pressed }) => [
            styles.themeButton,
            pressed && styles.itemPressed,
          ]}
        >
          <View style={styles.themeIconContainer}>
            {/* Sol: aparece no tema escuro */}
            <Animated.Text
              style={[
                styles.themeIcon,
                {
                  opacity: themeTransition,
                  transform: [
                    {
                      rotate: themeTransition.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-90deg', '0deg'],
                      }),
                    },
                    {
                      scale: themeTransition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.65, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              ☀
            </Animated.Text>

            {/* Lua: aparece no tema claro */}
            <Animated.Text
              style={[
                styles.themeIcon,
                {
                  opacity: themeTransition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                  transform: [
                    {
                      rotate: themeTransition.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '90deg'],
                      }),
                    },
                    {
                      scale: themeTransition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.65],
                      }),
                    },
                  ],
                },
              ]}
            >
              ☾
            </Animated.Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
