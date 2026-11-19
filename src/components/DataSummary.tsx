import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { hidroBairroDataSource } from '@/services/HidroBairroDataSource';
import { useAuth } from '@/store/AuthProvider';
import { useTheme } from '@/store/useTheme';
import type { DataProvider } from '@/types/domain';

type Summary = {
  monitoringPoints: number;
  activeAlerts: number;
  openRequests: number;
  provider: string;
  notice: string | null;
};

type SummaryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; summary: Summary };

function getProviderLabel(providers: DataProvider[]) {
  if (providers.every((provider) => provider === 'DEMONSTRACAO')) {
    return 'Dados demonstrativos';
  }
  if (providers.every((provider) => provider === 'API')) {
    return 'Dados do serviço';
  }
  return 'Dados de origens mistas';
}

export function DataSummary() {
  const { session } = useAuth();
  const { theme } = useTheme();
  const isManager =
    session.status === 'authenticated' && session.user.role === 'GESTOR';
  const [state, setState] = useState<SummaryState>({ status: 'loading' });
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
        title: {
          color: theme.colors.heading,
          fontSize: 17,
          fontWeight: '700',
        },
        provider: {
          color: theme.colors.action,
          fontSize: 13,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        },
        metrics: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        metric: {
          flexGrow: 1,
          flexBasis: 88,
          gap: 4,
          padding: 12,
          borderRadius: 10,
          backgroundColor: theme.colors.control,
        },
        metricValue: {
          color: theme.colors.heading,
          fontSize: 22,
          fontWeight: '700',
        },
        metricLabel: {
          color: theme.colors.body,
          fontSize: 13,
          lineHeight: 18,
        },
        notice: {
          color: theme.colors.muted,
          fontSize: 13,
          lineHeight: 19,
        },
        error: {
          color: theme.colors.error,
          fontSize: 14,
          lineHeight: 20,
        },
      }),
    [theme],
  );

  useFocusEffect(
    useCallback(() => {
      let isFocused = true;
      setState({ status: 'loading' });

      async function loadSummary() {
        try {
          const [points, alerts, requests] = await Promise.all([
            hidroBairroDataSource.listMonitoringPoints(),
            hidroBairroDataSource.listAlerts(),
            hidroBairroDataSource.listServiceRequests(!isManager),
          ]);

          if (!isFocused) {
            return;
          }

          const providers = [
            points.provider,
            alerts.provider,
            requests.provider,
          ];
          const notices = [
            points.notice,
            alerts.notice,
            requests.notice,
          ].filter((notice): notice is string => Boolean(notice));

          setState({
            status: 'ready',
            summary: {
              monitoringPoints: points.data.length,
              activeAlerts: alerts.data.filter(
                (alert) => alert.status === 'ATIVO',
              ).length,
              openRequests: requests.data.filter(
                (request) =>
                  request.status === 'RECEBIDA' ||
                  request.status === 'EM_VISTORIA',
              ).length,
              provider: getProviderLabel(providers),
              notice: [...new Set(notices)].join(' '),
            },
          });
        } catch (error) {
          console.error('Não foi possível carregar o resumo do piloto.', error);
          if (isFocused) {
            setState({
              status: 'error',
              message:
                error instanceof Error
                  ? error.message
                  : 'Não foi possível carregar o resumo do piloto.',
            });
          }
        }
      }

      void loadSummary();
      return () => {
        isFocused = false;
      };
    }, [isManager]),
  );

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Visão geral do sistema
      </Text>
      {state.status === 'loading' && (
        <Text style={styles.metricLabel}>Carregando dados...</Text>
      )}
      {state.status === 'error' && (
        <Text accessibilityRole="alert" style={styles.error}>
          {state.message}
        </Text>
      )}
      {state.status === 'ready' && (
        <>
          <Text style={styles.provider}>{state.summary.provider}</Text>
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {state.summary.monitoringPoints}
              </Text>
              <Text style={styles.metricLabel}>Pontos monitorados</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {state.summary.activeAlerts}
              </Text>
              <Text style={styles.metricLabel}>Alertas ativos</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {state.summary.openRequests}
              </Text>
              <Text style={styles.metricLabel}>Solicitações abertas</Text>
            </View>
          </View>
          {state.summary.notice && (
            <Text style={styles.notice}>{state.summary.notice}</Text>
          )}
        </>
      )}
    </View>
  );
}
