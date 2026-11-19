import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SurfaceCard } from '@/components/SurfaceCard';
import { hidroBairroDataSource } from '@/services/HidroBairroDataSource';
import { useAuth } from '@/store/AuthProvider';
import { useTheme } from '@/store/useTheme';
import type { RequestStatus, ServiceRequest } from '@/types/domain';
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

type RequestFilter = RequestStatus | 'TODAS';

const STATUS_FILTERS: readonly { value: RequestFilter; label: string }[] = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'RECEBIDA', label: STATUS_LABELS.RECEBIDA },
  { value: 'EM_VISTORIA', label: STATUS_LABELS.EM_VISTORIA },
  { value: 'CONCLUIDA', label: STATUS_LABELS.CONCLUIDA },
  { value: 'CANCELADA', label: STATUS_LABELS.CANCELADA },
];

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
  const [statusFilter, setStatusFilter] = useState<RequestFilter>('TODAS');
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
        filterLabel: {
          color: theme.colors.body,
          fontSize: 13,
          fontWeight: '600',
        },
        filters: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        filter: {
          minHeight: 40,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 12,
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
          fontSize: 13,
          fontWeight: '600',
        },
        filterTextSelected: {
          color: theme.colors.action,
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
        isManager && statusFilter !== 'TODAS' ? statusFilter : undefined,
      );
      const categories = new Map<number, string>();
      if (requests.provider === 'DEMONSTRACAO') {
        const categoryResult =
          await hidroBairroDataSource.listRequestCategories();
        for (const category of categoryResult.data) {
          categories.set(category.id, category.name);
        }
      }
      setState({
        status: 'ready',
        requests: requests.data,
        categories,
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
  }, [isManager, statusFilter]);

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
      {isManager ? (
        <>
          <Text style={styles.filterLabel}>Filtrar solicitações por status</Text>
          <View style={styles.filters}>
            {STATUS_FILTERS.map((filter) => (
              <Pressable
                key={filter.value}
                accessibilityRole="button"
                accessibilityState={{
                  selected: statusFilter === filter.value,
                }}
                onPress={() => setStatusFilter(filter.value)}
                style={[
                  styles.filter,
                  statusFilter === filter.value && styles.filterSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    statusFilter === filter.value && styles.filterTextSelected,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
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
            {isManager
              ? statusFilter === 'TODAS'
                ? 'Nenhuma solicitação na fila'
                : `Nenhuma solicitação ${STATUS_LABELS[statusFilter].toLocaleLowerCase('pt-BR')}`
              : 'Sua lista está vazia'}
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
