# 🎯 ARQUITETURA MODULAR DE ATENDIMENTO

## 📁 Estrutura de Arquivos Criada

A arquitetura foi completamente reestruturada para eliminar alucinações e garantir precisão nas respostas:

### `/atendimento` - Módulos Especializados

#### 1. **contexto.js** - Gerenciador de Preferências
- Mantém estado das preferências do cliente
- Detecta mudanças e novas características
- Previne perguntas repetidas
- Estrutura:
  ```javascript
  {
    tipo, genero, cor, tamanho, manga, estilo,
    caracteristicasMencionadas,
    buscaRealizada,
    ultimaPergunta,
    aguardandoConfirmacao
  }
  ```

#### 2. **entender_mensagem.js** - Analisador Inteligente
- Usa Gemini AI para extrair dados estruturados
- Detecta intenção: buscar, confirmar, negar, mudar preferência
- Identifica sentimento (frustrado, positivo, neutro)
- Fallback manual para garantir robustez
- **Regra crítica**: Distingue manga curta vs longa com precisão

#### 3. **payload.js** - Construtor de Busca
- Normaliza características para busca precisa
- Mapeia variações de cores (azul, azul marinho, azul bebê)
- Normaliza tipos, gêneros e estilos
- Garante correspondência exata no catálogo

#### 4. **pesquisar_catalogo.js** - Sistema de Sugestões
- Sugere opções quando cliente está indeciso
- Gera perguntas contextuais
- Evita repetir mensagens já enviadas
- Mensagens personalizadas por sentimento

#### 5. **pesquisar.js** - Busca Estruturada
- Busca precisa no catálogo JSON
- **Filtro crítico de manga**: NÃO retorna manga longa se pediu curta
- Busca flexível quando não encontra resultados exatos
- Formata resultados com preços, tamanhos e links
- Score de relevância para ordenação

#### 6. **orquestrador.js** - Fluxo Principal
- Integra todos os módulos
- Fluxo: Histórico → Análise → Contexto → Decisão → Busca → Resposta
- Decisões inteligentes baseadas em intenção
- Previne buscas repetidas
- Salva cliente + bot no Supabase

## 🔄 Fluxo de Execução

```
Mensagem Cliente
    ↓
[1] Recuperar Histórico + Contexto (Supabase)
    ↓
[2] Entender Mensagem (Gemini AI)
    ↓
[3] Atualizar Contexto (detectar mudanças)
    ↓
[4] Decidir Ação baseada em intenção:
    - Saudação → responder
    - Confirmar → buscar produtos
    - Negar → oferecer alternativa
    - Buscar → coletar info ou buscar
    - Mudar preferência → atualizar e buscar
    ↓
[5] Executar Ação:
    - Sugestões → quando falta info
    - Confirmação → quando tem info completa
    - Busca → quando cliente confirma
    ↓
[6] Salvar Contexto + Mensagens (cliente E bot)
    ↓
Resposta Formatada
```

## 🎯 Correções Implementadas

### ❌ Problema: Alucinação com manga curta/longa
**Solução**: Filtro preciso em [pesquisar.js](atendimento/pesquisar.js#L68-L83)
```javascript
if (filtros.manga === 'curta') {
  // NÃO pode ter "manga longa"
  if (nomeCompleto.includes('manga longa')) return false;
  // DEVE ter "manga curta"
  if (!nomeCompleto.includes('manga curta')) return false;
}
```

### ❌ Problema: Perguntas repetidas
**Solução**: Sistema de memória em [contexto.js](atendimento/contexto.js) + verificação em [orquestrador.js](atendimento/orquestrador.js)

### ❌ Problema: Bot não salvo no Supabase
**Solução**: Duplo insert em [memoria-conversa.js](db/memoria-conversa.js) - cliente + bot

### ❌ Problema: Busca repetida com mesmas características
**Solução**: Flag `buscaRealizada` em contexto

## 🚀 Como Usar

O sistema foi integrado automaticamente:

1. **Entrada**: [whatsapp/escutar-mensagens.js](whatsapp/escutar-mensagens.js) agora chama `orquestrador.js`
2. **Processar**: [atendimento/orquestrador.js](atendimento/orquestrador.js) coordena tudo
3. **Módulos**: Cada arquivo tem responsabilidade única e clara

## 📊 Exemplo de Conversa

```
Cliente: "quero um jaleco masculino"
→ [entender] intencao: buscar_produto
→ [contexto] tipo=jaleco, genero=masculino
→ [sugestao] "Qual cor você prefere?"

Cliente: "azul"
→ [contexto] cor=azul (nova característica)
→ [sugestao] "Manga curta ou longa?"

Cliente: "manga curta"
→ [contexto] manga=curta
→ [payload] {tipo: jaleco, genero: masculino, cor: azul, manga: curta}
→ [confirmacao] "Posso buscar jalecos masculinos azuis de manga curta?"

Cliente: "sim"
→ [buscar] Filtros aplicados com precisão
→ [resultado] Lista formatada com links, preços, tamanhos
→ [salvar] Contexto + mensagens no Supabase
```

## 🔐 Garantias

✅ **Precisão**: Filtros rigorosos garantem correspondência exata
✅ **Memória**: Todo contexto persistido no Supabase
✅ **Não-repetição**: Sistema detecta mensagens/perguntas já feitas
✅ **Robustez**: Fallback manual quando IA falha
✅ **Escalabilidade**: Módulos independentes e testáveis

## 🧪 Testando

```bash
# Iniciar sistema
node index.js

# O sistema agora usa a arquitetura modular automaticamente
# Teste com:
# 1. "quero um jaleco masculino"
# 2. "azul"
# 3. "manga curta"
# 4. "sim"
```

---

**Status**: ✅ Implementação completa e integrada
**Autor**: Sistema modular de atendimento Zwette
**Data**: Janeiro 2026
