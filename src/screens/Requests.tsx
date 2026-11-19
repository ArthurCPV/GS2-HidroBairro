import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SurfaceCard } from '@/components/SurfaceCard';
import { hidroBairroDataSource } from '@/services/HidroBairroDataSource';
import { useAuth } from '@/store/AuthProvider';
import { useTheme } from '@/store/useTheme';
import type {
  RequestCategory,
  ServiceRequest,
} from '@/types/domain';
import type { HomeTabNavigationProp } from '@/types/navigation';

type RequestsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      requests: readonly ServiceRequest[];
      categories: ReadonlyMap<number, string>;
      notice: string | null;
    };

const STATUS_LABELS: Record<ServiceRequest['status'], string> = {
  RECEBIDA: 'Recebida',
  EM_VISTORIA: 'Em vistoria',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR');
}

export default function RequestsScreen() {
  const navigation = useNavigation<HomeTabNavigationProp<'Requests'>>();
  const { session } = useAuth();
  const { theme } = useTheme();
  const isManager =
    session.status === 'authenticated' && session.user.role === 'GESTOR';
  const [state, setState] = useState<RequestsState>({ status: 'loading' });
  const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        },
        count: {
          color: theme.colors.muted,
          fontSize: 13,
        },
        cardPressable: {
          gap: theme.spacing.compact,
        },
        title: {
          color: theme.colors.heading,
          fontSize: 16,
          fontWeight: '700',
          lineHeight: 22,
        },
        protocol: {
          color: theme.colors.action,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        status: {
          alignSelf: 'flex-start',
          paddingHorizontal: 9,
          paddingVertical: 5,
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
        metadata: {
          color: theme.colors.body,
          fontSize: 13,
          lineHeight: 18,
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
        emptyTitle: {
          color: theme.colors.heading,
          fontSize: 16,
          fontWeight: '700',
        },
        emptyBody: {
          color: theme.colors.body,
          fontSize: 14,
          lineHeight: 20,
        },
      }),
    [theme],
  );

  const loadRequests = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const requests = await hidroBairroDataSource.listServiceRequests(
        !isManager,
      );
      const categories =
        requests.provider === 'DEMONSTRACAO'
          ? await hidroBairroDataSource.listRequestCategories()
          : null;
      setState({
        status: 'ready',
        requests: requests.data,
        categories: new Map(
          categories?.data.map((category: RequestCategory) => [
            category.id,
            category.name,
          ]),
        ),
        notice:
          requests.provider === 'DEMONSTRACAO'
            ? requests.notice ?? 'Os registros são demonstrativos.'
            : null,
      });
    } catch (error) {
      console.error('Não foi possível carregar as solicitações.', error);
      setState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar as solicitações.',
      });
    }
  }, [isManager]);

  async function advanceRequestStatus(request: ServiceRequest) {
    const nextStatus =
      request.status === 'RECEBIDA'
        ? 'EM_VISTORIA'
        : request.status === 'EM_VISTORIA'
          ? 'CONCLUIDA'
          : null;
    if (!isManager || !nextStatus) {
      return;
    }

    setUpdatingRequestId(request.id);
    setActionError(null);
    try {
      await hidroBairroDataSource.changeServiceRequestStatus(
        request.id,
        nextStatus,
        'Atualização realizada pelo painel do gestor.',
      );
      await loadRequests();
    } catch (error) {
      console.error('Não foi possível atualizar o status da solicitação.', error);
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o status.',
      );
    } finally {
      setUpdatingRequestId(null);
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  return (
    <ScreenFrame
      title={isManager ? 'Painel do gestor' : 'Solicitações'}
      description={
        isManager
          ? 'Acompanhe a fila de zeladoria e avance os chamados em atendimento.'
          : 'Acompanhe suas solicitações de zeladoria.'
      }
    >
      {!isManager ? (
        <ActionButton
          label="Nova solicitação"
          onPress={() => navigation.navigate('NewRequest')}
        />
      ) : null}
      {state.status === 'loading' && (
        <Text style={styles.emptyBody}>Carregando solicitações...</Text>
      )}
      {state.status === 'error' && (
        <SurfaceCard>
          <Text accessibilityRole="alert" style={styles.error}>
            {state.message}
          </Text>
          <ActionButton
            label="Tentar novamente"
            onPress={() => void loadRequests()}
            variant="secondary"
          />
        </SurfaceCard>
      )}
      {actionError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {actionError}
        </Text>
      ) : null}
      {state.status === 'ready' && state.requests.length === 0 && (
        <SurfaceCard>
          <Text style={styles.emptyTitle}>
            {isManager ? 'Nenhuma solicitação na fila' : 'Sua lista está vazia'}
          </Text>
          <Text style={styles.emptyBody}>
            {isManager
              ? 'As solicitações recebidas aparecerão aqui.'
              : 'A lista mostra solicitações vinculadas à conta autenticada. Se esperava ver protocolos existentes, confirme se essa conta é a titular dos registros.'}
          </Text>
        </SurfaceCard>
      )}
      {state.status === 'ready' && state.requests.length > 0 ? (
        <View style={styles.headerRow}>
          <Text style={styles.count}>
            {state.requests.length}{' '}
            {state.requests.length === 1 ? 'registro' : 'registros'}
          </Text>
        </View>
      ) : null}
      {state.status === 'ready' &&
        state.requests.map((request) => (
          <View key={request.id}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate('RequestDetails', {
                id: String(request.id),
              })
            }
            style={({ pressed }) => pressed && { opacity: 0.75 }}
          >
            <SurfaceCard>
              <Text style={styles.protocol}>{request.protocol}</Text>
              <Text style={styles.title}>{request.title}</Text>
              <Text
                style={[
                  styles.status,
                  request.status === 'CANCELADA' && styles.statusCancelled,
                ]}
              >
                {STATUS_LABELS[request.status]}
              </Text>
              <Text style={styles.metadata}>
                {request.categoryName ??
                  state.categories.get(request.categoryId) ??
                  'Categoria não disponível'}
                {' · '}
                {formatDate(request.createdAt)}
              </Text>
            </SurfaceCard>
          </Pressable>
          {isManager &&
          (request.status === 'RECEBIDA' ||
            request.status === 'EM_VISTORIA') ? (
            <ActionButton
              label={
                updatingRequestId === request.id
                  ? 'Atualizando...'
                  : request.status === 'RECEBIDA'
                    ? 'Iniciar vistoria'
                    : 'Marcar como concluída'
              }
              onPress={() => void advanceRequestStatus(request)}
              disabled={updatingRequestId !== null}
              variant="secondary"
            />
          ) : null}
          </View>
        ))}
      {state.status === 'ready' && state.notice ? (
        <Text style={styles.notice}>{state.notice}</Text>
      ) : null}
    </ScreenFrame>
  );
}
