# 🤖 Zwette - Agente IA WhatsApp + Magazord

Sistema inteligente de atendimento automatizado via WhatsApp integrado com a API do Magazord (Dana Jalecos).

## 🎯 Funcionalidades

- ✅ **Atendimento 24/7** via WhatsApp com IA
- ✅ **Integração Magazord** - dados dinâmicos em tempo real
- ✅ **Processamento inteligente** de mensagens com ChatGPT
- ✅ **Respostas personalizadas** baseadas em dados reais
- ✅ **Busca de produtos** (jalecos e gorros)
- ✅ **Verificação de estoque**
- ✅ **Informações de preços** atualizadas

## 🏗️ Arquitetura

```
zwette/
├── ia/
│   └── processar-mensagem.js      # Processa e interpreta mensagens
├── whatsapp/
│   ├── escutar-mensagens.js       # Escuta mensagens WhatsApp
│   └── enviar-resposta.js         # Envia respostas ao cliente
├── tools/
│   └── magazord-api.js            # Executa requisições Magazord
├── prompts/
│   ├── prompt-entender-mensagem.js    # Prompt IA entender intenção
│   └── prompt-formatar-resposta.js    # Prompt IA formatar resposta
├── .env                           # Credenciais (NÃO commitar!)
├── index.js                       # Entrada principal
└── package.json
```

## 🔄 Fluxo de Funcionamento

1. **Cliente envia mensagem** via WhatsApp
2. **IA interpreta intenção** (usando ChatGPT + prompt)
3. **Monta requisição** estruturada para Magazord
4. **Executa API Magazord** com parâmetros dinâmicos
5. **IA formata resposta** com dados reais
6. **Responde cliente** no WhatsApp

## 📋 Pré-requisitos

- Node.js 18+
- Conta WhatsApp
- API Magazord configurada
- Token ChatGPT ou Gemini

## 🚀 Instalação

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Edite o arquivo `.env` com suas credenciais:
```env
# API MAGAZORD
MAGAZORD_URL=https://danajalecos.painel.magazord.com.br/api
MAGAZORD_USER=seu_usuario
MAGAZORD_PASSWORD=sua_senha

# IA
CHATGPT_API_KEY=seu_token_chatgpt
GEMINI_API_KEY=seu_token_gemini

# WhatsApp
MEU_NUMERO=5583987516699
```

### 3. Iniciar sistema
```bash
npm start
```

### 4. Conectar WhatsApp
- Escaneie o QR Code exibido no terminal
- Aguarde confirmação de conexão
- Pronto! O bot está ativo ✅

## 💬 Exemplos de Uso

**Cliente:** "Tem jaleco branco disponível?"  
**Bot:** Busca jalecos brancos na API → Retorna produtos com preços e estoque

**Cliente:** "Quero ver gorros azuis tamanho M"  
**Bot:** Filtra gorros azuis M → Lista opções disponíveis

**Cliente:** "Quanto custa jaleco?"  
**Bot:** Lista jalecos com preços atualizados

## 🛠️ Tecnologias

- **Baileys** - WhatsApp Web API
- **OpenAI GPT-4** - Processamento de linguagem natural
- **Axios** - Cliente HTTP para Magazord
- **Node.js** - Runtime
- **dotenv** - Gerenciamento de variáveis

## 📊 Estrutura de Dados

### Intenção da IA (JSON)
```json
{
  "acao": "buscar_produtos",
  "parametros": {
    "categoria": "jaleco",
    "cor": "branco",
    "limite": 10
  },
  "intencao_original": "Cliente busca jalecos brancos"
}
```

### Requisição Magazord
Construída dinamicamente baseada na intenção com query params reais.

## ⚠️ Importante

- ❌ **ZERO dados mockados** - tudo vem da API Magazord
- ✅ Dados sempre atualizados e dinâmicos
- ✅ Sessão WhatsApp salva (pasta `auth_info/`)
- ✅ Logs detalhados de cada etapa

## 🔐 Segurança

- Não commitar `.env` no Git
- Credenciais em variáveis de ambiente
- Autenticação básica Magazord

## 📝 Notas

- MVP focado em **jalecos e gorros**
- Expansível para outros produtos
- IA aprende com os prompts configuráveis
