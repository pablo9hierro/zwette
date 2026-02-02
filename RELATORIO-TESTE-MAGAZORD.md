# 📊 RELATÓRIO COMPLETO - API MAGAZORD

## ✅ PARÂMETROS DISPONÍVEIS PARA BUSCA

### Parâmetros que FUNCIONAM:
- ✅ `limit` - Limitar número de resultados
- ✅ `offset` - Offset para paginação
- ✅ `page` - Número da página
- ✅ `nome` - Busca por nome do produto
- ✅ `descricao` - Busca por descrição
- ✅ `busca` - Busca geral (recomendado)
- ✅ `q` - Query geral
- ✅ `search` - Search geral
- ✅ `disponivel` - Filtrar produtos disponíveis (true/false)
- ✅ `estoque` - Filtrar produtos com estoque (true/false)
- ✅ `ativo` - Filtrar produtos ativos (true/false)
- ✅ `visivel` - Filtrar produtos visíveis (true/false)
- ✅ `preco_min` - Preço mínimo
- ✅ `preco_max` - Preço máximo
- ✅ `ordem` - Ordenar resultados
- ✅ `sort` - Ordenar resultados
- ✅ `order_by` - Ordenar resultados
- ✅ `fields` - Especificar campos específicos para retornar

### ⚠️ Parâmetros OBRIGATÓRIOS:
**NENHUM!** A API funciona sem parâmetros obrigatórios.
- Sem parâmetros: retorna 100 produtos
- Com limit: retorna o número especificado

---

## 📦 ESTRUTURA COMPLETA DE UM PRODUTO

### Campos retornados pelo endpoint `/v2/site/produto`:

```javascript
{
  "id": 3699,                    // ID do produto
  "nome": "Gorro Unissex...",    // Nome completo
  "modelo": "Gorro",             // Modelo/tipo
  "acompanha": "1 Gorro",        // O que acompanha
  "palavraChave": "gorro...",    // Palavras-chave para busca
  "peso": "1.000",               // Peso em kg
  "altura": "4.00",              // Altura em cm
  "largura": "29.00",            // Largura em cm
  "comprimento": "38.00",        // Comprimento em cm
  "codigo": "002-DD-002-F-P",    // Código do produto
  "tipo": 1,                     // ID do tipo
  "marca": 3,                    // ID da marca
  "unidadeMedida": "UN",         // Unidade
  "ativo": true,                 // Se está ativo
  "ncm": "65050090",             // Código NCM
  "cest": "2805900",             // Código CEST
  "origemFiscal": 0,             // Origem fiscal
  "dataLancamento": null,        // Data de lançamento
  "dataAtualizacao": "2025...",  // Data de atualização
  "categorias": [19, 20],        // IDs das categorias
  "derivacoes": [...]            // Variações (cores/tamanhos)
}
```

### ❌ Campos NÃO RETORNADOS (não disponíveis):
- `preco` - Preço não vem no endpoint de listagem
- `precoPromocional` - Preço promocional
- `estoque` - Quantidade em estoque
- `disponivel` - Status de disponibilidade
- `descricao` - Descrição completa
- `variacoes` com detalhes de cor/tamanho/estoque

---

## 🎨 DERIVAÇÕES (Variações de Produto)

As derivações representam as variações de um produto (cores, tamanhos, etc):

```javascript
"derivacoes": [
  {
    "id": 4110,
    "codigo": "339-KD-008-008-F-01",
    "nome": "Jaleco Masculino Bernardo Kids Branco - 1",
    "ativo": true
  }
]
```

### ⚠️ Limitações:
- As derivações NÃO retornam estoque individual
- NÃO mostram cor ou tamanho específico
- Apenas ID, código, nome e status ativo

---

## 🔍 BUSCA DE PRODUTOS

### Melhores práticas para buscar produtos:

1. **Busca por nome exato:**
   ```
   GET /v2/site/produto?nome=Jaleco%20Masculino&limit=10
   ```

2. **Busca por palavras-chave (recomendado):**
   ```
   GET /v2/site/produto?busca=Jaleco&limit=10
   ```

3. **Busca com filtros:**
   ```
   GET /v2/site/produto?nome=Jaleco&ativo=true&limit=10
   ```

### 📝 Exemplos de busca bem-sucedida:

**Teste:** Buscar "Jaleco Masculino"
**Resultado:** ✅ 5 produtos encontrados
- Jaleco Masculino Bernardo Kids Branco (9 derivações)
- Jaleco Masculino Bernardo Bege (8 derivações)
- Jaleco Masculino Bernardo Branco (7 derivações)
- Jaleco Masculino Bernardo Verde Claro (8 derivações)

---

## ⚠️ LIMITAÇÕES IMPORTANTES

### 1. Endpoint de produto individual NÃO funciona:
❌ `GET /v2/site/produto/{id}` → Retorna 404
- Não é possível buscar detalhes de um produto específico por ID
- Toda informação deve vir da listagem

### 2. Preço e Estoque NÃO disponíveis:
- O endpoint de listagem **NÃO retorna**:
  - Preço
  - Estoque
  - Disponibilidade real
  - Cores disponíveis
  - Tamanhos disponíveis

### 3. Endpoints de Estoque NÃO funcionam:
❌ `GET /v2/site/estoque` → 405 Method Not Allowed
❌ `GET /v2/site/produto/{id}/estoque` → 405 Method Not Allowed

---

## ✅ FUNCIONALIDADES POSSÍVEIS

### O que É POSSÍVEL fazer:

1. ✅ **Buscar produtos por nome**
   - Usando `nome`, `busca`, `q`, ou `search`

2. ✅ **Verificar se produto existe no catálogo**
   - Pesquisar pelo nome e ver se retorna resultados

3. ✅ **Obter informações básicas**
   - Nome, código, modelo, categorias
   - Lista de derivações (variações)
   - Dimensões e peso

4. ✅ **Filtrar por status**
   - Produtos ativos
   - Com base em filtros disponíveis

### O que NÃO é possível:

1. ❌ **Verificar estoque real**
   - API não retorna quantidade em estoque

2. ❌ **Ver preço dos produtos**
   - Preço não está disponível neste endpoint

3. ❌ **Verificar cores disponíveis em estoque**
   - Derivações não incluem estoque individual

4. ❌ **Buscar produto específico por ID**
   - Endpoint individual retorna 404

---

## 💡 ESTRATÉGIA PARA BUSCAR PRODUTOS DO masculino.json

### Passo a passo:

1. **Extrair nome do produto do JSON**
   ```javascript
   const nomeProduto = produtoJSON.nome || produtoJSON.title;
   ```

2. **Buscar no Magazord**
   ```javascript
   GET /v2/site/produto?nome=${nomeProduto}&ativo=true&limit=10
   ```

3. **Se não encontrar, tentar busca por palavras-chave**
   ```javascript
   const palavras = nomeProduto.split(' ').slice(0, 3).join(' ');
   GET /v2/site/produto?busca=${palavras}&limit=10
   ```

4. **Analisar resultados**
   - Comparar nome retornado com nome do JSON
   - Verificar se produto está ativo
   - Ver quantas derivações tem (cores/tamanhos)

5. **Responder ao cliente**
   - ✅ "Produto encontrado no catálogo"
   - ℹ️ "X derivações disponíveis" (mas sem estoque)
   - ⚠️ "Não é possível verificar estoque via API"

---

## 📝 CONCLUSÃO

### ✅ O que funciona:
- Busca de produtos por nome
- Verificação de existência no catálogo
- Listagem de variações (derivações)
- Informações básicas do produto

### ❌ Limitações críticas:
- **SEM informação de estoque**
- **SEM informação de preço**
- **SEM cores disponíveis por derivação**
- **Endpoint individual não funciona**

### 💡 Recomendação:
Para obter informações de estoque e preço, será necessário:
1. Usar outro endpoint da API (se existir)
2. Consultar diretamente o painel administrativo do Magazord
3. Solicitar acesso a endpoints administrativos (não públicos)
4. Integração com webhook ou outro sistema

---

## 🧪 EXEMPLOS DE CÓDIGO

### Buscar produto do JSON no Magazord:

```javascript
async function buscarProdutoMagazord(nomeProduto) {
  try {
    // Tentativa 1: Nome exato
    let response = await axios.get(
      `/v2/site/produto?nome=${encodeURIComponent(nomeProduto)}&ativo=true&limit=5`,
      MAGAZORD_CONFIG
    );
    
    let produtos = response.data?.data?.items || [];
    
    // Tentativa 2: Palavras-chave (se não encontrou)
    if (produtos.length === 0) {
      const palavrasChave = nomeProduto.split(' ').slice(0, 3).join(' ');
      response = await axios.get(
        `/v2/site/produto?busca=${encodeURIComponent(palavrasChave)}&limit=5`,
        MAGAZORD_CONFIG
      );
      produtos = response.data?.data?.items || [];
    }
    
    return {
      encontrado: produtos.length > 0,
      produtos: produtos,
      totalDerivacoes: produtos.reduce((sum, p) => sum + (p.derivacoes?.length || 0), 0)
    };
    
  } catch (error) {
    return { encontrado: false, erro: error.message };
  }
}
```

---

**Data do teste:** 23 de Janeiro de 2026
**Endpoint testado:** `/v2/site/produto`
**Versão da API:** v2
