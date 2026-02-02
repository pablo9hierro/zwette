# 🔑 PALAVRA-CHAVE "SIMITARRA" - IMPLEMENTAÇÃO

## ✅ O QUE FOI IMPLEMENTADO

A palavra-chave **"simitarra"** agora é o **gatilho obrigatório** para iniciar/reiniciar qualquer atendimento com a Jana.

---

## 🎯 COMO FUNCIONA

### 1️⃣ **Início da Conversa**

```
Cliente: simitarra
   ↓
🔑 Palavra-chave detectada
   ↓
Jana: Olá! 👋 Meu nome é Jana, sou a assistente virtual da Dana Jalecos!
      Para te atender melhor... Como posso te chamar? 😊
   ↓
Cliente: Carlos
   ↓
Jana: Prazer, Carlos! 😊 Que tipo de produto você está procurando?
   ↓
[Fluxo normal de busca continua...]
```

### 2️⃣ **Reiniciar Conversa**

Cliente pode enviar "simitarra" a qualquer momento para **reiniciar** o atendimento:

```
[Meio de uma conversa]
   ↓
Cliente: simitarra
   ↓
🔄 Contexto resetado
   ↓
Jana: Olá! ... Como posso te chamar? 😊
   ↓
[Novo atendimento começa do zero]
```

---

## 🔍 DETECÇÃO INTELIGENTE

A palavra-chave funciona:

✅ **Minúsculas**: `simitarra`  
✅ **Maiúsculas**: `SIMITARRA`  
✅ **Misto**: `SiMiTaRrA`  
✅ **Com texto**: `Oi simitarra` ou `simitarra oi`  
✅ **Com espaços**: `  simitarra  `

---

## 📊 FLUXO COMPLETO

```
╔════════════════════════════════════════╗
║     FLUXO COM PALAVRA-CHAVE            ║
╚════════════════════════════════════════╝

1. Cliente envia "simitarra"
   └─→ Bot detecta palavra-chave 🔑
   
2. Bot reseta contexto (se necessário)
   └─→ Inicializa novo atendimento
   
3. Bot envia apresentação
   └─→ "Olá! Meu nome é Jana..."
   └─→ "Como posso te chamar?"
   
4. Cliente informa nome
   └─→ "Carlos"
   
5. Bot salva nome e vai para filtro
   └─→ "Prazer, Carlos!"
   └─→ "Que tipo de produto você procura?"
   
6. Fluxo normal continua
   └─→ Filtro → Busca → Resultados → Encerramento
```

---

## 🛠️ CÓDIGO IMPLEMENTADO

### **orquestrador-jana.js**

```javascript
/**
 * Detecta se a mensagem é a palavra-chave inicial "simitarra"
 */
function ePalavraChaveInicial(mensagem) {
  const mensagemLimpa = mensagem.toLowerCase().trim();
  return mensagemLimpa === 'simitarra' || mensagemLimpa.includes('simitarra');
}

// No processamento principal:
if (ePalavraChaveInicial(mensagemUsuario)) {
  console.log('🔑 Palavra-chave "simitarra" detectada - Iniciando atendimento');
  
  // Resetar contexto
  contexto = inicializarContextoAvancado();
  
  // Enviar apresentação + pedir nome
  const mensagemInicial = gerarMensagemApresentacao() + '\n\n' + 
                         'Para te atender melhor... me diga:\n\n' +
                         '*Como posso te chamar?* 😊';
  
  contexto.aguardandoResposta = 'nome';
  contexto.faseAtual = 'identificacao';
  
  await salvarContexto(numeroUsuario, contexto);
  return mensagemInicial;
}
```

---

## ✅ VALIDAÇÃO

### **Teste Executado**: `test-simitarra.js`

**Cenários Testados:**

1. ✅ Cliente envia "simitarra" → Bot inicia atendimento
2. ✅ Cliente informa nome → Bot salva e prossegue
3. ✅ Cliente pede produto → Fluxo normal funciona
4. ✅ Cliente envia "simitarra" novamente → Reinicia conversa
5. ✅ Palavra com MAIÚSCULAS → Funciona
6. ✅ Palavra com texto adicional → Detecta corretamente

---

## 🎯 VANTAGENS

1. **Controle Total**: Nenhum atendimento inicia sem "simitarra"
2. **Reset Fácil**: Cliente pode reiniciar a qualquer momento
3. **Sem Confusão**: Bot não responde mensagens aleatórias
4. **Segurança**: Evita ativações acidentais
5. **Flexível**: Aceita variações da palavra-chave

---

## 📝 OBSERVAÇÕES IMPORTANTES

### ⚠️ **Comportamento Atual**

- **Sem "simitarra"**: Bot NÃO inicia novo atendimento
- **Com "simitarra"**: Bot SEMPRE inicia/reinicia
- **Identificação**: Continua sendo APENAS nome (sem profissão)

### 🔄 **Fluxo Completo Atualizado**

```
"simitarra" → Apresentação → Nome → Filtro → Busca → Resultado
     ↑                                                      │
     └──────────────────────────────────────────────────────┘
                   (pode reiniciar a qualquer momento)
```

---

## 🧪 COMO TESTAR

```bash
# Teste automatizado
node test-simitarra.js

# Teste manual (WhatsApp)
1. Conecte o bot: node index.js
2. Envie "simitarra" de outro número
3. Bot deve responder com apresentação
4. Informe seu nome
5. Bot prossegue para busca de produtos
```

---

## 📦 ARQUIVOS MODIFICADOS

1. **orquestrador-jana.js**
   - ✅ Adicionada função `ePalavraChaveInicial()`
   - ✅ Adicionada verificação antes de processar mensagens
   - ✅ Reset de contexto quando detecta palavra-chave

2. **test-simitarra.js** (NOVO)
   - ✅ Teste completo da funcionalidade
   - ✅ Múltiplos cenários validados

---

## 🎉 RESULTADO FINAL

### **O que acontece agora:**

| Cliente Envia        | Bot Responde                                    |
|---------------------|------------------------------------------------|
| `simitarra`         | ✅ Apresentação + Pede nome                    |
| `SIMITARRA`         | ✅ Apresentação + Pede nome                    |
| `Oi simitarra`      | ✅ Apresentação + Pede nome                    |
| `Olá`               | ⏸️ (aguarda "simitarra" se for conversa nova)  |
| `Oi`                | ⏸️ (aguarda "simitarra" se for conversa nova)  |

### **Fluxo Garantido:**

```
simitarra → Nome → Busca de Produtos → Resultado
```

**Identificação**: APENAS nome (profissão foi removida) ✅

---

**Data**: 29/01/2026  
**Status**: ✅ **Implementado e Testado**  
**Palavra-chave**: `simitarra`
