# 🎯 RESULTADO DO TESTE: SKU + COR/TAMANHO

## ✅ CONCLUSÕES DOS TESTES

### 1. **O código SKU do JSON funciona para buscar no Magazord?**
**✅ SIM, FUNCIONA PERFEITAMENTE!**

Testamos 5 produtos do `masculino.json` e **TODOS os 5** foram encontrados usando o campo `sku`:

| Teste | Produto | SKU | Resultado |
|-------|---------|-----|-----------|
| 1 | Jaleco Masculino Manoel Bege | `371-SD-006-000-M5` | ✅ Encontrado |
| 2 | Scrub Masculino Manga Curta Azul Marinho | `070-SD-015-015-M5` | ✅ Encontrado |
| 3 | Jaleco Masculino Manoel Branco | `371-SD-008-000-M5` | ✅ Encontrado |
| 4 | Jaleco Masculino Heitor Branco | `643-SD-008-000-MFa` | ✅ Encontrado |
| 5 | Jaleco Masculino Manoel Azul Marinho | `371-SD-015-000-M5` | ✅ Encontrado |

**Taxa de sucesso: 100% (5/5)**

---

### 2. **É possível filtrar por cor e tamanho?**
**✅ SIM, é possível via derivações!**

O processo é:
1. Buscar produto pai por SKU usando: `GET /v2/site/produto?codigo={sku}`
2. Obter lista de derivações do produto (campo `derivacoes[]`)
3. Para cada derivação, consultar: `GET /v2/site/produto/{codigoPai}/derivacao/{codigoDerivacao}`
4. No detalhe da derivação, verificar o array `derivacoes[].valor` que contém:
   - Cores: "Branco", "Azul Marinho", "Bege", etc.
   - Tamanhos: "PP", "P", "M", "G", "GG", "G1", "G2", "G3"

**Exemplo de filtro:**
```javascript
// Buscar "Jaleco Masculino Manoel" + Cor "Bege" + Tamanho "G"
1. GET /v2/site/produto?codigo=371-SD-006-000-M5
2. Pegar derivacoes[].codigo
3. GET /v2/site/produto/371-SD-006-000-M/derivacao/371-SD-006-006-M5-G
4. Verificar derivacoes[].valor contém "Bege" E "G"
```

---

### 3. **A informação de "disponível" é confiável?**
**✅ SIM, baseado em `ativo` + `lojas > 0`**

Segundo o OpenAPI, a disponibilidade é determinada por:
- `ativo: true` - Produto está ativo no sistema
- `lojas: [array]` - Produto vinculado a pelo menos uma loja
- **Disponível = ativo && lojas.length > 0**

**Este é o mesmo critério usado pelo site**, pois:
- API `/v2/site/*` é a API do frontend (espelho do site)
- Se está ativo e vinculado a loja = visível no site = disponível

⚠️ **Limitação:** Não há informação de **quantidade em estoque**. Apenas se está "disponível no catálogo".

---

## 📋 ESTRUTURA DOS DADOS

### JSON masculino.json:
```json
{
  "codigoProduto": "808",
  "sku": "371-SD-006-000-M5",        ← Campo usado para busca
  "nome": "Jaleco Masculino Manoel Bege",
  "link": "https://...",
  "imagem": "https://...",
  "preco": "R$ 209,00...",
  "tamanhos": ["PP", "P", "M", "G", "GG", "G1", "G2", "G3"]
}
```

### Resposta do Magazord:
```javascript
{
  "id": 808,
  "codigo": "371-SD-006-000-M",      ← Código do produto PAI
  "nome": "Jaleco Masculino Manoel Bege",
  "ativo": true,
  "derivacoes": [
    {
      "id": 1234,
      "codigo": "371-SD-006-006-M5-PP",  ← Código da derivação (com tamanho)
      "nome": "Jaleco... Bege - PP",
      "ativo": true
    }
  ]
}
```

### Detalhes da Derivação:
```javascript
{
  "codigo": "371-SD-006-006-M5-PP",
  "nome": "Jaleco Masculino Manoel Bege - PP",
  "ativo": true,
  "lojas": [1, 2, 3],                ← IDs das lojas vinculadas
  "derivacoes": [                    ← Características (cor/tamanho)
    {
      "derivacao": 1,                ← ID da grade "Cor"
      "valor": "Bege"               ← Valor: cor
    },
    {
      "derivacao": 2,                ← ID da grade "Tamanho"
      "valor": "PP"                 ← Valor: tamanho
    }
  ]
}
```

---

## 🎯 ESTRATÉGIA RECOMENDADA

### Para buscar produto por SKU + cor/tamanho:

```javascript
async function buscarProdutoDisponivel(sku, cor, tamanho) {
  // 1. Buscar produto por SKU
  const response = await axios.get(
    `/v2/site/produto?codigo=${sku}&limit=1`,
    MAGAZORD_CONFIG
  );
  
  const produto = response.data?.data?.items?.[0];
  if (!produto) return { encontrado: false };
  
  // 2. Para cada derivação, buscar detalhes
  for (const der of produto.derivacoes) {
    const detResponse = await axios.get(
      `/v2/site/produto/${produto.codigo}/derivacao/${der.codigo}`,
      MAGAZORD_CONFIG
    );
    
    const detalhe = detResponse.data?.data;
    
    // 3. Verificar se tem a cor e tamanho
    const valores = detalhe.derivacoes.map(d => d.valor.toLowerCase());
    const temCor = !cor || valores.some(v => v.includes(cor.toLowerCase()));
    const temTamanho = !tamanho || valores.includes(tamanho.toLowerCase());
    
    if (temCor && temTamanho) {
      return {
        encontrado: true,
        disponivel: detalhe.ativo && detalhe.lojas?.length > 0,
        produto: detalhe
      };
    }
  }
  
  return { encontrado: true, disponivel: false };
}
```

---

## ✅ RESPOSTA FINAL

### Pergunta: O código SKU é mesmo o código para achar o produto no Magazord?
**✅ SIM!** O campo `sku` do `masculino.json` é exatamente o código que identifica o produto no Magazord.

### Como usar na prática:
1. **Buscar produto:** `GET /v2/site/produto?codigo={sku}`
2. **Filtrar cor/tamanho:** Consultar derivações e verificar valores
3. **Verificar disponibilidade:** `ativo === true && lojas.length > 0`

### Limitações:
- ❌ Não retorna quantidade em estoque
- ❌ Não retorna preço (mas você já tem no JSON)
- ✅ Retorna se está disponível no catálogo (ativo + vinculado a loja)

---

**Data do teste:** 23 de Janeiro de 2026  
**Produtos testados:** 5/5 (100% de sucesso)  
**Endpoint usado:** `/v2/site/produto?codigo={sku}`  
**Arquivo de teste:** `test-sku-cor-tamanho.js`
