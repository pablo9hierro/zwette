import 'dotenv/config';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analisa mensagem usando OpenAI com HISTÓRICO COMPLETO
 */
export async function entenderMensagem(mensagemCliente, contextoAtual = {}, historico = []) {
  // Tentar OpenAI primeiro
  try {
    console.log('🤖 Analisando com OpenAI + histórico...');
    return await analisarComOpenAI(mensagemCliente, contextoAtual, historico);
  } catch (erro) {
    console.error('❌ OpenAI falhou:', erro.message);
    
    // Fallback: Tentar Gemini
    try {
      console.log('🔄 Tentando Gemini como fallback...');
      return await analisarComGemini(mensagemCliente, contextoAtual);
    } catch (erroGemini) {
      console.error('❌ Gemini também falhou:', erroGemini.message);
      
      // Último recurso: análise manual
      console.log('🔧 Usando análise manual...');
      return analisarMensagemManual(mensagemCliente, contextoAtual);
    }
  }
}

async function analisarComOpenAI(mensagem, contexto, historico = []) {
  // Construir histórico formatado
  const historicoTexto = historico.length > 0 
    ? historico.slice(-8).map(h => `${h.role === 'bot' ? 'Bot' : 'Cliente'}: ${h.mensagem}`).join('\n')
    : 'Sem histórico anterior';

  const prompt = `Você é um assistente ULTRA INTELIGENTE de loja de produtos médicos que ENTENDE CONTEXTO e CONVERSAS NATURAIS.

🎯 ORDEM DOS DADOS OBRIGATÓRIOS: tipo → genero → cor

HISTÓRICO DA CONVERSA:
${historicoTexto}

CONTEXTO ATUAL: ${JSON.stringify(contexto, null, 2)}

MENSAGEM NOVA DO CLIENTE: "${mensagem}"

🧠 REGRAS DE CONVERSA NATURAL:

**DETECÇÃO DE NOME (seja MUITO flexível):**
- "meu nome é X" = nome
- "me chamo X" = nome
- "sou X" = nome
- "eu sou o X" = nome
- "pode me chamar de X" = nome
- "X aqui" = nome
- Resposta direta após perguntar nome = nome
- NUNCA repita a pergunta se já entendeu o nome!

**DETECÇÃO DE PRODUTO (entenda frustração):**
- Se cliente JÁ mencionou produto e REPETE = ele está FRUSTRADO
- "já falei que quero X" = CONFIRMAÇÃO ENFÁTICA (não pergunte de novo!)
- "quero X", "tem X?", "pode ver X pra mim?" = mesma coisa
- NUNCA repita pergunta se cliente já disse o produto!

**CONTEXTO DA FASE:**
- Se fase = filtro_tipo e cliente menciona tipo = CAPTURAR e AVANÇAR
- Se cliente repete dado já capturado = CONFIRMAR (não pergunte de novo)
- Se cliente parece frustrado ("já disse", "de novo?") = CONFIRMAR IMEDIATAMENTE

🔍 ANALISE E IDENTIFIQUE AÇÕES:

1. **IDENTIFICAÇÃO**: Cliente disse o nome dele de QUALQUER forma? Extraia.
   - Seja GENEROSO: "pablo", "sou pablo", "me chamo pablo" = TODOS são válidos

2. **DADOS DE PREFERÊNCIA**: Cliente mencionou tipo/genero/cor?
   - "jaleco", "scrub", "gorro", "dolma", "robe", "macacao", "infantil" = TIPO
   - "masculino", "feminino", "unissex", "homem", "mulher" = GENERO  
   - "azul", "branco", "preto", "verde", "rosa", "bege", "vermelho" = COR
   - EXTRAIA TUDO que o cliente mencionar!

3. **CONFIRMAÇÃO**: Cliente está confirmando algo?
   - "sim", "isso", "pode ser", "quero", "aceito", "beleza", "ok", "concordo" = CONFIRMAR
   - "já falei", "já disse", "quero sim", "claro que sim" = CONFIRMAÇÃO ENFÁTICA
   - "não", "nao", "nunca", "outro" = NEGAR
   - ⚠️ IMPORTANTE: Se cliente REPETIU o que já disse = CONFIRMAR (não perguntar de novo)

4. **FRUSTRAÇÃO/REPETIÇÃO**: Cliente está frustrado porque bot não entendeu?
   - "já falei que", "de novo?", "quantas vezes", "não estou pedindo X" = FRUSTRAÇÃO
   - Se detectar frustração = intencao:confirmar_preferencia (cliente TEM RAZÃO)
   - NUNCA force cliente a repetir 3x a mesma coisa!

5. **VARIAÇÕES DE PEDIDO (todas significam a mesma coisa)**:
   - "quero gorro" = capturar_tipo
   - "tem gorro?" = capturar_tipo
   - "pode ver gorro pra mim?" = capturar_tipo
   - "gostaria de ver gorro" = capturar_tipo
   - "quero saber de gorro" = capturar_tipo
   - TODAS = mesma intenção: registrar_preferencia + capturar_tipo

6. **MUDANÇA/ATUALIZAÇÃO**: Cliente quer mudar preferência?
   - "outro produto", "outra cor", "quero mudar" = ATUALIZAR
   - Se mencionar novo valor diferente do payload = ATUALIZAR

7. **PERGUNTA MÁGICA APLICÁVEL**: Contexto indica confirmar preferência?
   - Se cliente acabou de mencionar dado novo = pergunta "então você escolhe X mesmo?"

8. **ENCERRAMENTO**: Cliente quer finalizar?
   - "não preciso mais", "só isso", "pronto", "encerrar" = ENCERRAR
   - "ainda precisa ajuda?" → sim=LIMPAR payload, não=TRANSFERIR humano

Retorne JSON:
{
  "intencao": "registrar_identificacao|registrar_preferencia|confirmar_preferencia|atualizar_preferencia|pergunta_magica|encerrar_atendimento|continuar_busca|negar|neutro",
  "acao": "capturar_nome|capturar_tipo|capturar_genero|capturar_cor|confirmar_tipo|confirmar_genero|confirmar_cor|atualizar_tipo|atualizar_genero|atualizar_cor|limpar_payload|transferir_humano|aguardar",
  "sentimento": "positivo|neutro|negativo|frustrado",
  "dadosExtraidos": {
    "nome": null,
    "tipo": null,
    "genero": null,
    "cor": null
  },
  "perguntaMagicaAplicavel": false,
  "tipoConfirmacao": null,
  "mudancaDetectada": false,
  "dadoParaMudar": null,
  "explicacao": "explique sua análise detalhadamente"
}

VALORES PERMITIDOS:
- tipo: "jaleco", "scrub", "gorro", "touca", "turbante", "dolma", "avental", "robe", "macacao", "vestido", "cracha", "bandeja", "desk-pad", "kit-office", "mouse-pad", "porta-canetas", "porta-copo", "porta-objetos" ou null
- genero: "masculino", "feminino", "unissex" ou null
- cor: "azul", "branco", "preto", "verde", "rosa", "bege", "cinza", "vermelho", "amarelo", "roxo" ou null

⚠️ REGRAS CRÍTICAS DE CONVERSA NATURAL:

1. **NOME DO CLIENTE:**
   - "meu nome é pablo" = nome:pablo + acao:capturar_nome + intencao:registrar_identificacao
   - "sou pablo" = nome:pablo + acao:capturar_nome + intencao:registrar_identificacao
   - "me chamo pablo" = nome:pablo + acao:capturar_nome + intencao:registrar_identificacao
   - NUNCA repita pergunta se já capturou nome!

2. **PRODUTO:**
   - "jaleco" = tipo:jaleco + acao:capturar_tipo
   - "quero jaleco" = tipo:jaleco + acao:capturar_tipo
   - "tem jaleco?" = tipo:jaleco + acao:capturar_tipo
   - "pode ver jaleco pra mim?" = tipo:jaleco + acao:capturar_tipo
   - "quero saber de jaleco" = tipo:jaleco + acao:capturar_tipo
   - "gostaria de ver jaleco" = tipo:jaleco + acao:capturar_tipo
   - TODAS = mesma intenção!

3. **FRUSTRAÇÃO (cliente repetindo):**
   - "já falei que quero jaleco" = confirmar_tipo (NÃO pergunte de novo!)
   - Se cliente repetiu produto 2x = intencao:confirmar_preferencia
   - Detecte frustração e CONFIRME IMEDIATAMENTE

4. **CONFIRMAÇÃO:**
   - "sim" após pergunta = acao:confirmar_(tipo|genero|cor) baseado no contexto
   - "não" = intencao:negar

5. **GÊNERO:**
   - "feminino" = genero:feminino + acao:capturar_genero
   - "masculino" = genero:masculino + acao:capturar_genero
   - "unissex" = genero:unissex + acao:capturar_genero

6. **COR:**
   - "azul" = cor:azul + acao:capturar_cor
   - "pode ser azul" = cor:azul + acao:capturar_cor + intencao:confirmar_preferencia

7. **MUDANÇA:**
7. **MUDANÇA:**
   - "quero outro produto" = acao:atualizar_tipo
   - "mudei de ideia" = acao:limpar_payload

8. **ENCERRAMENTO:**
   - "ainda precisa ajuda?" + "não" = acao:transferir_humano
   - "ainda precisa ajuda?" + "sim" = acao:limpar_payload

🎯 PRIORIZE ENTENDIMENTO CONTEXTUAL:
- Se cliente parece frustrado ("já falei", "de novo") = CONFIRMAR IMEDIATAMENTE
- Se cliente repete dado = ele está CONFIRMANDO (não pergunte de novo)
- Seja GENEROSO com variações de linguagem natural
- NUNCA force cliente a repetir a mesma informação 3 vezes!

RETORNE SOMENTE JSON SEM MARKDOWN.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é um assistente que retorna APENAS JSON válido, sem texto adicional." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 600
  });

  const resposta = completion.choices[0].message.content.trim();
  let json = resposta.replace(/```json|```/g, '').trim();
  
  const resultado = JSON.parse(json);
  console.log(`💡 IA deduziu: ${resultado.explicacao}`);
  
  return { sucesso: true, ...resultado };
}

async function analisarComGemini(mensagem, contexto) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `Você é assistente INTELIGENTE que ENTENDE CONVERSAS NATURAIS.

CONTEXTO: ${JSON.stringify(contexto)}
MENSAGEM: "${mensagem}"

🧠 REGRAS DE CONVERSA NATURAL:

**NOME (seja flexível):**
- "meu nome é X", "sou X", "me chamo X", "X aqui" = nome
- Se mensagem é só um nome após perguntar = é o nome!
- "é pablo" = nome "pablo" (NÃO "é pablo"!)
- NUNCA inclua "é", "sou", "me chamo" no nome extraído

**PRODUTO (entenda variações):**
- "jaleco", "quero jaleco", "tem jaleco?" = TODAS = tipo:jaleco
- "macacao", "macacão", "quero macacao" = tipo:macacao
- "gorro", "gorros" = tipo:gorro
- "dolma", "avental" = tipo:dolma-avental
- "scrub" = tipo:scrub
- "robe" = tipo:robe
- "infantil" = tipo:infantil

**FRUSTRAÇÃO (cliente repetindo):**
- "já falei", "de novo?", "quantas vezes" = confirmar_preferencia (NÃO pergunte de novo!)

**CONFIRMAÇÃO:**
- "sim", "quero", "pode ser", "ok" = confirmar_preferencia
- "não", "nao" = negar

**GÊNERO:**
- "masculino", "homem" = genero:masculino
- "feminino", "mulher" = genero:feminino
- "unissex" = genero:unissex

**COR:**
- "azul", "branco", "preto", "verde", "rosa", "bege", "vermelho", "amarelo", "roxo", "cinza", "areia" = cor

Retorne JSON:
{
  "intencao": "registrar_identificacao|registrar_preferencia|confirmar_preferencia|atualizar_preferencia|encerrar_atendimento|negar|neutro",
  "acao": "capturar_nome|capturar_tipo|capturar_genero|capturar_cor|confirmar_tipo|confirmar_genero|confirmar_cor|aguardar",
  "dadosExtraidos": {"nome":null,"tipo":null,"genero":null,"cor":null},
  "sentimento": "positivo|neutro|negativo|frustrado",
  "perguntaMagicaAplicavel": false,
  "explicacao": "explique sua análise"
}

Retorne APENAS JSON.`;

  const result = await model.generateContent(prompt);
  let json = result.response.text().replace(/```json|```/g, '').trim();
  
  return { sucesso: true, ...JSON.parse(json) };
}

/**
 * Análise manual básica (último recurso)
 */
function analisarMensagemManual(mensagem, contexto) {
  const msgLower = mensagem.toLowerCase();
  
  let intencao = 'neutro';
  let acao = 'aguardar';
  
  // Detectar NOME (várias formas) - NÃO pegar "é" sozinho
  const nomeMatch = msgLower.match(/(?:meu nome (?:é|e)|me chamo|sou|eu sou o?|pode me chamar de)\s+([a-záàâãéèêíïóôõöúçñ]+)/i);
  if (nomeMatch) {
    const dadosExtraidos = { nome: nomeMatch[1].trim(), tipo: null, genero: null, cor: null };
    return {
      sucesso: true,
      intencao: 'registrar_identificacao',
      acao: 'capturar_nome',
      sentimento: 'positivo',
      dadosExtraidos,
      perguntaMagicaAplicavel: false,
      explicacao: `Manual: Nome extraído "${nomeMatch[1]}" de "${mensagem}"`
    };
  }
  
  const dadosExtraidos = { nome: null, tipo: null, genero: null, cor: null };
  
  // Tipos (ORDEM 1) - detecta várias formas de pedir
  const tiposPadroes = [
    { regex: /\b(jaleco|jalecos)/i, tipo: 'jaleco' },
    { regex: /\b(scrub|scrubs)/i, tipo: 'scrub' },
    { regex: /\b(gorro|gorros)/i, tipo: 'gorro' },
    { regex: /\b(touca|toucas)/i, tipo: 'touca' },
    { regex: /\b(turbante|turbantes)/i, tipo: 'turbante' },
    { regex: /\b(dolma|dolmã|dólmã)/i, tipo: 'dolma' },
    { regex: /\b(avental|aventais)/i, tipo: 'avental' },
    { regex: /\b(robe|robes)/i, tipo: 'robe' },
    { regex: /\b(macacao|macacão|macacões)/i, tipo: 'macacao' },
    { regex: /\b(vestido|vestidos)/i, tipo: 'vestido' },
    { regex: /\b(cracha|crachá|crachás)/i, tipo: 'cracha' },
    { regex: /\b(bandeja|bandejas)/i, tipo: 'bandeja' },
    { regex: /\b(desk.?pad)/i, tipo: 'desk-pad' },
    { regex: /\b(kit.?office)/i, tipo: 'kit-office' },
    { regex: /\b(mouse.?pad)/i, tipo: 'mouse-pad' },
    { regex: /\b(porta.?canetas?)/i, tipo: 'porta-canetas' },
    { regex: /\b(porta.?copos?)/i, tipo: 'porta-copo' },
    { regex: /\b(porta.?objetos?)/i, tipo: 'porta-objetos' }
  ];
  
  for (const { regex, tipo } of tiposPadroes) {
    if (regex.test(msgLower)) {
      dadosExtraidos.tipo = tipo;
      acao = 'capturar_tipo';
      intencao = 'registrar_preferencia';
      console.log(`✅ Manual detectou tipo: ${tipo} (variação aceita)`);
      break;
    }
  }
  
  // 🔥 FRUSTRAÇÃO TEM PRIORIDADE MÁXIMA (verifica DEPOIS de extrair dados)
  if (msgLower.match(/\b(j[aá] (falei|disse)|de novo|quantas vezes|outra vez)\b/)) {
    intencao = 'confirmar_preferencia';
    acao = 'confirmar_tipo'; // Cliente repetindo = confirmando o que já disse
    console.log('⚠️ FRUSTRAÇÃO DETECTADA: Cliente repetindo informação!');
    console.log(`   → Forçando intencao:confirmar_preferencia (cliente TEM RAZÃO)`);
  }
  
  // Detectar confirmação (só se não for frustração)
  else if (msgLower.match(/\b(sim|pode|quero|aceito|beleza|ok|isso|concordo|claro)\b/)) {
    intencao = 'confirmar_preferencia';
    acao = 'confirmar_tipo'; // Contexto vai determinar qual confirmar
  } 
  // Detectar negação
  else if (msgLower.match(/\b(não|nao|nunca)\b/)) {
    intencao = 'negar';
  } 
  // Detectar mudança
  else if (msgLower.match(/\b(mudar|trocar|outra|outro)\b/)) {
    intencao = 'atualizar_preferencia';
  }
  
  // Gênero (ORDEM 2)
  if (msgLower.match(/\b(masculino|homem)\b/)) { dadosExtraidos.genero = 'masculino'; acao = 'capturar_genero'; intencao = 'registrar_preferencia'; }
  if (msgLower.match(/\b(feminino|mulher)\b/)) { dadosExtraidos.genero = 'feminino'; acao = 'capturar_genero'; intencao = 'registrar_preferencia'; }
  if (msgLower.includes('unissex')) { dadosExtraidos.genero = 'unissex'; acao = 'capturar_genero'; intencao = 'registrar_preferencia'; }
  
  // Cores (ORDEM 3)
  const cores = ['azul', 'branco', 'preto', 'verde', 'rosa', 'bege', 'vermelho', 'amarelo', 'roxo', 'cinza'];
  cores.forEach(cor => {
    if (msgLower.includes(cor)) { 
      dadosExtraidos.cor = cor; 
      acao = 'capturar_cor'; 
      intencao = 'registrar_preferencia';
    }
  });
  
  return {
    sucesso: true,
    intencao,
    acao,
    sentimento: 'neutro',
    dadosExtraidos,
    perguntaMagicaAplicavel: false,
    mudancaDetectada: intencao === 'atualizar_preferencia',
    explicacao: `Manual: detectou acao=${acao}, dados=${JSON.stringify(dadosExtraidos)}`
  };
}

export { analisarMensagemManual };
