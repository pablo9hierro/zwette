# ATUALIZAÇÃO: Remoção da Lógica de Profissão

## Data: 27/01/2026

## Mudanças Realizadas

### 1. Arquivos Deletados
- ❌ `catalogos/profissao/` (pasta completa com 11 arquivos JSON)
  - biomedico.json
  - dentista.json
  - enfermeiro.json
  - esteticista.json
  - farmaceutico.json
  - fisioterapeuta.json
  - medico.json
  - nutricionista.json
  - pediatra.json
  - psicologo.json
  - veterinario.json

### 2. Arquivos Atualizados
- ✅ `catalogos/produtos/*.json` - Todos os catálogos atualizados com novos dados
- ✅ `atendimento/orquestrador-4blocos.js` - Removida fase `oferta_catalogo_profissao`

### 3. Mudanças no Fluxo de Conversação

#### Antes:
```
saudacao → identificacao → oferta_catalogo_profissao → filtro_tipo → ...
```

#### Depois:
```
saudacao → identificacao → filtro_tipo (lista completa) → ...
```

#### Detalhes:
1. **Fase `identificacao`**: 
   - Antes: Pedia nome E profissão
   - Depois: Pede APENAS nome
   - Após capturar nome, vai direto para `filtro_tipo`

2. **Fase `oferta_catalogo_profissao`**: 
   - ❌ REMOVIDA COMPLETAMENTE
   - Bot não oferece mais catálogo por profissão
   - Bot mostra TODOS os produtos disponíveis

3. **Fase `filtro_tipo`**:
   - Mostra lista numerada com TODOS os 8 tipos de produtos:
     1. Dólmã/Avental
     2. Gorro
     3. Jaleco
     4. Macacão
     5. Não-Têxteis
     6. Outros
     7. Robe
     8. Scrub

### 4. Código Removido

#### Imports removidos:
```javascript
import { matchProfissao } from './match-catalogo.js'; // ❌ REMOVIDO
```

#### Variáveis removidas do payload:
```javascript
// Antes:
const payload = {
  nome: conversa.nome_cliente,
  profissao: conversa.profissao,  // ❌ REMOVIDO
  preferencias: {...},
  contexto: [...]
};

// Depois:
const payload = {
  nome: conversa.nome_cliente,
  preferencias: {...},
  contexto: [...]
};
```

#### Funções atualizadas:
```javascript
// Antes:
async function salvarMensagemHistorico(numeroCliente, mensagemCliente, respostaBot, fase, preferencias, nomeCliente, profissao)

// Depois:
async function salvarMensagemHistorico(numeroCliente, mensagemCliente, respostaBot, fase, preferencias, nomeCliente)
```

#### Lógica de captura removida:
```javascript
// ❌ REMOVIDO:
if (fase === 'identificacao' && !payload.profissao) {
  if (profissaoMatch) {
    payload.profissao = profissaoMatch;
    updates.profissao = payload.profissao;
  }
}
```

### 5. Banco de Dados Supabase

#### Tabela `conversas`:
- ⚠️ Campo `profissao` ainda existe na tabela, mas não é mais usado
- Pode ser mantido para histórico ou removido em migração futura
- Novos registros terão `profissao = null`

#### Recomendação para migração futura:
```sql
-- OPCIONAL: Remover coluna profissao (executar quando conveniente)
ALTER TABLE conversas DROP COLUMN IF EXISTS profissao;
```

### 6. Prompt da IA Atualizado

#### Antes:
```
📊 PAYLOAD COMPLETO (MEMÓRIA):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Nome: ${nome}
💼 Profissão: ${profissao}  // ❌ REMOVIDO
🎯 Tipo Produto: ${prefs.tipoProduto}
...
```

#### Depois:
```
📊 PAYLOAD COMPLETO (MEMÓRIA):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Nome: ${nome}
🎯 Tipo Produto: ${prefs.tipoProduto}
...
```

### 7. Nova Mensagem na Fase Identificação

```javascript
case 'identificacao':
  const todosTipos = listarTiposProdutos();
  
  return `
  ┌──────────────────────────────────────┐
  │ FASE 2: LISTA DE PRODUTOS
  └──────────────────────────────────────┘
  
  📦 PRODUTOS DISPONÍVEIS NA LOJA:
  1. Dólmã/Avental
  2. Gorro
  3. Jaleco
  4. Macacão
  5. Não-Têxteis
  6. Outros
  7. Robe
  8. Scrub
  
  REGRAS:
  - Cumprimente: "Ótimo, ${nome}! Vou te mostrar nossos produtos. 😊"
  - Mostre a lista acima
  - Pergunte: "Qual desses produtos te interessa?"
  - Aceite número ou nome do produto
  - AVANCE para filtro_tipo após resposta
  `;
```

## Impacto

### ✅ Benefícios:
1. Fluxo mais direto e rápido
2. Menos perguntas para o cliente
3. Código mais simples e manutenível
4. Menos arquivos para gerenciar (11 JSONs a menos)

### ⚠️ Mudanças no Comportamento:
1. Bot não pergunta mais sobre profissão
2. Bot não oferece catálogo especializado
3. Todos clientes veem TODOS os produtos

## Testes Realizados

✅ `test-fluxo-sem-profissao.js`:
- Lista de produtos retorna 8 categorias
- Pasta profissão foi removida
- Imports estão corretos

## Próximos Passos

1. ✅ Testar bot em produção
2. ⏳ Monitorar conversas reais
3. ⏳ Avaliar se lista de 8 produtos é clara para clientes
4. ⏳ (Opcional) Remover coluna `profissao` do Supabase

## Rollback (caso necessário)

Para reverter as mudanças:
1. Restaurar pasta `catalogos/profissao/` do backup
2. Reverter `orquestrador-4blocos.js` para versão anterior
3. Adicionar novamente imports de `matchProfissao`
4. Restaurar fluxo `identificacao → oferta_catalogo_profissao → filtro_tipo`
