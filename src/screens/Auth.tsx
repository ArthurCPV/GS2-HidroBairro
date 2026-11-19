import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SurfaceCard } from '@/components/SurfaceCard';
import { useAuth } from '@/store/AuthProvider';
import { useTheme } from '@/store/useTheme';

type AuthMode = 'login' | 'signup';
type SignupRole = 'CIDADAO' | 'GESTOR';

export default function AuthScreen() {
  const { signIn, signUp, storageError } = useAuth();
  const { theme } = useTheme();
  const [mode, setMode] = useState<AuthMode>('login');
  const [signupRole, setSignupRole] = useState<SignupRole>('CIDADAO');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ra, setRa] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: theme.spacing.compact,
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
        roleOptions: {
          flexDirection: 'row',
          gap: 8,
        },
        roleOption: {
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
        roleOptionSelected: {
          borderColor: theme.colors.action,
          backgroundColor: theme.colors.actionSurface,
        },
        roleOptionText: {
          color: theme.colors.body,
          fontSize: 14,
          fontWeight: '600',
        },
        roleOptionTextSelected: {
          color: theme.colors.action,
        },
        message: {
          color: theme.colors.body,
          fontSize: 13,
          lineHeight: 19,
        },
        error: {
          color: theme.colors.error,
          fontSize: 14,
          lineHeight: 20,
        },
        link: {
          alignItems: 'center',
          padding: 8,
        },
        linkText: {
          color: theme.colors.action,
          fontSize: 14,
          fontWeight: '700',
          textAlign: 'center',
        },
      }),
    [theme],
  );

  async function submit() {
    const trimmedEmail = email.trim();
    if (
      !trimmedEmail ||
      !password ||
      (mode === 'signup' && name.trim().length < 3)
    ) {
      setError(
        mode === 'signup'
          ? 'Informe nome, e-mail e senha. O nome deve ter ao menos 3 caracteres.'
          : 'Informe seu e-mail e senha.',
      );
      return;
    }
    if (mode === 'signup' && signupRole === 'GESTOR' && !/^\d{6,}$/.test(ra)) {
      setError('Informe um RA numérico com pelo menos 6 dígitos.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (mode === 'signup' && signupRole === 'GESTOR') {
      setError(
        'O cadastro de gestores ficará disponível quando a API validar essa autorização. Nenhuma conta foi criada e o RA não foi enviado.',
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === 'signup') {
        await signUp(name, trimmedEmail, password);
      } else {
        await signIn(trimmedEmail, password);
      }
    } catch (requestError) {
      console.error('Não foi possível autenticar na API Java.', requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível concluir a autenticação.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenFrame
      title={mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
      description="Entre com sua conta HidroBairro para acompanhar alertas e registrar solicitações."
    >
      <SurfaceCard>
        <View style={styles.content}>
          {mode === 'signup' && (
            <>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                accessibilityLabel="Nome"
                autoCapitalize="words"
                maxLength={120}
                onChangeText={setName}
                placeholder="Seu nome"
                placeholderTextColor={theme.colors.muted}
                style={styles.field}
                value={name}
              />
              <Text style={styles.label}>Tipo de conta</Text>
              <View style={styles.roleOptions}>
                {(['CIDADAO', 'GESTOR'] as const).map((role) => (
                  <Pressable
                    key={role}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: signupRole === role }}
                    onPress={() => {
                      setSignupRole(role);
                      setError(null);
                    }}
                    style={[
                      styles.roleOption,
                      signupRole === role && styles.roleOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        signupRole === role && styles.roleOptionTextSelected,
                      ]}
                    >
                      {role === 'CIDADAO' ? 'Cidadão' : 'Gestor'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {signupRole === 'GESTOR' && (
                <>
                  <Text style={styles.label}>RA</Text>
                  <TextInput
                    accessibilityLabel="RA do gestor"
                    autoCapitalize="none"
                    keyboardType="number-pad"
                    onChangeText={setRa}
                    placeholder="Mínimo de 6 dígitos"
                    placeholderTextColor={theme.colors.muted}
                    style={styles.field}
                    value={ra}
                  />
                </>
              )}
            </>
          )}
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            accessibilityLabel="E-mail"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            maxLength={180}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            placeholderTextColor={theme.colors.muted}
            style={styles.field}
            value={email}
          />
          <Text style={styles.label}>Senha</Text>
          <TextInput
            accessibilityLabel="Senha"
            autoCapitalize="none"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            onChangeText={setPassword}
            placeholder="Sua senha"
            placeholderTextColor={theme.colors.muted}
            secureTextEntry
            style={styles.field}
            value={password}
          />
          {mode === 'signup' && signupRole === 'CIDADAO' && (
            <Text style={styles.message}>
              Novas contas de cidadão são criadas pela API Java. Gestores
              provisionados pela administração também podem entrar por aqui.
            </Text>
          )}
          {mode === 'signup' && signupRole === 'GESTOR' && (
            <Text style={styles.message}>
              O RA é solicitado somente para este formulário e não será enviado
              à API. O cadastro ficará bloqueado até a API validar o perfil de
              gestor.
            </Text>
          )}
          {storageError && (
            <Text accessibilityRole="alert" style={styles.error}>
              {storageError}
            </Text>
          )}
          {error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
          <ActionButton
            label={
              isSubmitting
                ? 'Conectando...'
                : mode === 'login'
                  ? 'Entrar'
                  : signupRole === 'GESTOR'
                    ? 'Criar conta de gestor'
                    : 'Criar conta'
            }
            onPress={() => void submit()}
            disabled={isSubmitting}
          />
        </View>
      </SurfaceCard>
      <Text style={styles.message}>
        {mode === 'login'
          ? 'Ainda não tem uma conta?'
          : 'Já possui uma conta?'}
      </Text>
      <View style={styles.link}>
        <Text
          accessibilityRole="link"
          onPress={() => {
            setMode((current) => (current === 'login' ? 'signup' : 'login'));
            setSignupRole('CIDADAO');
            setRa('');
            setError(null);
          }}
          style={styles.linkText}
        >
          {mode === 'login' ? 'Cadastre-se como cidadão' : 'Voltar para entrar'}
        </Text>
      </View>
    </ScreenFrame>
  );
}
