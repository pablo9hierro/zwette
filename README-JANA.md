# 🤖 SISTEMA JANA - Atendimento Humanizado com 4 Blocos

Sistema completo de atendimento automatizado com IA para e-commerce de produtos médicos, dividido em 4 blocos principais.

## 📋 Visão Geral

**Jana** é uma assistente virtual que:
- Captura nome e profissão do cliente
- Filtra produtos de forma inteligente e dinâmica
- Apresenta opções compatíveis com recomendações personalizadas
- Encerra atendimento e transfere para humano quando necessário

---

## 🏗️ Arquitetura - 4 Blocos

### **Bloco 1: Saudação e Identificação** 👋
**Arquivo:** `atendimento/bloco1-identificacao.js`

**Objetivo:** Apresentar a Jana e capturar dados do cliente

**Fluxo:**
1. Jana se apresenta
2. Pergunta o nome do cliente
3. Pergunta a profissão (opcional)
   - Profissões reconhecidas: biomédico, dentista, enfermeiro, esteticista, farmacêutico, fisioterapeuta, médico, nutricionista, pediatra, psicólogo, veterinário
   - Cliente pode pular esta etapa

**Dados capturados:**
- ✅ Nome do cliente (obrigatório)
- ⚪ Profissão (opcional)

---

### **Bloco 2: Filtro Dinâmico e Recomendação** 🔍
**Arquivo:** `atendimento/bloco2-filtro.js`

**Objetivo:** Capturar preferências e montar filtro dinâmico

**Fluxo:**
1. Pergunta tipo de produto (jaleco, scrub, gorro, etc)
   - Se tem profissão, mostra recomendações
2. Pergunta modelo (com lista enumerada)
   - Cliente pode escolher por número ou nome
   - Pode ver até 5 modelos diferentes
3. Pergunta gênero (masculino, feminino, unissex)
4. Pergunta cor (opcional)
   - Cliente pode dizer "qualquer cor" / "tanto faz"

**Dados capturados:**
- ✅ Tipo de produto (obrigatório)
- ✅ Modelo (obrigatório)
- ✅ Gênero (obrigatório para filtro ideal)
- ⚪ Cor (opcional)
- ⚪ Tamanho (opcional)

**Filtro Dinâmico:**
- A IA monta o filtro conforme cliente vai falando
- Não precisa de requisições pré-prontas
- Adapta-se ao que cliente fornece

---

### **Bloco 3: Busca e Apresentação** 📦
**Arquivo:** `atendimento/bloco3-magazord.js`

**Objetivo:** Confirmar busca e apresentar produtos

**Fluxo:**
1. Gera mensagem de confirmação com dados coletados
2. Cliente confirma ("sim", "pode", "busca")
3. Busca no catálogo local com filtros dinâmicos
4. Apresenta produtos formatados:
   - Nome do produto
   - Preço
   - Tecido
   - Link (SEM SKU)
5. Cliente pode:
   - Demonstrar interesse em algum produto
   - Pedir mais opções
   - Mudar filtros

**Funcionalidades:**
- Busca até 10 produtos compatíveis
- Salva histórico de produtos visualizados
- Permite buscar múltiplos modelos numa pesquisa
- Integração com Magazord (preparada para MVP)

---

### **Bloco 4: Encerramento** 🎯
**Arquivo:** `atendimento/bloco4-encerramento.js`

**Objetivo:** Detectar satisfação e encerrar atendimento

**Critérios de Encerramento:**
1. **Satisfação:** Cliente demonstra que gostou
   - "obrigado", "adorei", "perfeito", "vou comprar"
2. **Explícito:** Cliente pede para encerrar
   - "encerrar", "tchau", "até logo"
3. **Inatividade:** Mais de 12 horas sem resposta

**Ação Final:**
- Avisa que conversa será transferida para atendente humano
- Salva resumo da conversa
- Marca atendimento como encerrado
- Payload: `atendimento_encerrado: true`

---

## 🗂️ Estrutura de Arquivos

```
atendimento/
├── contexto-avancado.js         # Sistema de contexto robusto
├── bloco1-identificacao.js      # Bloco 1: Saudação
├── bloco2-filtro.js             # Bloco 2: Filtro dinâmico
├── bloco3-magazord.js           # Bloco 3: Busca e apresentação
├── bloco4-encerramento.js       # Bloco 4: Encerramento
├── lista-enumerada.js           # Sistema de listas numeradas
└── orquestrador-jana.js         # Orquestrador principal

db/
└── schema-atendimento-completo.sql  # Schema do banco de dados

test-jana.js                     # Testes completos do sistema
```

---

## 🗄️ Banco de Dados

### Tabelas Principais

#### `conversations`
```sql
- id (UUID)
- numero_usuario (VARCHAR)
- nome_cliente (VARCHAR)
- profissao (VARCHAR)
- fase_atendimento (VARCHAR) -- identificacao, filtro, confirmacao, busca, encerramento
- atendimento_encerrado (BOOLEAN)
- transferido_humano (BOOLEAN)
- data_ultima_interacao (TIMESTAMP)
- contexto (JSONB)
- preferencias (JSONB)
```

#### `produtos_pesquisados_historico`
```sql
- id (UUID)
- conversa_id (FK)
- numero_usuario (VARCHAR)
- tipo_produto (VARCHAR)
- modelo (VARCHAR)
- cor (VARCHAR)
- tamanho (VARCHAR)
- genero (VARCHAR)
- sku_produto (VARCHAR)
- link_produto (TEXT)
- cliente_interessado (BOOLEAN)
```

#### `profissoes_catalogo`
```sql
- id (UUID)
- nome (VARCHAR)
- sinonimos (TEXT[])
- produtos_recomendados (JSONB)
- arquivo_catalogo (VARCHAR)
```

#### `mensagens_enumeradas`
```sql
- id (UUID)
- conversa_id (FK)
- tipo_lista (VARCHAR) -- tipos_produto, modelos, cores, tamanhos
- itens (JSONB)
- referente_a (VARCHAR)
- cliente_respondeu (BOOLEAN)
```

---

## 🚀 Como Usar

### 1. Configurar Banco de Dados

```bash
# Executar script SQL no Supabase
psql -h [seu-host] -U [seu-user] -d [seu-db] -f db/schema-atendimento-completo.sql
```

### 2. Configurar Variáveis de Ambiente

```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-aqui
```

### 3. Integrar no WhatsApp

```javascript
import processarAtendimentoJana from './atendimento/orquestrador-jana.js';

// No handler de mensagem do WhatsApp
async function handleMessage(mensagem, numeroUsuario) {
  const resposta = await processarAtendimentoJana(mensagem, numeroUsuario);
  await enviarMensagemWhatsApp(numeroUsuario, resposta);
}
```

### 4. Testar Sistema

```bash
# Teste completo
node test-jana.js completo

# Teste apenas Bloco 1
node test-jana.js bloco1

# Teste com profissão
node test-jana.js profissao

# Todos os testes
node test-jana.js todos
```

---

## 💡 Exemplo de Conversa

```
👤 Cliente: Olá
🤖 Jana: Olá! 👋 Meu nome é Jana e estou aqui para te ajudar a encontrar 
         o produto perfeito para você em nosso site! Como posso te chamar? 😊

👤 Cliente: Maria
🤖 Jana: Legal, Maria! 😊 Para te ajudar melhor, você é profissional de qual área?

👤 Cliente: Sou enfermeira
🤖 Jana: Perfeito, Maria! Vi que você é da área de enfermagem! 👏
         Vou te mostrar opções que são perfeitas para sua área! Vamos começar?

👤 Cliente: Sim
🤖 Jana: 📦 Que tipo de produto você está procurando?
         ✨ Recomendados para enfermagem:
         1️⃣ Scrub ⭐
         2️⃣ Jaleco ⭐
         3️⃣ Touca ⭐
         [...]

👤 Cliente: 1
🤖 Jana: Ótima escolha! Para Scrub, temos estes modelos:
         1️⃣ Beatriz
         2️⃣ Charlotte
         [...]

👤 Cliente: 5
🤖 Jana: Perfeito! Modelo Charlotte anotado! 👍
         Você prefere modelo masculino, feminino ou unissex?

👤 Cliente: feminino
🤖 Jana: Legal! Qual cor você prefere para o Scrub Charlotte?
         1️⃣ Azul
         2️⃣ Verde
         [...]

👤 Cliente: azul
🤖 Jana: Perfeito! Então vou buscar:
         📦 Produto: Scrub
         👔 Modelo: Charlotte
         ⚧️ Gênero: feminino
         🎨 Cor: azul
         Posso buscar pra você? 🔍

👤 Cliente: sim
🤖 Jana: 🎉 Encontrei 3 opções perfeitas para você!
         1. Scrub Feminino Charlotte Azul
         💰 R$ 129,90
         🧵 Tecido: Microfibra Premium
         🔗 https://danajalecos.com.br/...
         [...]

👤 Cliente: Adorei! Obrigada
🤖 Jana: Que ótimo que você gostou, Maria! 😊✨
         Nossa conversa vai ser transferida para um atendente humano 
         que vai te ajudar a finalizar a compra!
         Foi um prazer te atender! 🎉
```

---

## 🎯 Recursos Principais

### ✅ Filtro Dinâmico
- Monta filtro conforme cliente fala
- Não precisa de todas as informações de uma vez
- Adapta-se ao nível de certeza do cliente

### ✅ Listas Enumeradas
- Cliente pode responder com número ou nome
- Facilita escolha em catálogos grandes
- Salva histórico de listas enviadas

### ✅ Recomendações por Profissão
- Produtos mais relevantes aparecem primeiro
- Usa catálogos específicos por profissão
- Aumenta taxa de conversão

### ✅ Memória de Contexto
- Mantém histórico completo da conversa
- Permite voltar e mudar preferências
- Rastreia tudo que cliente mencionou

### ✅ Encerramento Inteligente
- Detecta satisfação automaticamente
- Gerencia inatividade (12h)
- Transfere para humano no momento certo

---

## 📊 Payload do Contexto

```javascript
{
  // IDENTIFICAÇÃO
  nomeCliente: "Maria",
  profissao: "enfermeiro",
  profissaoConfirmada: true,
  
  // FILTROS
  tipoProduto: "scrub",
  modelo: "Charlotte",
  genero: "feminino",
  cor: "azul",
  tamanho: null,
  modelosSolicitados: ["Charlotte", "Beatriz"], // Até 5
  
  // CONTROLE
  faseAtual: "pos-busca",
  aguardandoResposta: null,
  confirmacaoPendente: false,
  
  // HISTÓRICO
  produtosPesquisados: [...],
  buscaRealizada: true,
  totalBuscas: 2,
  
  // ENCERRAMENTO
  clienteSatisfeito: true,
  atendimentoEncerrado: false,
  motivoEncerramento: null
}
```

---

## 🔧 Manutenção

### Adicionar Nova Profissão

```sql
INSERT INTO profissoes_catalogo (nome, sinonimos, produtos_recomendados) VALUES
('nova_profissao', 
 ARRAY['sinonimo1', 'sinonimo2'], 
 '["jaleco", "scrub"]'::jsonb);
```

### Verificar Conversas Inativas

```sql
SELECT * FROM verificar_inatividade_atendimento();
```

### Dashboard de Atendimentos

```sql
SELECT * FROM dashboard_atendimentos;
```

---

## 🐛 Troubleshooting

**Problema:** Jana não reconhece profissão
- Verificar tabela `profissoes_catalogo`
- Adicionar sinônimos se necessário

**Problema:** Não encontra produtos
- Verificar se arquivo JSON do produto existe em `catalogos/produtos/`
- Conferir estrutura do JSON (deve ter `produtos`, `modelos`, etc)

**Problema:** Lista enumerada não funciona
- Cliente pode responder com número OU nome
- Verificar se lista foi salva em `mensagens_enumeradas`

---

## 📝 Próximos Passos (Pós-MVP)

1. ✅ Integração completa com Magazord API
2. ✅ Verificação de estoque em tempo real
3. ✅ Sistema de pagamento integrado
4. ✅ Transferência automática para GHL (Go High Level)
5. ✅ Analytics e métricas de conversão
6. ✅ A/B testing de mensagens
7. ✅ Multi-idioma

---

## 👥 Suporte

Para dúvidas ou problemas:
- Verificar logs no console
- Consultar tabela `conversations` no Supabase
- Executar testes: `node test-jana.js todos`

---

**Desenvolvido com ❤️ para otimizar atendimento e vendas**
