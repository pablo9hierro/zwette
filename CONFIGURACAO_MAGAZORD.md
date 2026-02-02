# ⚙️ Configuração da API Magazord

## 🔍 Descobrindo Endpoints Corretos

A API do Magazord pode ter diferentes versões. Execute o script de teste:

```bash
node test-magazord.js
```

## 📚 Documentação Necessária

Você precisará consultar a documentação da API Magazord para:

1. **Endpoints de Produtos**
   - Listar produtos: `/produtos` ou `/produto` ou `/v1/produtos`
   - Buscar por ID: `/produtos/{id}`
   - Buscar por SKU: `/produtos/sku/{sku}`

2. **Endpoints de Categorias**
   - Listar: `/categorias` ou `/categoria`

3. **Parâmetros de Query**
   - `nome`, `categoria`, `cor`, `tamanho`
   - `preco_min`, `preco_max`
   - `limite`, `pagina`
   - `disponivel`

## 🔧 Como Ajustar

Edite o arquivo [tools/magazord-api.js](tools/magazord-api.js) e atualize:

```javascript
const possiveisEndpoints = [
    '/seu-endpoint-correto',
    '/v1/produtos',
    // ... adicione os endpoints corretos
];
```

## 📞 Contato Magazord

Entre em contato com o suporte do Magazord para obter:
- Documentação completa da API
- Exemplos de requisições
- Limites de rate
- Campos disponíveis

## ✅ Teste de Conexão

Após configurar, teste com:

```bash
node test-magazord.js
```

Se retornar dados, a integração está funcionando! ✅
