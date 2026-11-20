import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SurfaceCard } from '@/components/SurfaceCard';
import { useAuth } from '@/store/AuthProvider';
import { useTheme } from '@/store/useTheme';

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp, storageError } = useAuth();
  const { theme } = useTheme();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    if (mode === 'signup' && password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
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
            setError(null);
          }}
          style={styles.linkText}
        >
          {mode === 'login' ? 'Cadastre-se' : 'Voltar para entrar'}
        </Text>
      </View>
    </ScreenFrame>
  );
}