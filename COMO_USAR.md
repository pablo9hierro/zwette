# 🚀 COMO USAR O SISTEMA

## ✅ Sistema Instalado e Configurado!

Tudo está pronto. Siga os passos:

### 1️⃣ Iniciar o Sistema

```bash
npm start
```

### 2️⃣ Conectar WhatsApp

- Escaneie o QR Code no terminal
- Aguarde mensagem "✅ Conectado ao WhatsApp!"
- Aguarde "🤖 Agente IA pronto para atender!"

### 3️⃣ Testar

Envie uma mensagem de teste para o número +5583987516699:

**Exemplos de mensagens:**

```
"Oi"
"Tem jaleco branco?"
"Quero ver gorros azuis"
"Quanto custa jaleco?"
"Tem jaleco tamanho G?"
```

### 4️⃣ Acompanhar Logs

O terminal mostrará cada etapa:
- 📨 Mensagem recebida
- 🤖 IA interpretando
- 🔧 Buscando na API
- 💬 Formatando resposta
- ✅ Resposta enviada

## ⚠️ IMPORTANTE: API Magazord

Os endpoints da API Magazord precisam ser verificados.

Execute o teste:
```bash
node test-magazord.js
```

Se der erro 404, você precisa:
1. Consultar documentação Magazord
2. Atualizar endpoints em `tools/magazord-api.js`
3. Ver instruções em `CONFIGURACAO_MAGAZORD.md`

**Enquanto a API não estiver configurada:**
- O bot responderá com mensagem de fallback
- A IA ainda funcionará normalmente
- Só faltarão os dados reais do catálogo

## 🔧 Arquivos Importantes

- `.env` - Credenciais (NÃO compartilhar!)
- `index.js` - Iniciar sistema
- `tools/magazord-api.js` - Configurar endpoints
- `prompts/` - Ajustar comportamento da IA

## 📊 Estrutura de Logs

```
📨 MENSAGEM RECEBIDA:
👤 De: Cliente (558398...)
💬 Texto: tem jaleco branco?

🤖 Etapa 1: Interpretando intenção...
📊 Intenção identificada: { acao: "buscar_produtos", ... }

🔧 Etapa 2: Executando requisição...
✅ Dados recebidos do Magazord

💬 Etapa 3: Formatando resposta...
📤 Resposta enviada

✅ Resposta enviada com sucesso!
```

## 🎯 Próximos Passos

1. ✅ Sistema funcionando
2. ⚠️ Configurar endpoints Magazord corretos
3. ✅ Testar com mensagens reais
4. ✅ Ajustar prompts se necessário

## 🆘 Problemas Comuns

**QR Code não aparece:** Aguarde alguns segundos

**Erro de autenticação API:** Verifique credenciais no `.env`

**404 Magazord:** Endpoints precisam ser atualizados

**IA não responde:** Verifique token ChatGPT no `.env`

---

**Tudo pronto! Inicie com `npm start` 🚀**
