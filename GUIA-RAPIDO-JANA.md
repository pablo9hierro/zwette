# 🚀 GUIA RÁPIDO - Sistema Jana

## ⚡ Início Rápido (3 minutos)

### 1️⃣ Aplicar Schema no Banco

```bash
node migrar-banco.js
```

Isso vai criar todas as tabelas necessárias no Supabase.

### 2️⃣ Testar Sistema

```bash
# Teste completo
node test-jana.js completo

# Ou todos os testes
node test-jana.js todos
```

### 3️⃣ Integrar no WhatsApp

No seu arquivo principal (ex: `index.js`):

```javascript
import processarAtendimentoJana from './atendimento/orquestrador-jana.js';

// No handler de mensagem
sock.ev.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0];
  const numeroUsuario = msg.key.remoteJid;
  const mensagemTexto = msg.message?.conversation || 
                        msg.message?.extendedTextMessage?.text;
  
  if (mensagemTexto) {
    const resposta = await processarAtendimentoJana(mensagemTexto, numeroUsuario);
    await sock.sendMessage(numeroUsuario, { text: resposta });
  }
});
```

---

## 📋 Checklist de Implementação

- [ ] Banco de dados configurado (Supabase)
- [ ] Variáveis de ambiente configuradas (.env)
- [ ] Schema aplicado (`node migrar-banco.js`)
- [ ] Testes executados com sucesso
- [ ] Integração no WhatsApp funcionando
- [ ] Catálogos de produtos em `catalogos/produtos/`
- [ ] Profissões cadastradas no banco

---

## 🎯 Fluxo Simplificado

```
1. Cliente: "Olá"
   → Jana se apresenta e pergunta nome

2. Cliente: "Maria"
   → Jana pergunta profissão

3. Cliente: "Enfermeira"
   → Jana mostra produtos recomendados

4. Cliente: "1" (escolhe da lista)
   → Jana mostra modelos disponíveis

5. Cliente: "5" (escolhe modelo)
   → Jana pergunta gênero

6. Cliente: "feminino"
   → Jana pergunta cor

7. Cliente: "azul"
   → Jana pede confirmação

8. Cliente: "sim"
   → Jana busca e mostra produtos

9. Cliente: "Adorei!"
   → Jana encerra e transfere para humano
```

---

## 🔍 Verificar Funcionamento

### Verificar Banco de Dados

```bash
node migrar-banco.js --verificar
```

### Ver Logs Detalhados

Os logs aparecem no console durante execução. Procure por:
- ✅ Sucesso
- ❌ Erro
- 📍 Fase atual
- 🔍 Filtro aplicado

### Consultar Conversa no Supabase

```sql
SELECT 
  nome_cliente, 
  profissao, 
  fase_atendimento, 
  atendimento_encerrado
FROM conversations
WHERE numero_usuario = '5511999999999';
```

### Ver Produtos Pesquisados

```sql
SELECT 
  tipo_produto, 
  modelo, 
  cor, 
  cliente_interessado
FROM produtos_pesquisados_historico
WHERE numero_usuario = '5511999999999'
ORDER BY enviado_em DESC;
```

---

## 🐛 Problemas Comuns

### "Erro ao conectar no Supabase"
✅ **Solução:** Verificar `.env` tem `SUPABASE_URL` e `SUPABASE_KEY`

### "Tabela não existe"
✅ **Solução:** Executar `node migrar-banco.js`

### "Profissão não reconhecida"
✅ **Solução:** Adicionar no banco:
```sql
INSERT INTO profissoes_catalogo (nome, sinonimos) VALUES
('nova_profissao', ARRAY['sinonimo1', 'sinonimo2']);
```

### "Produto não encontrado"
✅ **Solução:** Verificar se arquivo JSON existe em `catalogos/produtos/`

---

## 📊 Monitoramento

### Dashboard Simples

```sql
SELECT * FROM dashboard_atendimentos;
```

### Conversas Ativas

```sql
SELECT COUNT(*) FROM conversations 
WHERE ativa = true AND atendimento_encerrado = false;
```

### Taxa de Conversão (Satisfação)

```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN atendimento_encerrado = true THEN 1 ELSE 0 END) as encerrados,
  SUM(CASE WHEN transferido_humano = true THEN 1 ELSE 0 END) as transferidos
FROM conversations
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 🎨 Personalizar Mensagens

### Editar Templates

As mensagens da Jana estão em:
- `atendimento/bloco1-identificacao.js` - Saudações
- `atendimento/bloco2-filtro.js` - Perguntas de filtro
- `atendimento/bloco4-encerramento.js` - Despedidas

### Adicionar Emojis

Todos os blocos já usam emojis. Para adicionar mais:
```javascript
mensagem = `🎉 ${mensagem} ✨`;
```

### Personalizar Tons

Edite as funções `gerarMensagem*()` em cada bloco.

---

## 🔄 Atualizar Sistema

### Adicionar Nova Fase

1. Criar arquivo `atendimento/bloco5-nova-fase.js`
2. Adicionar case no orquestrador:
```javascript
case 'nova-fase':
  resultado = await processarBloco5(mensagem, contexto);
  break;
```

### Adicionar Novo Campo no Contexto

Em `contexto-avancado.js`:
```javascript
export function inicializarContextoAvancado() {
  return {
    // ... campos existentes
    novoCampo: null
  };
}
```

---

## 📞 Suporte

Dúvidas? Verifique:
1. README-JANA.md (documentação completa)
2. Logs no console
3. Tabela `conversations` no Supabase
4. Executar `node test-jana.js todos`

---

**Pronto! Seu sistema Jana está configurado e rodando! 🎉**
