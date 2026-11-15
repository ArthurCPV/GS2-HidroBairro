import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SurfaceCard } from '@/components/SurfaceCard';
import { hidroBairroDataSource } from '@/services/HidroBairroDataSource';
import { useTheme } from '@/store/useTheme';
import type { GuidanceCategory, GuidanceItem } from '@/types/domain';

type GuidanceState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      items: readonly GuidanceItem[];
      notice: string | null;
    };

const CATEGORIES: readonly {
  id: GuidanceCategory;
  label: string;
}[] = [
  { id: 'PREVENCAO', label: 'Prevenção' },
  { id: 'DURANTE_CHUVA', label: 'Durante chuva' },
  { id: 'POS_CHUVA', label: 'Após a chuva' },
];

export default function AIScreen() {
  const { theme } = useTheme();
  const [category, setCategory] = useState<GuidanceCategory>('PREVENCAO');
  const [state, setState] = useState<GuidanceState>({ status: 'loading' });
  const styles = useMemo(
    () =>
      StyleSheet.create({
        filters: {
          gap: 8,
        },
        filter: {
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: theme.spacing.compact,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.control,
          backgroundColor: theme.colors.surface,
        },
        filterSelected: {
          borderColor: theme.colors.action,
          backgroundColor: theme.colors.actionSurface,
        },
        filterText: {
          color: theme.colors.body,
          fontSize: 14,
          fontWeight: '600',
        },
        filterTextSelected: {
          color: theme.colors.action,
        },
        badge: {
          alignSelf: 'flex-start',
          paddingHorizontal: 9,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: theme.colors.actionSurface,
        },
        badgeText: {
          color: theme.colors.action,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        },
        title: {
          color: theme.colors.heading,
          fontSize: 17,
          fontWeight: '700',
        },
        body: {
          color: theme.colors.body,
          fontSize: 14,
          lineHeight: 21,
        },
        updated: {
          color: theme.colors.muted,
          fontSize: 12,
        },
        notice: {
          color: theme.colors.muted,
          fontSize: 12,
          lineHeight: 18,
        },
        error: {
          color: theme.colors.error,
          fontSize: 14,
          lineHeight: 20,
        },
        empty: {
          color: theme.colors.body,
          fontSize: 14,
          lineHeight: 20,
        },
      }),
    [theme],
  );

  const loadGuidance = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const result = await hidroBairroDataSource.listGuidanceItems();
      setState({
        status: 'ready',
        items: result.data,
        notice: result.provider === 'DEMONSTRACAO' ? result.notice ?? null : null,
      });
    } catch (error) {
      console.error('Não foi possível carregar as orientações.', error);
      setState({ status: 'error' });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadGuidance();
    }, [loadGuidance]),
  );

  const visibleItems =
    state.status === 'ready'
      ? state.items.filter((item) => item.category === category)
      : [];

  return (
    <ScreenFrame
      title="Orientação"
      description="Recomendações gerais para prevenção e cuidado durante e após chuvas."
    >
      <SurfaceCard>
        <Text style={styles.title}>Conteúdo informativo</Text>
        <Text style={styles.body}>
          Esta versão apresenta orientações demonstrativas. Não é uma conversa
          com IA, não consulta sensores em tempo real e não substitui alertas ou
          instruções das autoridades.
        </Text>
      </SurfaceCard>

      <View style={styles.filters}>
        {CATEGORIES.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: category === item.id }}
            onPress={() => setCategory(item.id)}
            style={[
              styles.filter,
              category === item.id && styles.filterSelected,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                category === item.id && styles.filterTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {state.status === 'loading' && (
        <Text style={styles.empty}>Carregando orientações...</Text>
      )}
      {state.status === 'error' && (
        <SurfaceCard>
          <Text accessibilityRole="alert" style={styles.error}>
            Não foi possível carregar o conteúdo.
          </Text>
          <ActionButton
            label="Tentar novamente"
            onPress={() => void loadGuidance()}
            variant="secondary"
          />
        </SurfaceCard>
      )}
      {state.status === 'ready' && visibleItems.length === 0 && (
        <SurfaceCard>
          <Text style={styles.empty}>
            Ainda não há orientações nesta categoria.
          </Text>
        </SurfaceCard>
      )}
      {state.status === 'ready' &&
        visibleItems.map((item) => (
          <SurfaceCard key={item.id}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.source === 'DEMONSTRACAO'
                  ? 'Demonstrativo'
                  : item.source === 'IA'
                    ? 'IA'
                    : 'Documentação'}
              </Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.content}</Text>
            <Text style={styles.updated}>
              Atualizado em{' '}
              {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
            </Text>
          </SurfaceCard>
        ))}
      {state.status === 'ready' && state.notice ? (
        <Text style={styles.notice}>{state.notice}</Text>
      ) : null}
    </ScreenFrame>
  );
}
