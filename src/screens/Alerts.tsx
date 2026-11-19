import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SurfaceCard } from '@/components/SurfaceCard';
import { hidroBairroDataSource } from '@/services/HidroBairroDataSource';
import { useTheme } from '@/store/useTheme';
import type { FloodAlert } from '@/types/domain';
import type { HomeTabNavigationProp } from '@/types/navigation';

type AlertState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      alerts: readonly FloodAlert[];
      points: ReadonlyMap<number, string>;
      notice: string | null;
    };

type AlertFilter = 'ATIVO' | 'ENCERRADO';

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function AlertsScreen() {
  const navigation = useNavigation<HomeTabNavigationProp<'Alerts'>>();
  const { theme } = useTheme();
  const [filter, setFilter] = useState<AlertFilter>('ATIVO');
  const [state, setState] = useState<AlertState>({ status: 'loading' });
  const styles = useMemo(
    () =>
      StyleSheet.create({
        actions: {
          flexDirection: 'row',
          gap: 8,
        },
        filter: {
          flex: 1,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 10,
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
        cardPressable: {
          gap: theme.spacing.compact,
        },
        cardHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        },
        point: {
          flex: 1,
          color: theme.colors.heading,
          fontSize: 16,
          fontWeight: '700',
        },
        severity: {
          paddingHorizontal: 9,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: theme.colors.warningSurface,
        },
        severityCritical: {
          backgroundColor: theme.colors.errorSurface,
        },
        severityText: {
          color: theme.colors.warning,
          fontSize: 12,
          fontWeight: '700',
        },
        severityTextCritical: {
          color: theme.colors.error,
        },
        message: {
          color: theme.colors.body,
          fontSize: 14,
          lineHeight: 20,
        },
        metadata: {
          color: theme.colors.muted,
          fontSize: 12,
          lineHeight: 17,
        },
        notice: {
          color: theme.colors.muted,
          fontSize: 12,
          lineHeight: 18,
        },
        emptyTitle: {
          color: theme.colors.heading,
          fontSize: 16,
          fontWeight: '700',
        },
        emptyText: {
          color: theme.colors.body,
          fontSize: 14,
          lineHeight: 20,
        },
        error: {
          color: theme.colors.error,
          fontSize: 14,
          lineHeight: 20,
        },
        buttonText: {
          color: theme.colors.action,
          fontSize: 14,
          fontWeight: '700',
        },
      }),
    [theme],
  );

  const loadAlerts = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const [alerts, points] = await Promise.all([
        hidroBairroDataSource.listAlerts(),
        hidroBairroDataSource.listMonitoringPoints(),
      ]);
      setState({
        status: 'ready',
        alerts: alerts.data,
        points: new Map(
          points.data.map((point) => [point.id, point.neighborhood]),
        ),
        notice:
          alerts.provider === 'DEMONSTRACAO'
            ? alerts.notice ?? 'Os alertas exibidos são demonstrativos.'
            : null,
      });
    } catch (error) {
      console.error('Não foi possível carregar a lista de alertas.', error);
      setState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os alertas.',
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAlerts();
    }, [loadAlerts]),
  );

  const visibleAlerts =
    state.status === 'ready'
      ? state.alerts
          .filter((alert) => alert.status === filter)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      : [];

  return (
    <ScreenFrame
      title="Alertas"
      description="Acompanhe os alertas recebidos para os pontos monitorados."
    >
      <View style={styles.actions}>
        {(['ATIVO', 'ENCERRADO'] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === value }}
            onPress={() => setFilter(value)}
            style={[
              styles.filter,
              filter === value && styles.filterSelected,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === value && styles.filterTextSelected,
              ]}
            >
              {value === 'ATIVO' ? 'Ativos' : 'Encerrados'}
            </Text>
          </Pressable>
        ))}
      </View>

      {state.status === 'loading' && (
        <Text style={styles.emptyText}>Carregando alertas...</Text>
      )}
      {state.status === 'error' && (
        <SurfaceCard>
          <Text accessibilityRole="alert" style={styles.error}>
            {state.message}
          </Text>
          <ActionButton label="Tentar novamente" onPress={() => void loadAlerts()} variant="secondary" />
        </SurfaceCard>
      )}
      {state.status === 'ready' && visibleAlerts.length === 0 && (
        <SurfaceCard>
          <Text style={styles.emptyTitle}>
            {filter === 'ATIVO'
              ? 'Nenhum alerta ativo'
              : 'Nenhum alerta encerrado'}
          </Text>
          <Text style={styles.emptyText}>
            {filter === 'ATIVO'
              ? 'Quando houver alertas recebidos dos pontos monitorados, eles aparecerão aqui.'
              : 'Alertas encerrados ficarão disponíveis para consulta nesta lista.'}
          </Text>
        </SurfaceCard>
      )}
      {state.status === 'ready' &&
        visibleAlerts.map((alert) => {
          const critical = alert.severity === 'CRITICO';
          return (
            <Pressable
              key={alert.id}
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('AlertDetails', { id: String(alert.id) })
              }
              style={({ pressed }) => pressed && { opacity: 0.75 }}
            >
              <SurfaceCard>
                <View style={styles.cardHeader}>
                  <Text style={styles.point}>
                    {state.points.get(alert.pointId) ?? 'Ponto monitorado'}
                  </Text>
                  <View
                    style={[
                      styles.severity,
                      critical && styles.severityCritical,
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        critical && styles.severityTextCritical,
                      ]}
                    >
                      {critical ? 'Crítico' : 'Atenção'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.message}>{alert.message}</Text>
                <Text style={styles.metadata}>
                  {state.points.get(alert.pointId) ? 'Ponto monitorado' : ''}
                  {` · ${formatDate(alert.createdAt)}`}
                </Text>
              </SurfaceCard>
            </Pressable>
          );
        })}
      {state.status === 'ready' && state.notice ? (
        <Text style={styles.notice}>{state.notice}</Text>
      ) : null}
    </ScreenFrame>
  );
}
