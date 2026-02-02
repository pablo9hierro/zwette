# 📋 ROTEIRO DE CAPTURA DE DADOS - BOT JANA

## Ordem de Perguntas e Captura

### 1️⃣ **NOME** (Fase: `saudacao`)
```
Bot: "Olá! 👋 Meu nome é Jana, assistente virtual da Dana Jalecos! 
     Estou aqui para te ajudar a encontrar os melhores produtos para você. 
     Como posso te chamar?"

Cliente: "Maria" / "João" / "Pablo"
```
**Captura:** `nome_cliente` (fixo após primeira captura)

---

### 2️⃣ **PROFISSÃO** (Fase: `identificacao`)
```
Bot: "Legal, {nome}! Me diga, por acaso você é profissional de alguma 
     dessas áreas ou correlatas? Digite o nome ou o número correspondente, ok?

     1. Biomédico
     2. Dentista
     3. Enfermeiro
     4. Esteticista
     5. Farmacêutico
     6. Fisioterapeuta
     7. Médico
     8. Nutricionista
     9. Pediatra
     10. Psicólogo
     11. Veterinário
     12. Nenhuma dessas"

Cliente: "2" / "dentista" / "nenhuma"
```
**Captura:** `profissao` (fixo após primeira captura)

---

### 3️⃣ **CATÁLOGO** (Fase: `oferta_catalogo_profissao`)
```
Bot: "Que legal, {nome}! Temos um catálogo especial para dentista! 🎯
     Você quer ver os produtos recomendados para sua profissão 
     ou prefere explorar todos os produtos da loja?"

Cliente: "catálogo especial" / "todos os produtos" / "explorar tudo"
```
**Ação:** Define se mostra catálogo filtrado ou todos produtos

---

### 4️⃣ **TIPO DE PRODUTO** (Fase: `filtro_tipo`)
```
Bot: "{nome}, qual produto você quer? Veja a lista:

     1. Dolma-avental
     2. Gorro
     3. Infantil
     4. Jaleco
     5. Macacão
     6. Não-têxteis
     7. Outros
     8. Robe
     9. Scrub

     Você pode responder com o número ou o nome do produto! 😊"

Cliente: "4" / "jaleco" / "gorro"
```
**Captura:** `preferencias.tipoProduto` (fixo)

---

### 5️⃣ **COR** (Fase: `filtro_cor`) ⚠️ **VEM ANTES DE MODELO**
```
Bot: "{nome}, qual cor(es) você prefere? Veja as cores disponíveis 
     e os modelos que temos em cada uma:

     🎨 CORES DISPONÍVEIS DE {tipoProduto}:
     
     1. **Branco** → Modelos: Marta, Heloisa, Samuel, Isac
     2. **Preto** → Modelos: Marta, Heloisa, Chloe, Diana
     3. **Azul Bebe** → Modelos: Heloisa, Manuela, Clinic, Dani
     4. **Rosa Nude** → Modelos: Marta, Heloisa, Isabel, Rute
     ...
     
     Digite o nome ou número da cor! (ou 'tanto faz' se não tem preferência)"

Cliente: "1" / "branco" / "azul bebe" / "tanto faz"
```
**Captura:** `preferencias.cor` (pode ser null se "tanto faz")

**IMPORTANTE:** Mostra modelos disponíveis em cada cor!

---

### 6️⃣ **MODELO** (Fase: `filtro_modelo`)

#### Opção A: Cliente escolheu cor específica
```
Bot: "Perfeito! Aqui estão os modelos de {tipoProduto} 
     disponíveis na cor {cor}:

     1. Marta
     2. Heloisa (Manga Longa)
     3. Samuel
     4. Isac
     
     {nome}, qual modelo você prefere?"

Cliente: "2" / "heloisa manga longa" / "marta"
```

#### Opção B: Cliente disse "tanto faz" na cor
```
Bot: "Beleza! Aqui estão TODOS os modelos de {tipoProduto}:

     1. Marta (Cores: Branco, Preto, Rosa Nude)
     2. Heloisa (Manga Longa) (Cores: 19 opções)
     3. Clinic (Cores: 9 opções)
     ...
     
     {nome}, qual modelo você prefere?"

Cliente: "1" / "marta"
```

**Captura:** `preferencias.modelo` (fixo)

---

### 7️⃣ **GÊNERO** (Fase: `filtro_genero`)
```
Bot: "{nome}, você prefere {tipoProduto} masculino, feminino ou unissex? 👔"

Cliente: "feminino" / "masculino" / "unissex"
```
**Captura:** `preferencias.genero` (fixo)

---

### 8️⃣ **PERGUNTA MÁGICA** (Fase: `confirmacao`)
```
Bot: "Perfeito, {nome}! Posso buscar {tipoProduto} modelo {modelo} 
     {genero} na cor {cor}? 🔍"

Cliente: "sim" / "pode" / "quero" / "beleza"
```
**Ação:** Se SIM → busca produtos; Se NÃO → pergunta o que quer mudar

---

### 9️⃣ **BUSCA E ENTREGA** (Fase: `busca`)
```
Bot: "Buscando para você, {nome}! ⏳"

[Sistema faz busca no catálogo]

Bot: "Encontrei 3 produto(s)! 🎉

     ━━━━━━━━━━━━━━━━━━━━
     📦 1. Jaleco Feminino Marta Branco
     
     Descrição do produto...
     
     💰 R$ 89,90
     🔗 https://danajalecos.com.br/produto/123
     ━━━━━━━━━━━━━━━━━━━━"
```

---

### 🔟 **FEEDBACK** (Fase: `feedback`)
```
Bot: "{nome}, era isso que você procurava? 😊"

Cliente: "sim" / "gostei" / "perfeito" → vai para ENCERRAMENTO
Cliente: "não" / "não gostei" / "não é isso" → vai para REFINAMENTO
```

---

### 1️⃣1️⃣ **REFINAMENTO** (Fase: `refinamento`)
```
Bot: "{nome}, qual preferência você quer alterar?

     Preferências atuais:
     ✓ Tipo: Jaleco
     ✓ Gênero: Feminino
     ✓ Modelo: Marta
     ✓ Cor: Branco

     Você pode dizer:
     - 'tipo' ou 'produto' → escolher outro tipo
     - 'gênero' → mudar gênero
     - 'modelo' → escolher outro modelo
     - 'cor' → mudar a cor
     - 'tudo' ou 'do zero' → começar busca do zero"

Cliente: "cor" → volta para filtro_cor
Cliente: "tudo" → limpa preferências e volta para filtro_tipo
Cliente: "quero azul" → captura cor diretamente e confirma
```

**IMPORTANTE:** No refinamento, cliente mantém nome/profissão, apenas altera filtros de produto!

---

### 1️⃣2️⃣ **ENCERRAMENTO** (Fase: `encerramento`)
```
Bot: "Que ótimo, {nome}! 😊
     Vou transferir para um atendente humano que poderá finalizar sua compra.
     
     Agradeço pela sua paciência!"
```

---

## ⚠️ FLEXIBILIDADE: Ordem Invertida

### Se cliente falar MODELO antes de COR:
```
Cliente (na fase filtro_cor): "quero manga longa"
Bot: "Vi que você mencionou o modelo 'Manga Longa'. 
     Quer confirmar esse modelo antes de escolher a cor?"

Cliente: "sim"
Bot: "Ótimo! Agora qual cor prefere para o modelo Manga Longa?
     
     Cores disponíveis:
     1. Azul
     2. Branco
     3. Verde
     ..."
```

### Se cliente falar COR antes de MODELO (ordem correta):
```
Cliente (na fase filtro_cor): "branco"
Bot: "Perfeito! Modelos disponíveis em Branco:
     
     1. Marta
     2. Heloisa
     3. Samuel
     ..."
```

---

## 🔄 MUDANÇA DE PREFERÊNCIA

Se cliente mudar de ideia:
```
Cliente: "na verdade quero preto"

Bot: "Você havia escolhido {cor_anterior}, quer mesmo mudar para preto?"

Cliente: "sim"
Bot: "Mudança confirmada! ✅ Agora temos: cor = preto"
```

---

## 📊 DADOS CAPTURADOS NO FINAL

```json
{
  "nome_cliente": "Maria",
  "profissao": "dentista",
  "fase_atendimento": "encerramento",
  "preferencias": {
    "tipoProduto": "jaleco",
    "cor": "branco",
    "modelo": "Manga Longa",
    "genero": "feminino"
  }
}
```

**✅ PRONTO PARA TRANSFERÊNCIA HUMANA!**

---

## 🔄 FLUXO COMPLETO

```
INÍCIO
  ↓
SAUDAÇÃO (captura nome)
  ↓
IDENTIFICAÇÃO (captura profissão - lista enumerada 1-12)
  ↓
OFERTA CATÁLOGO (especial ou todos)
  ↓
FILTRO TIPO (lista enumerada 1-10)
  ↓
FILTRO GÊNERO (masculino/feminino/unissex)
  ↓
FILTRO COR (mostra modelos por cor - lista enumerada) ← VEM ANTES
  ↓
FILTRO MODELO (filtrado pela cor escolhida - lista enumerada) ← VEM DEPOIS
  ↓
CONFIRMAÇÃO (pergunta mágica)
  ↓
BUSCA (busca produtos)
  ↓
FEEDBACK (era isso que procurava?)
  ↓
  ├─→ SIM → ENCERRAMENTO (transfere para humano)
  └─→ NÃO → REFINAMENTO (alterar preferências)
              ↓
              └─→ volta para fase correspondente
                  (mantém nome/profissão)
```

---

## 🎯 RECURSOS ESPECIAIS

### ✅ Reconhecimento de Números
- Cliente pode responder "1" em vez de "Jaleco"
- Cliente pode responder "3" em vez de "Azul Bebe"
- Sistema reconhece posição na lista enumerada

### ✅ Reconhecimento de Variações
- "dolma" → match com "dolma-avental"
- "dolmas" (plural) → match com "dolma-avental"
- "avental" → match com "dolma-avental"
- "aventais" (plural) → match com "dolma-avental"

### ✅ Loop de Busca
- Cliente pode refinar busca quantas vezes quiser
- Mantém identificação (nome/profissão)
- Pode mudar apenas 1 filtro ou todos
