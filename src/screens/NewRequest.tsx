import { useCallback, useMemo, useState } from 'react';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SurfaceCard } from '@/components/SurfaceCard';
import { hidroBairroDataSource } from '@/services/HidroBairroDataSource';
import { useTheme } from '@/store/useTheme';
import type {
  MonitoringPoint,
  RequestCategory,
  ServiceRequest,
  ServiceRequestDraft,
} from '@/types/domain';
import type {
  RootStackNavigationProp,
  RootStackParamList,
} from '@/types/navigation';

type FormState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      categories: readonly RequestCategory[];
      points: readonly MonitoringPoint[];
      request: ServiceRequest | null;
    };

const TITLE_LIMIT = 120;
const DESCRIPTION_LIMIT = 1000;

export default function NewRequestScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'NewRequest'>>();
  const { theme } = useTheme();
  const requestId = route.params?.requestId;
  const [state, setState] = useState<FormState>({ status: 'loading' });
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [pointId, setPointId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionTitle: {
          color: theme.colors.heading,
          fontSize: 16,
          fontWeight: '700',
        },
        sectionHint: {
          color: theme.colors.body,
          fontSize: 13,
          lineHeight: 19,
        },
        choices: {
          gap: 8,
        },
        choice: {
          minHeight: 44,
          justifyContent: 'center',
          paddingHorizontal: theme.spacing.compact,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.control,
          backgroundColor: theme.colors.surface,
        },
        choiceSelected: {
          borderColor: theme.colors.action,
          backgroundColor: theme.colors.actionSurface,
        },
        choiceText: {
          color: theme.colors.body,
          fontSize: 14,
          fontWeight: '600',
        },
        choiceTextSelected: {
          color: theme.colors.action,
        },
        label: {
          color: theme.colors.heading,
          fontSize: 14,
          fontWeight: '600',
        },
        field: {
          minHeight: 48,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.control,
          color: theme.colors.heading,
          backgroundColor: theme.colors.control,
          fontSize: 15,
        },
        multiline: {
          minHeight: 132,
          textAlignVertical: 'top',
        },
        counter: {
          color: theme.colors.muted,
          fontSize: 12,
          textAlign: 'right',
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

  const loadForm = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const [categoriesResult, pointsResult, requestsResult] =
        await Promise.all([
          hidroBairroDataSource.listRequestCategories(),
          hidroBairroDataSource.listMonitoringPoints(),
          requestId === undefined
            ? Promise.resolve(null)
            : hidroBairroDataSource.listServiceRequests(),
        ]);
      const categories = categoriesResult.data.filter(
        (category) => category.active,
      );
      const points = pointsResult.data.filter((point) => point.active);
      const request =
        requestId === undefined
          ? null
          : requestsResult?.data.find((item) => item.id === requestId) ?? null;

      setState({ status: 'ready', categories, points, request });

      if (request) {
        setCategoryId(request.categoryId);
        setPointId(request.pointId);
        setTitle(request.title);
        setDescription(request.description);
      } else if (requestId === undefined) {
        setCategoryId((current) => current ?? categories[0]?.id ?? null);
        setPointId((current) => current ?? points[0]?.id ?? null);
        setTitle('');
        setDescription('');
      }
    } catch (error) {
      console.error('Não foi possível carregar os dados do formulário.', error);
      setState({ status: 'error' });
    }
  }, [requestId]);

  useFocusEffect(
    useCallback(() => {
      void loadForm();
    }, [loadForm]),
  );

  async function submitRequest() {
    if (state.status !== 'ready') {
      return;
    }
    const category = state.categories.find((item) => item.id === categoryId);
    const point = state.points.find((item) => item.id === pointId);
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!category || !point || !trimmedTitle || !trimmedDescription) {
      setValidationMessage(
        'Selecione uma categoria e um local, e preencha o título e a descrição.',
      );
      return;
    }
    if (trimmedTitle.length > TITLE_LIMIT) {
      setValidationMessage(`O título deve ter até ${TITLE_LIMIT} caracteres.`);
      return;
    }
    if (trimmedDescription.length > DESCRIPTION_LIMIT) {
      setValidationMessage(
        `A descrição deve ter até ${DESCRIPTION_LIMIT} caracteres.`,
      );
      return;
    }

    const draft: ServiceRequestDraft = {
      categoryId: category.id,
      pointId: point.id,
      title: trimmedTitle,
      description: trimmedDescription,
      location: {
        latitude: point.latitude,
        longitude: point.longitude,
      },
    };

    setIsSaving(true);
    setValidationMessage(null);
    setActionError(null);
    try {
      const result =
        requestId === undefined
          ? await hidroBairroDataSource.createServiceRequest(draft)
          : await hidroBairroDataSource.updateServiceRequest(
              requestId,
              draft,
            );
      navigation.replace('RequestDetails', {
        id: String(result.data.id),
      });
    } catch (error) {
      console.error('Não foi possível salvar a solicitação.', error);
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a solicitação.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const isEditing = requestId !== undefined;
  const isEditable =
    state.status === 'ready' &&
    state.request !== null &&
    state.request.status === 'RECEBIDA';

  return (
    <ScreenFrame
      title={isEditing ? 'Editar solicitação' : 'Nova solicitação'}
      description="Preencha os dados do registro demonstrativo de zeladoria."
    >
      <ActionButton
        label="Voltar"
        onPress={() => navigation.goBack()}
        variant="secondary"
      />
      {state.status === 'loading' && (
        <Text style={styles.sectionHint}>Carregando formulário...</Text>
      )}
      {state.status === 'error' && (
        <SurfaceCard>
          <Text accessibilityRole="alert" style={styles.error}>
            Não foi possível carregar categorias e locais.
          </Text>
          <ActionButton
            label="Tentar novamente"
            onPress={() => void loadForm()}
            variant="secondary"
          />
        </SurfaceCard>
      )}
      {state.status === 'ready' && isEditing && !state.request && (
        <SurfaceCard>
          <Text style={styles.sectionTitle}>Solicitação não encontrada</Text>
          <Text style={styles.sectionHint}>
            Este registro pode não estar mais disponível neste aparelho.
          </Text>
        </SurfaceCard>
      )}
      {state.status === 'ready' && state.request && !isEditable && (
        <SurfaceCard>
          <Text style={styles.sectionTitle}>Edição indisponível</Text>
          <Text style={styles.sectionHint}>
            Solicitações só podem ser editadas enquanto estão com status
            “Recebida”.
          </Text>
          <ActionButton
            label="Voltar ao detalhe"
            onPress={() =>
              navigation.replace('RequestDetails', {
                id: String(state.request?.id),
              })
            }
            variant="secondary"
          />
        </SurfaceCard>
      )}
      {state.status === 'ready' &&
      (!isEditing || isEditable) &&
      state.categories.length > 0 &&
      state.points.length > 0 ? (
        <>
          <SurfaceCard>
            <Text style={styles.label}>Categoria</Text>
            <View style={styles.choices}>
              {state.categories.map((category) => (
                <Pressable
                  key={category.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: category.id === categoryId }}
                  onPress={() => setCategoryId(category.id)}
                  style={[
                    styles.choice,
                    category.id === categoryId && styles.choiceSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      category.id === categoryId && styles.choiceTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Local do piloto</Text>
            <Text style={styles.sectionHint}>
              Selecione o ponto monitorado mais próximo do problema.
            </Text>
            <View style={styles.choices}>
              {state.points.map((point) => (
                <Pressable
                  key={point.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: point.id === pointId }}
                  onPress={() => setPointId(point.id)}
                  style={[
                    styles.choice,
                    point.id === pointId && styles.choiceSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      point.id === pointId && styles.choiceTextSelected,
                    ]}
                  >
                    {point.neighborhood} · {point.subprefecture}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Título</Text>
            <TextInput
              accessibilityLabel="Título da solicitação"
              autoCapitalize="sentences"
              maxLength={TITLE_LIMIT}
              onChangeText={setTitle}
              placeholder="Ex.: Bueiro obstruído na rua"
              placeholderTextColor={theme.colors.muted}
              returnKeyType="next"
              style={styles.field}
              value={title}
            />
            <Text style={styles.counter}>
              {title.length}/{TITLE_LIMIT}
            </Text>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              accessibilityLabel="Descrição da solicitação"
              autoCapitalize="sentences"
              maxLength={DESCRIPTION_LIMIT}
              multiline
              onChangeText={setDescription}
              placeholder="Descreva o problema com detalhes úteis."
              placeholderTextColor={theme.colors.muted}
              style={[styles.field, styles.multiline]}
              value={description}
            />
            <Text style={styles.counter}>
              {description.length}/{DESCRIPTION_LIMIT}
            </Text>
          </SurfaceCard>
          {validationMessage ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {validationMessage}
            </Text>
          ) : null}
          {actionError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {actionError}
            </Text>
          ) : null}
          <Text style={styles.notice}>
            O registro será salvo apenas neste aparelho para demonstração; ele
            não será enviado à Prefeitura. Não inclua informações pessoais ou
            sensíveis.
          </Text>
          <ActionButton
            label={
              isSaving
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar alterações'
                  : 'Criar solicitação'
            }
            onPress={() => void submitRequest()}
            disabled={isSaving}
          />
        </>
      ) : null}
      {state.status === 'ready' &&
      (state.categories.length === 0 || state.points.length === 0) ? (
        <SurfaceCard>
          <Text style={styles.sectionHint}>
            Não há categorias ou locais ativos disponíveis para o formulário.
          </Text>
        </SurfaceCard>
      ) : null}
    </ScreenFrame>
  );
}
