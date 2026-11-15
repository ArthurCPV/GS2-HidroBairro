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
  | { status: 'error' }
  | {
      status: 'ready';
      request: ServiceRequest | null;
      categoryName: string | null;
      pointName: string | null;
      history: readonly RequestStatusHistory[];
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
  const { theme } = useTheme();
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
      });
      return;
    }

    try {
      const [requests, categories, points] = await Promise.all([
        hidroBairroDataSource.listServiceRequests(),
        hidroBairroDataSource.listRequestCategories(),
        hidroBairroDataSource.listMonitoringPoints(),
      ]);
      const request =
        requests.data.find((item) => item.id === requestId) ?? null;
      const history = request
        ? await hidroBairroDataSource.listRequestHistory(requestId)
        : { data: [] };
      setState({
        status: 'ready',
        request,
        categoryName: request
          ? categories.data.find((item) => item.id === request.categoryId)
              ?.name ?? null
          : null,
        pointName: request
          ? points.data.find((item) => item.id === request.pointId)
              ?.neighborhood ?? null
          : null,
        history: history.data,
      });
    } catch (error) {
      console.error('Não foi possível carregar o detalhe da solicitação.', error);
      setState({ status: 'error' });
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
      setActionError('O cancelamento não foi concluído. Tente novamente.');
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <ScreenFrame
      title="Detalhe da solicitação"
      description="Registro local de demonstração; nada foi enviado a um serviço público."
    >
      {state.status === 'loading' && (
        <Text style={styles.body}>Carregando solicitação...</Text>
      )}
      {state.status === 'error' && (
        <SurfaceCard>
          <Text accessibilityRole="alert" style={styles.error}>
            Não foi possível carregar esta solicitação.
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
            <Text style={styles.label}>Protocolo demonstrativo</Text>
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
              {state.pointName ?? 'Ponto não disponível'}
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
                O histórico demonstrativo começa a ser registrado quando o
                status é alterado neste aplicativo.
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
          {state.request.status === 'RECEBIDA' &&
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
                Deseja cancelar este registro demonstrativo?
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
            A edição e o cancelamento alteram somente os dados locais deste
            protótipo. Não inclua informações pessoais ou sensíveis.
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
