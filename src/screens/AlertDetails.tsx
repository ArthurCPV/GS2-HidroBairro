import { useCallback, useMemo, useState } from 'react';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { StyleSheet, Text } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SurfaceCard } from '@/components/SurfaceCard';
import { hidroBairroDataSource } from '@/services/HidroBairroDataSource';
import { useTheme } from '@/store/useTheme';
import type {
  FloodAlert,
  MonitoringPoint,
  WaterLevelReading,
} from '@/types/domain';
import type {
  RootStackNavigationProp,
  RootStackParamList,
} from '@/types/navigation';

type DetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      alert: FloodAlert | null;
      point: MonitoringPoint | null;
      reading: WaterLevelReading | null;
      isDemonstration: boolean;
    };

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function AlertDetailsScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AlertDetails'>>();
  const { theme } = useTheme();
  const [state, setState] = useState<DetailState>({ status: 'loading' });
  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: {
          color: theme.colors.muted,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
        value: {
          color: theme.colors.heading,
          fontSize: 16,
          fontWeight: '600',
          lineHeight: 23,
        },
        body: {
          color: theme.colors.body,
          fontSize: 15,
          lineHeight: 22,
        },
        severity: {
          color: theme.colors.warning,
          fontSize: 18,
          fontWeight: '700',
        },
        severityCritical: {
          color: theme.colors.error,
        },
        error: {
          color: theme.colors.error,
          fontSize: 14,
          lineHeight: 20,
        },
        notice: {
          color: theme.colors.muted,
          fontSize: 12,
          lineHeight: 18,
        },
      }),
    [theme],
  );

  const loadDetails = useCallback(async () => {
    setState({ status: 'loading' });
    const alertId = Number(route.params.id);
    if (!Number.isInteger(alertId)) {
      setState({
        status: 'ready',
        alert: null,
        point: null,
        reading: null,
        isDemonstration: false,
      });
      return;
    }

    try {
      const [alerts, points, readings] = await Promise.all([
        hidroBairroDataSource.listAlerts(),
        hidroBairroDataSource.listMonitoringPoints(),
        hidroBairroDataSource.listWaterLevelReadings(),
      ]);
      const alert = alerts.data.find((item) => item.id === alertId) ?? null;
      setState({
        status: 'ready',
        alert,
        point: alert
          ? points.data.find((item) => item.id === alert.pointId) ?? null
          : null,
        reading:
          alert && alert.readingId !== null
            ? readings.data.find((item) => item.id === alert.readingId) ?? null
            : null,
        isDemonstration:
          alerts.provider === 'DEMONSTRACAO' ||
          points.provider === 'DEMONSTRACAO',
      });
    } catch (error) {
      console.error('Não foi possível carregar o detalhe do alerta.', error);
      setState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar este alerta.',
      });
    }
  }, [route.params.id]);

  useFocusEffect(
    useCallback(() => {
      void loadDetails();
    }, [loadDetails]),
  );

  return (
    <ScreenFrame
      title="Detalhe do alerta"
      description="Informações recebidas do sistema de monitoramento."
    >
      {state.status === 'loading' && (
        <Text style={styles.body}>Carregando detalhes...</Text>
      )}
      {state.status === 'error' && (
        <SurfaceCard>
          <Text accessibilityRole="alert" style={styles.error}>
            {state.message}
          </Text>
          <ActionButton
            label="Tentar novamente"
            onPress={() => void loadDetails()}
            variant="secondary"
          />
        </SurfaceCard>
      )}
      {state.status === 'ready' && !state.alert && (
        <SurfaceCard>
          <Text style={styles.value}>Alerta não encontrado</Text>
          <Text style={styles.body}>
            Ele pode ter sido removido ou não estar mais disponível para consulta.
          </Text>
        </SurfaceCard>
      )}
      {state.status === 'ready' && state.alert ? (
        <>
          <SurfaceCard>
            <Text
              style={[
                styles.severity,
                state.alert.severity === 'CRITICO' && styles.severityCritical,
              ]}
            >
              {state.alert.severity === 'CRITICO' ? 'Crítico' : 'Atenção'}
              {' · '}
              {state.alert.status === 'ATIVO' ? 'Ativo' : 'Encerrado'}
            </Text>
            <Text style={styles.body}>{state.alert.message}</Text>
            <Text style={styles.label}>Criado em</Text>
            <Text style={styles.value}>{formatDate(state.alert.createdAt)}</Text>
            {state.alert.endedAt ? (
              <>
                <Text style={styles.label}>Encerrado em</Text>
                <Text style={styles.value}>
                  {formatDate(state.alert.endedAt)}
                </Text>
              </>
            ) : null}
          </SurfaceCard>
          <SurfaceCard>
            <Text style={styles.label}>Ponto</Text>
            <Text style={styles.value}>
              {state.point?.neighborhood ?? 'Ponto não disponível'}
            </Text>
            {state.point ? (
              <Text style={styles.body}>
                {state.point.subprefecture} · Zona {state.point.zone}
              </Text>
            ) : null}
          </SurfaceCard>
          <SurfaceCard>
            <Text style={styles.label}>Leitura associada</Text>
            {state.reading ? (
              <>
                <Text style={styles.value}>
                  {state.reading.levelCm.toLocaleString('pt-BR')} cm
                </Text>
                <Text style={styles.body}>
                  Coletada em {formatDate(state.reading.collectedAt)} ·{' '}
                  {state.reading.origin === 'IOT' ? 'IoT' : 'Simulada'}
                </Text>
              </>
            ) : (
              <Text style={styles.body}>
                Não há uma leitura associada a este alerta.
              </Text>
            )}
          </SurfaceCard>
          {state.isDemonstration ? (
            <Text style={styles.notice}>
              Registro demonstrativo. Este alerta e esta leitura não representam
              condições atuais.
            </Text>
          ) : null}
        </>
      ) : null}
      <ActionButton
        label="Voltar aos alertas"
        onPress={() => navigation.navigate('Main', { screen: 'Alerts' })}
        variant="secondary"
      />
    </ScreenFrame>
  );
}
