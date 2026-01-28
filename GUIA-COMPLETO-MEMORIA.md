# 🎯 GUIA COMPLETO - SISTEMA DE MEMÓRIA + PREÇOS

## 📋 O QUE FOI IMPLEMENTADO

### ✅ Sistema de Memória com Supabase
- **Conversa persistente** por 30 minutos
- **Contexto automático** - IA lembra das últimas 5 mensagens
- **Resumos inteligentes** da conversa
- **Detecção de encerramento** - cliente pode dizer "tchau" e finalizar

### ✅ Preços dos Produtos
- **API correta**: `/v1/listPreco` do Magazord
- **Dados completos**: precoVenda, precoAntigo, percentualDesconto
- **Integração automática** com busca de produtos

### ✅ IA Mais Inteligente
- **Novo prompt** que usa contexto da conversa
- **Análise de tom** emocional do cliente
- **Respostas contextualizadas** - não "esquece" o que foi dito

---

## 🚀 INSTALAÇÃO

### 1. Instalar dependência do Supabase

```bash
npm install @supabase/supabase-js
```

### 2. Configurar Supabase

#### a) Criar conta no Supabase (se ainda não tem)
1. Acesse: https://supabase.com
2. Crie um novo projeto (nome: `dana-jalecos-bot` por exemplo)
3. Aguarde criação do banco (1-2 minutos)

#### b) Copiar credenciais
No painel do Supabase:
- **Settings** → **API**
- Copie:
  - `Project URL` (ex: https://abc123.supabase.co)
  - `anon/public` key (começa com `eyJ...`)

#### c) Criar tabela no banco
No Supabase:
- **SQL Editor** → **New Query**
- Cole o conteúdo de [`db/schema-supabase.sql`](db/schema-supabase.sql)
- Clique em **Run**

### 3. Configurar variáveis de ambiente

Edite seu arquivo `.env`:

```env
# API MAGAZORD
MAGAZORD_URL=https://danajalecos.painel.magazord.com.br/api
MAGAZORD_USER=seu_usuario
MAGAZORD_PASSWORD=sua_senha
MAGAZORD_TABELA_PRECO_ID=1

# SUPABASE (Sistema de Memória)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=eyJ...sua_chave_anon

# IA TOKENS
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# WhatsApp
MEU_NUMERO=5583987516699
```

### 4. Descobrir ID da Tabela de Preço

Você precisa saber qual tabela de preço usar no Magazord:

**Opção 1 - Pelo painel:**
1. Acesse o painel Magazord
2. **Produtos** → **Tabelas de Preço**
3. Anote o ID da tabela padrão (geralmente é `1`)

**Opção 2 - Pela API:**
```bash
# Listar todas as tabelas
curl -u usuario:senha https://danajalecos.painel.magazord.com.br/api/v1/tabelaPreco
```

Atualize no `.env`:
```env
MAGAZORD_TABELA_PRECO_ID=1  # ou o ID correto
```

---

## 🔍 COMO FUNCIONA

### Fluxo de Conversa:

```
Cliente: "oi, tem jaleco branco?"
  ↓
[ETAPA 0] Busca memória → Nova conversa
  ↓
[ETAPA 1] IA analisa → acao: "buscar_produto", parametros: {nome: "jaleco branco"}
  ↓
[ETAPA 2] Busca no Magazord:
  - GET /v2/site/produto (lista produtos)
  - GET /v1/listPreco (busca preços)
  - Junta preço + produto
  ↓
[ETAPA 3] Formata resposta com preços
  ↓
[ETAPA 4] Salva no Supabase:
  - Mensagem do cliente
  - Resposta da IA
  - Contexto: "Cliente quer jaleco branco"
  ↓
Envia resposta no WhatsApp
```

**Segunda mensagem (30min depois):**
```
Cliente: "tem tamanho M?"
  ↓
[ETAPA 0] Busca memória → Conversa ativa encontrada!
  - Histórico: "Cliente quer jaleco branco"
  ↓
[ETAPA 1] IA entende contexto → "ele quer jaleco branco tamanho M"
  ↓
... continua fluxo com CONTEXTO
```

### Estrutura de Arquivos Criados:

```
zwette/
├── db/
│   ├── supabase.js              # Cliente Supabase
│   ├── memoria-conversa.js      # Funções de memória
│   └── schema-supabase.sql      # SQL para criar tabela
│
├── ia/
│   ├── processar-mensagem.js    # REESCRITO com memória
│   └── prompt-atendimento-principal.js  # Novo prompt com contexto
│
├── tools/
│   └── buscar-produto/
│       └── executar-buscar-produto.js  # ATUALIZADO com preços
│
└── .env.example                 # Template atualizado
```

---

## 🧪 TESTANDO

### 1. Testar Conexão Supabase

Crie um arquivo `test-supabase.js`:

```javascript
import { supabase } from './db/supabase.js';

async function testar() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .limit(5);
    
  if (error) {
    console.error('❌ Erro:', error);
  } else {
    console.log('✅ Conexão OK!');
    console.log('📊 Conversas:', data.length);
  }
}

testar();
```

Execute:
```bash
node test-supabase.js
```

### 2. Testar Busca de Preços

Crie `test-precos.js`:

```javascript
import axios from 'axios';
import 'dotenv/config';

const tabelaPrecoId = process.env.MAGAZORD_TABELA_PRECO_ID || 1;

async function buscarPrecos() {
  try {
    const response = await axios.get(
      `${process.env.MAGAZORD_URL}/v1/listPreco`,
      {
        params: { tabelaPreco: tabelaPrecoId, limit: 5 },
        auth: {
          username: process.env.MAGAZORD_USER,
          password: process.env.MAGAZORD_PASSWORD
        }
      }
    );
    
    console.log('✅ Preços encontrados:');
    response.data.data.forEach(item => {
      console.log(`- ${item.produtoNome}: R$ ${item.precoVenda}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

buscarPrecos();
```

Execute:
```bash
node test-precos.js
```

### 3. Testar Sistema Completo

Envie mensagens pelo WhatsApp:

**Teste 1 - Nova conversa:**
```
Você: oi, tem jaleco branco?
Bot: [Lista produtos COM PREÇO]
```

**Teste 2 - Continuação (dentro de 30min):**
```
Você: tem tamanho M?
Bot: [IA sabe que você quer jaleco branco tamanho M]
```

**Teste 3 - Encerramento:**
```
Você: obrigado, tchau!
Bot: Foi um prazer... [encerra conversa]
```

**Teste 4 - Nova conversa (depois de 30min):**
```
Você: oi
Bot: [Trata como NOVA conversa]
```

---

## 🐛 RESOLUÇÃO DE PROBLEMAS

### Problema 1: "Unable to resolve nonexistent file supabase.js"
**Solução:** Execute `npm install @supabase/supabase-js`

### Problema 2: Supabase não salva conversas
**Diagnóstico:**
```bash
# Verificar se tabela existe
node test-supabase.js
```
**Solução:** Execute o SQL em `db/schema-supabase.sql` no Supabase SQL Editor

### Problema 3: Preços não aparecem
**Diagnóstico:**
1. Verifique `MAGAZORD_TABELA_PRECO_ID` no `.env`
2. Execute `node test-precos.js`

**Soluções possíveis:**
- Tabela de preço ID incorreto → Consulte painel Magazord
- Produtos sem preço cadastrado → Cadastre preços no Magazord
- API retorna vazio → Verifique permissões do usuário API

### Problema 4: IA "burra" / sem contexto
**Diagnóstico:**
```bash
# Ver logs do servidor
node index.js
```

Procure por:
```
💾 Etapa 0: Buscando memória da conversa...
✨ Nova conversa iniciada!
```

Se NÃO aparecer, significa que o código antigo ainda está rodando.

**Solução:** Pare o servidor (Ctrl+C) e inicie novamente:
```bash
node index.js
```

### Problema 5: Erro "SUPABASE_URL is not defined"
**Solução:** Verifique se o `.env` tem as variáveis:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=eyJ...
```

---

## 📊 MONITORAMENTO

### Ver conversas no Supabase
1. Painel Supabase → **Table Editor**
2. Selecione tabela `conversations`
3. Veja:
   - `numero_usuario`: Número WhatsApp
   - `ultima_mensagem_em`: Quando foi a última msg
   - `resumo`: O que o cliente está pedindo
   - `contexto`: Histórico completo (JSON)
   - `ativa`: true/false (se conversa ainda está ativa)

### Logs importantes no console:

```
✨ Nova conversa iniciada!  → Cliente novo ou passou 30min
📚 Conversa em andamento (3 mensagens)  → Cliente com contexto
✅ Análise: acao: buscar_produto  → IA identificou busca
💰 Buscando preços para 8 derivações...  → Buscando preços
✅ Preços adicionados aos produtos!  → Preços OK
💾 Salvando na memória...  → Gravando conversa
✅ Conversa salva!  → Tudo OK
```

---

## 🎓 ENTENDENDO A ARQUITETURA

### Antes (SEM memória):
```
Mensagem 1: "oi, tem jaleco?"
  → IA: busca jaleco
  → Responde
  → ESQUECE TUDO ❌

Mensagem 2: "tem tamanho M?"
  → IA: "tamanho M de quê??" ❌
```

### Agora (COM memória):
```
Mensagem 1: "oi, tem jaleco?"
  → IA: busca jaleco
  → Responde
  → SALVA: "Cliente quer jaleco" ✅

Mensagem 2: "tem tamanho M?"
  → CARREGA: "Cliente quer jaleco"
  → IA: "ele quer jaleco tamanho M!" ✅
  → Busca jaleco tamanho M
```

### Fluxo de Preços:

**Antes:**
```
GET /v2/site/produto
  → Retorna: {derivacoes: [{id, codigo, nome}]}
  → SEM PREÇO ❌
```

**Agora:**
```
1. GET /v2/site/produto
     → {derivacoes: [{codigo: "JAL001"}]}
     
2. GET /v1/listPreco?tabelaPreco=1
     → {data: [{produto: "JAL001", precoVenda: 89.90}]}
     
3. JUNTA OS DADOS:
     → {derivacoes: [{codigo: "JAL001", precoVenda: 89.90}]} ✅
```

---

## 🔒 SEGURANÇA

### ⚠️ NUNCA FAÇA COMMIT DE:
- Arquivo `.env` (já está no `.gitignore`)
- Chaves da API (`SUPABASE_KEY`, `OPENAI_API_KEY`, etc)
- Senhas do Magazord

### ✅ SEMPRE USE:
- `.env.example` com valores de exemplo
- Variáveis de ambiente no Railway/Vercel para produção

---

## 📱 DEPLOY EM PRODUÇÃO

### No Railway/Vercel, adicione as variáveis:

```
MAGAZORD_URL=...
MAGAZORD_USER=...
MAGAZORD_PASSWORD=...
MAGAZORD_TABELA_PRECO_ID=1

SUPABASE_URL=...
SUPABASE_KEY=...

OPENAI_API_KEY=...
MEU_NUMERO=...
```

### Importante:
- Supabase é GRÁTIS até 500MB de banco
- Conversas antigas são mantidas (não apaga automático)
- Se quiser limpar: SQL Editor → `DELETE FROM conversations WHERE ativa = false;`

---

## 📚 PRÓXIMOS PASSOS

### Melhorias Possíveis:

1. **Dashboard de conversas**
   - Ver todas as conversas
   - Análise de produtos mais buscados
   - Horários de maior movimento

2. **Respostas personalizadas**
   - Usar histórico para recomendar produtos
   - "Cliente já comprou jaleco P, oferecer calça P também"

3. **Multi-loja**
   - Se tiver várias lojas, filtrar por localização
   - "Tem jaleco na loja do centro?"

4. **Integração com estoque**
   - Mostrar disponibilidade REAL
   - "Temos 3 unidades do jaleco M"

---

## ❓ DÚVIDAS FREQUENTES

**Q: Posso usar PostgreSQL local ao invés de Supabase?**
A: Sim! Substitua `db/supabase.js` por conexão com `pg` (PostgreSQL client)

**Q: E se o cliente enviar mensagem 31 minutos depois?**
A: Sistema cria NOVA conversa (contexto zerado)

**Q: Posso mudar a janela de 30 minutos?**
A: Sim! Em `db/memoria-conversa.js` altere `JANELA_CONTEXTO_MINUTOS`

**Q: Quantas mensagens a IA lembra?**
A: Últimas 5 mensagens. Altere `MAX_MENSAGENS_CONTEXTO` se quiser mais.

**Q: E se a tabela de preço mudar?**
A: Atualize `MAGAZORD_TABELA_PRECO_ID` no `.env` e reinicie servidor

**Q: Preços são atualizados em tempo real?**
A: Sim! Busca sempre da API do Magazord, sem cache.

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] `npm install @supabase/supabase-js`
- [ ] Criar projeto no Supabase
- [ ] Executar SQL `db/schema-supabase.sql`
- [ ] Configurar `.env` com credenciais Supabase
- [ ] Descobrir `MAGAZORD_TABELA_PRECO_ID`
- [ ] Testar com `test-supabase.js`
- [ ] Testar com `test-precos.js`
- [ ] Reiniciar servidor WhatsApp
- [ ] Enviar mensagem teste
- [ ] Verificar Supabase Table Editor (conversa salva?)
- [ ] Enviar segunda mensagem (IA lembra contexto?)
- [ ] Verificar se PREÇOS aparecem nas respostas

---

**Criado em:** 2025-01-15  
**Versão:** 2.0 (Sistema de Memória + Preços)
