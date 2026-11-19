import { useCallback, useMemo, useState } from 'react';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SurfaceCard } from '@/components/SurfaceCard';
import { hidroBairroDataSource } from '@/services/HidroBairroDataSource';
import { useAuth } from '@/store/AuthProvider';
import { useTheme } from '@/store/useTheme';
import type {
  RequestStatusHistory,
  ServiceRequest,
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
      request: ServiceRequest | null;
      categoryName: string | null;
      pointName: string | null;
      history: readonly RequestStatusHistory[];
      isApiBacked: boolean;
      historyError: string | null;
    };

const STATUS_LABELS: Record<ServiceRequest['status'], string> = {
  RECEBIDA: 'Recebida',
  EM_VISTORIA: 'Em vistoria',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function RequestDetailsScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'RequestDetails'>>();
  const { session } = useAuth();
  const { theme } = useTheme();
  const isManager =
    session.status === 'authenticated' && session.user.role === 'GESTOR';
  const [state, setState] = useState<DetailState>({ status: 'loading' });
  const [isConfirmingCancellation, setIsConfirmingCancellation] =
    useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
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
          fontSize: 14,
          lineHeight: 21,
        },
        status: {
          alignSelf: 'flex-start',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: theme.colors.actionSurface,
          color: theme.colors.action,
          fontSize: 12,
          fontWeight: '700',
        },
        statusCancelled: {
          backgroundColor: theme.colors.control,
          color: theme.colors.muted,
        },
        timeline: {
          gap: theme.spacing.compact,
        },
        timelineEntry: {
          gap: 5,
          paddingLeft: 12,
          borderLeftWidth: 2,
          borderLeftColor: theme.colors.action,
        },
        timelineStatus: {
          color: theme.colors.heading,
          fontSize: 14,
          fontWeight: '700',
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
        confirmation: {
          gap: 8,
          padding: theme.spacing.compact,
          borderRadius: theme.radius.control,
          backgroundColor: theme.colors.errorSurface,
        },
        confirmationText: {
          color: theme.colors.error,
          fontSize: 14,
          lineHeight: 20,
        },
        confirmationActions: {
          gap: 8,
        },
      }),
    [theme],
  );

  const loadDetails = useCallback(async () => {
    setState({ status: 'loading' });
    const requestId = Number(route.params.id);
    if (!Number.isInteger(requestId)) {
      setState({
        status: 'ready',
        request: null,
        categoryName: null,
        pointName: null,
        history: [],
        isApiBacked: false,
        historyError: null,
      });
      return;
    }

    try {
      const requestResult =
        await hidroBairroDataSource.getServiceRequest(requestId);
      const request = requestResult.data;
      let categoryName = request.categoryName ?? null;
      let pointName =
        request.pointId !== null
          ? `Ponto monitorado #${request.pointId}`
          : null;
      if (request.location) {
        pointName = `${request.location.latitude.toFixed(5)}, ${request.location.longitude.toFixed(5)}`;
      }

      if (requestResult.provider === 'DEMONSTRACAO') {
        const [categories, points] = await Promise.all([
          hidroBairroDataSource.listRequestCategories(),
          hidroBairroDataSource.listMonitoringPoints(),
        ]);
        categoryName =
          categories.data.find((item) => item.id === request.categoryId)
            ?.name ?? null;
        pointName =
          points.data.find((item) => item.id === request.pointId)
            ?.neighborhood ?? pointName;
      }

      let history: readonly RequestStatusHistory[] = [];
      let historyError: string | null = null;
      try {
        history = (
          await hidroBairroDataSource.listRequestHistory(requestId)
        ).data;
      } catch (error) {
        console.error('Não foi possível carregar o histórico da solicitação.', error);
        historyError =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o histórico.';
      }

      setState({
        status: 'ready',
        request,
        categoryName,
        pointName,
        history,
        isApiBacked: requestResult.provider === 'API',
        historyError,
      });
    } catch (error) {
      console.error('Não foi possível carregar o detalhe da solicitação.', error);
      setState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar esta solicitação.',
      });
    }
  }, [route.params.id]);

  useFocusEffect(
    useCallback(() => {
      void loadDetails();
    }, [loadDetails]),
  );

  async function cancelRequest() {
    if (state.status !== 'ready' || !state.request) {
      return;
    }
    setIsCancelling(true);
    setActionError(null);
    try {
      await hidroBairroDataSource.cancelServiceRequest(state.request.id);
      setIsConfirmingCancellation(false);
      await loadDetails();
    } catch (error) {
      console.error('Não foi possível cancelar a solicitação.', error);
      setActionError(
        error instanceof Error
          ? error.message
          : 'O cancelamento não foi concluído. Tente novamente.',
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <ScreenFrame
      title="Detalhe da solicitação"
      description={
        state.status === 'ready' && state.isApiBacked
          ? 'Acompanhe o protocolo e o andamento da solicitação.'
          : 'Registro local de demonstração; nada foi enviado a um serviço público.'
      }
    >
      {state.status === 'loading' && (
        <Text style={styles.body}>Carregando solicitação...</Text>
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
      {state.status === 'ready' && !state.request && (
        <SurfaceCard>
          <Text style={styles.value}>Solicitação não encontrada</Text>
          <Text style={styles.body}>
            Ela pode ter sido removida ou não estar mais disponível neste aparelho.
          </Text>
        </SurfaceCard>
      )}
      {state.status === 'ready' && state.request ? (
        <>
          <SurfaceCard>
            <Text style={styles.label}>
              {state.isApiBacked ? 'Protocolo' : 'Protocolo demonstrativo'}
            </Text>
            <Text style={styles.value}>{state.request.protocol}</Text>
            <Text
              style={[
                styles.status,
                state.request.status === 'CANCELADA' && styles.statusCancelled,
              ]}
            >
              {STATUS_LABELS[state.request.status]}
            </Text>
            <Text style={styles.label}>Título</Text>
            <Text style={styles.value}>{state.request.title}</Text>
            <Text style={styles.label}>Descrição</Text>
            <Text style={styles.body}>{state.request.description}</Text>
            <Text style={styles.label}>Categoria</Text>
            <Text style={styles.value}>
              {state.categoryName ?? 'Categoria não disponível'}
            </Text>
            <Text style={styles.label}>Local do piloto</Text>
            <Text style={styles.value}>
              {state.pointName ??
                (state.request.location
                  ? `${state.request.location.latitude.toFixed(5)}, ${state.request.location.longitude.toFixed(5)}`
                  : 'Ponto não disponível')}
            </Text>
            <Text style={styles.body}>
              Criada em {formatDate(state.request.createdAt)}
            </Text>
            <Text style={styles.body}>
              Atualizada em {formatDate(state.request.updatedAt)}
            </Text>
          </SurfaceCard>

          <SurfaceCard>
            <Text style={styles.label}>Histórico de status</Text>
            {state.historyError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {state.historyError}
              </Text>
            ) : null}
            {state.history.length > 0 ? (
              <View style={styles.timeline}>
                {state.history.map((entry) => (
                  <View key={entry.id} style={styles.timelineEntry}>
                    <Text style={styles.timelineStatus}>
                      {entry.previousStatus
                        ? `${STATUS_LABELS[entry.previousStatus]} - `
                        : ''}
                      {STATUS_LABELS[entry.newStatus]}
                    </Text>
                    <Text style={styles.body}>{formatDate(entry.createdAt)}</Text>
                    {entry.observation ? (
                      <Text style={styles.body}>{entry.observation}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.body}>
                {state.isApiBacked
                  ? 'Ainda não há alterações de status registradas.'
                  : 'O histórico demonstrativo começa a ser registrado quando o status é alterado neste aplicativo.'}
              </Text>
            )}
          </SurfaceCard>

          {state.request.status === 'RECEBIDA' ? (
            <ActionButton
              label="Editar solicitação"
              onPress={() =>
                navigation.navigate('NewRequest', {
                  requestId: state.request?.id,
                })
              }
              variant="secondary"
            />
          ) : null}
          {(state.request.status === 'RECEBIDA' ||
            (isManager && state.request.status === 'EM_VISTORIA')) &&
          !isConfirmingCancellation ? (
            <ActionButton
              label="Cancelar solicitação"
              onPress={() => setIsConfirmingCancellation(true)}
              variant="danger"
            />
          ) : null}
          {isConfirmingCancellation ? (
            <View style={styles.confirmation}>
              <Text style={styles.confirmationText}>
                {state.isApiBacked
                  ? 'Confirma o cancelamento desta solicitação?'
                  : 'Deseja cancelar este registro demonstrativo?'}
              </Text>
              <View style={styles.confirmationActions}>
                <ActionButton
                  label={isCancelling ? 'Cancelando...' : 'Confirmar cancelamento'}
                  onPress={() => void cancelRequest()}
                  disabled={isCancelling}
                  variant="danger"
                />
                <ActionButton
                  label="Manter solicitação"
                  onPress={() => setIsConfirmingCancellation(false)}
                  disabled={isCancelling}
                  variant="secondary"
                />
              </View>
            </View>
          ) : null}
          {actionError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {actionError}
            </Text>
          ) : null}
          <Text style={styles.notice}>
            {state.isApiBacked
              ? 'Esta solicitação foi enviada à API de zeladoria. As alterações de status são registradas no histórico.'
              : 'A edição e o cancelamento alteram somente os dados locais deste protótipo. Não inclua informações pessoais ou sensíveis.'}
          </Text>
        </>
      ) : null}
      <ActionButton
        label="Voltar às solicitações"
        onPress={() => navigation.navigate('Main', { screen: 'Requests' })}
        variant="secondary"
      />
    </ScreenFrame>
  );
}
