# 💧 HidroBairro Sul

Aplicativo mobile desenvolvido em **React Native com Expo** para acompanhar alertas de alagamento e pontos de monitoramento da Zona Sul de São Paulo, além de permitir que moradores registrem solicitações de zeladoria.

Entrega do projeto de **Mobile Application Development** da **Global Solution 2026/2 (CitizenTech) · FIAP**. O aplicativo integra autenticação, navegação mobile, consumo de APIs REST, gerenciamento de estado e operações de cadastro, consulta, edição e cancelamento de dados.

---

## 🎯 Objetivo do Projeto

O HidroBairro aproxima moradores e a gestão pública por meio de uma aplicação centralizada: o cidadão acompanha alertas e pontos monitorados e registra problemas de zeladoria (como bueiros entupidos); o gestor acompanha a fila de solicitações e conduz o atendimento.

A aplicação permite:

* autenticar usuários pela API Java com token JWT;
* consultar pontos de monitoramento e alertas de alagamento;
* visualizar os pontos em um mapa e centralizá-lo na localização do usuário (opcional);
* tirar dúvidas com o assistente de IA da API Java;
* criar, consultar, editar e cancelar solicitações de zeladoria pela API .NET;
* diferenciar as permissões de cidadãos e gestores.

---

## 🧠 Funcionalidades Principais

| Funcionalidade | Descrição |
| --- | --- |
| ✅ Cadastro de usuário | Criação de conta pela API Java |
| ✅ Login real | API Java com autenticação JWT, para cidadãos e gestores |
| ✅ Persistência de sessão | Token guardado no `expo-secure-store` (no navegador, `sessionStorage`) |
| ✅ Proteção de rotas | Telas internas disponíveis somente após autenticação |
| ✅ Logout | Limpa o token e retorna à tela de acesso |
| ✅ Visão geral | Resumo de pontos monitorados, alertas ativos e solicitações abertas |
| ✅ Mapa | Pontos de monitoramento com cor conforme o alerta ativo; localização opcional |
| ✅ Alertas | Lista de alertas ativos/encerrados e tela de detalhe com a leitura associada |
| ✅ Orientação por IA | Perguntas enviadas à API Java, que responde com base nos dados do sistema |
| ✅ Solicitações (CRUD) | Criar, consultar, editar e cancelar, com histórico de status |
| ✅ Painel do gestor | Fila de solicitações, filtro por status e avanço do atendimento |
| ✅ Tema claro/escuro | Alternância pelo menu lateral, preferência salva no aparelho |
| ✅ Estados de carregamento e erro | Indicadores, mensagens e botão "Tentar novamente" nas telas |

---

## 🔐 Autenticação e Permissões

O fluxo de autenticação utiliza duas camadas:

1. **API Java**, responsável pelo cadastro, validação de credenciais e emissão do token JWT.
2. **Armazenamento local seguro**, que mantém o token da sessão (`expo-secure-store` no Android/iOS).
Ao abrir o aplicativo, o token salvo é decodificado e sua validade é conferida; se estiver expirado ou inválido, ele é removido e o usuário volta à tela de acesso.

Contas de **cidadão** são criadas pela tela de cadastro. Contas de **gestor** são provisionadas pela administração, que fornece o login e a senha; o gestor entra pela mesma tela de login.

### Perfis

| Perfil | Permissões principais |
| --- | --- |
| Cidadão | Consulta alertas e mapa; cria, edita e cancela as próprias solicitações enquanto estiverem "Recebida" |
| Gestor | Consulta toda a fila de solicitações, filtra por status, inicia vistoria, conclui e cancela solicitações em vistoria |

> O aplicativo oculta as ações restritas por perfil, mas a autorização definitiva deve ser aplicada pelas APIs no servidor.

---

## 🗺️ Telas

| Tela | Descrição |
| --- | --- |
| Acesso | Login e cadastro |
| Início | Visão geral do sistema, dados da conta e logout |
| Mapa | Pontos de monitoramento e localização do usuário |
| Alertas | Lista de alertas ativos e encerrados |
| Detalhe do alerta | Gravidade, ponto, leitura associada e datas |
| Orientação | Chat com a IA da API Java |
| Solicitações / Painel | Lista do cidadão ou fila do gestor |
| Nova / Editar solicitação | Formulário de solicitação de zeladoria |
| Detalhe da solicitação | Protocolo, status, histórico, edição e cancelamento |

A navegação usa **React Navigation**: uma pilha nativa (autenticação e telas de detalhe) e um navegador de abas com menu lateral para as áreas principais.

---

## 📍 Mapa e Localização

* No Android/iOS o mapa usa `react-native-maps`; no navegador, um mapa incorporado do OpenStreetMap.
* A localização só é solicitada quando o usuário toca em **Usar minha localização**. A escolha fica salva no aparelho (`AsyncStorage`) e pode ser desfeita a qualquer momento.
* Sem permissão, o mapa permanece na área da Zona Sul.

---

## 📁 Estrutura de Pastas

```txt
GS2-HidroBairro/
├── assets/
├── src/
│   ├── components/
│   │   ├── ActionButton.tsx
│   │   ├── DataSummary.tsx
│   │   ├── RiskMap.tsx
│   │   ├── RiskMapNative.tsx
│   │   ├── RiskMapWeb.tsx
│   │   ├── RiskMapTypes.ts
│   │   ├── RoutePlaceholder.tsx
│   │   ├── ScreenFrame.tsx
│   │   ├── SidebarTabBar.tsx
│   │   ├── StartupScreen.tsx
│   │   └── SurfaceCard.tsx
│   ├── constants/
│   │   └── map.ts
│   ├── data/
│   │   └── demoData.ts
│   ├── navigation/
│   │   └── Home.tsx
│   ├── screens/
│   │   ├── AI.tsx
│   │   ├── AlertDetails.tsx
│   │   ├── Alerts.tsx
│   │   ├── Auth.tsx
│   │   ├── Home.tsx
│   │   ├── Map.tsx
│   │   ├── NewRequest.tsx
│   │   ├── RequestDetails.tsx
│   │   └── Requests.tsx
│   ├── services/
│   │   ├── apiClient.ts
│   │   ├── authStorage.ts
│   │   ├── authStorage.web.ts
│   │   ├── DotNetApiDataSource.ts
│   │   ├── HidroBairroDataSource.ts
│   │   ├── JavaApiDataSource.ts
│   │   └── ServiceRequestRepository.ts
│   ├── store/
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── useTheme.ts
│   ├── styles/
│   │   ├── global.ts
│   │   └── theme.ts
│   └── types/
│       ├── domain.ts
│       ├── index.ts
│       ├── map.ts
│       └── navigation.ts
├── App.tsx
├── app.json
├── index.ts
├── package.json
├── eslint.config.js
└── tsconfig.json
```

---

## ✔️ Arquitetura

O projeto separa as responsabilidades em camadas:

* `screens/`: telas e fluxos da aplicação;
* `components/`: componentes reutilizáveis (botões, cartões, mapa, menu lateral);
* `services/`: acesso às APIs com `fetch`, conversão e validação dos dados recebidos;
* `store/`: contextos de autenticação e tema;
* `navigation/`: configuração das abas;
* `styles/`: tema claro/escuro e estilos compartilhados;
* `types/`: tipos de domínio e de navegação;
* `constants/` e `data/`: constantes do mapa e dados de apoio.
As telas não conhecem os detalhes das APIs: elas chamam `HidroBairroDataSource`, que escolhe a origem dos dados e delega às classes `JavaApiDataSource` e `DotNetApiDataSource`. O `apiClient` concentra a chamada `fetch`, o cabeçalho `Authorization`, o tempo limite e o tratamento de erros.

---

## 🔗 Integração Backend

O aplicativo consome duas APIs REST publicadas no Render:

| API | Responsabilidade | Endereço padrão |
| --- | --- | --- |
| Java | Autenticação, usuários, pontos, leituras, alertas e IA | `https://hidrobairro-java-gs2.onrender.com` |
| .NET | Categorias e solicitações de zeladoria | `https://hidrobairro-api-dotnet.onrender.com` |

Os endereços podem ser sobrescritos por `EXPO_PUBLIC_JAVA_API_URL` e `EXPO_PUBLIC_DOTNET_API_URL`.

### API Java

```http
POST /api/auth/login
POST /api/usuarios
GET  /api/pontos-monitoramento
GET  /api/leituras
GET  /api/alertas
POST /api/ia/orientacoes
```

### API .NET

```http
GET   /api/categorias
GET   /api/solicitacoes
GET   /api/solicitacoes/{id}
POST  /api/solicitacoes
PUT   /api/solicitacoes/{id}
POST  /api/solicitacoes/{id}/cancelar
PATCH /api/solicitacoes/{id}/status
GET   /api/solicitacoes/{id}/historico
```

Todas as operações protegidas enviam o token JWT no cabeçalho `Authorization`. A criação de solicitações envia um `Idempotency-Key` para evitar duplicidade em caso de reenvio.

> As APIs estão em hospedagem gratuita e podem levar alguns segundos na primeira requisição após um período sem uso. O aplicativo aguarda até 60 segundos antes de exibir um erro.

---

## 🚀 Como Utilizar o Aplicativo

1. Crie uma conta de cidadão ou entre com suas credenciais (gestores usam o login recebido da administração).
2. Veja a visão geral na tela inicial.
3. Abra o **Mapa** e, se quiser, toque em **Usar minha localização**.
4. Consulte os **Alertas** e abra um deles para ver o detalhe.
5. Pergunte algo na tela de **Orientação**.
6. Em **Solicitações**, toque em **Nova solicitação**, escolha categoria e local e preencha título e descrição.
7. Abra o protocolo para acompanhar o histórico, editar ou cancelar (enquanto "Recebida").
8. Como gestor, use o **Painel** para filtrar a fila e avançar o atendimento.
9. Use **Sair da sessão** na tela inicial para encerrar o acesso.

---

## ▶️ Como Executar o Projeto

### Pré-requisitos

* Node.js e npm;
* Expo Go em um dispositivo Android/iOS ou um emulador compatível;
* APIs Java e .NET acessíveis.
Para usar outras instâncias das APIs, crie um arquivo `.env.local` na raiz:

```env
EXPO_PUBLIC_JAVA_API_URL=https://seu-endereco-da-api-java
EXPO_PUBLIC_DOTNET_API_URL=https://seu-endereco-da-api-dotnet
```

Os endereços devem apontar para a raiz de cada API, sem `/api`.

### Clonando o repositório

```bash
git clone <url-do-repositorio>
cd GS2-HidroBairro
```

### Instalando dependências

```bash
npm install
```

### Executando

```bash
npm start
```

Ou:

```bash
npm run android
npm run ios
npm run web
```

Depois, leia o QR Code com o Expo Go ou execute em um emulador. O mapa nativo (`react-native-maps`) pode exigir um *development build*.

### Qualidade do código

```bash
npm run lint
npx tsc --noEmit
```

---

## 👥 Integrantes

| Nome | GitHub | RM |
| --- | --- | --- |
| Arthur Cabral | [ArthurCPV](https://github.com/ArthurCPV) | 566515 |
| Bruno Martins | [TaikaWaititi](https://github.com/TaikaWaititi) | 564939 |
| José Diogo | [ZeDio](https://github.com/ZeDio) | 562341 |
| Júlia Tiziotto | [JuliaTButtler](https://github.com/JuliaTButtler) | 564975 |
| Mariana Xavier | [Marixavq](https://github.com/Marixavq) | 566357 |

---

## 📁 Acesso ao Projeto

### Repositório GitHub

[Abrir o repositório do projeto no GitHub](https://github.com/ArthurCPV/GS2-HidroBairro)

### Vídeo demonstrativo

[Assistir à demonstração no YouTube](https://youtu.be/nE4zYG1QAK8)

---

## 📄 Licença

Projeto desenvolvido exclusivamente para fins acadêmicos e educacionais como parte da Global Solution 2026/2 da FIAP.
