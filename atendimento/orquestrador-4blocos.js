import 'dotenv/config';
import OpenAI from 'openai';
import { supabase } from '../db/supabase.js';
import { buscarProdutosComIA } from './buscar_produtos_ia.js';
import { iniciarTimeout, cancelarTimeout } from './timeout-conversa.js';
import { entenderMensagem } from './entender_mensagem_IA.js';
import { 
  matchTipoProduto, 
  matchModelo, 
  matchCor, 
  matchGenero,
  matchConfirmacao,
  extrairNome,
  listarTiposProdutos,
  listarModelos,
  listarModelosFiltrados,
  listarCores,
  listarCoresDoTipo,
  buscarProdutosDireto,
  carregarCatalogoPorTipo,
  normalizar
} from './match-catalogo.js';

const openai = new OpenAI({
  apiKey: process.env.CHATGPT_API_KEY
});

/**
 * ORQUESTRADOR SIMPLIFICADO - SISTEMA DE ATENDIMENTO JANA
 * COM MATCH DIRETO E MEMÓRIA PERSISTENTE
 * 
 * FLUXO SIMPLIFICADO (Tipo + Gênero + Cor):
 * 1. Saudação e Identificação (nome)
 * 2. Filtro Tipo (direto, sem confirmação)
 * 3. Filtro Gênero (direto, sem confirmação)
 * 4. Filtro Cor
 * 5. Confirmação ÚNICA (tipo + gênero + cor)
 * 6. Busca (mostra TODOS modelos filtrados)
 * 7. Feedback (continuar ou encerrar?)
 * 8. Encerramento (transfere para humano)
 * 
 * FASES:
 * - saudacao
 * - identificacao
 * - filtro_tipo
 * - filtro_genero
 * - filtro_cor
 * - confirmacao_cor (ÚNICA pergunta mágica)
 * - busca
 * - feedback
 * - encerramento
 */

/**
 * Busca ou cria conversa no Supabase
 */
async function buscarOuCriarConversa(numeroCliente) {
  // Retry logic - tentar 3 vezes
  let tentativas = 0;
  let conversas, error;
  
  while (tentativas < 3) {
    const resultado = await supabase
      .from('conversas')
      .select('*')
      .eq('numero_cliente', numeroCliente)
      .eq('atendimento_encerrado', false)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    conversas = resultado.data;
    error = resultado.error;
    
    if (!error) break;
    
    tentativas++;
    console.log(`⚠️ Tentativa ${tentativas}/3 falhou, tentando novamente...`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1s
  }

  if (error) {
    console.error('Erro ao buscar conversa:', error);
    throw error;
  }

  if (conversas && conversas.length > 0) {
    return conversas[0];
  }

  // Criar nova conversa
  const { data: novaConversa, error: erroInsert } = await supabase
    .from('conversas')
    .insert({
      numero_cliente: numeroCliente,
      mensagem_cliente: '',
      contexto: '[]', // texto vazio como string
      acao: 'conversa',
      metadados: {},
      fase_atendimento: 'saudacao',
      data_ultima_interacao: new Date().toISOString()
    })
    .select()
    .single();

  if (erroInsert) {
    console.error('Erro ao criar conversa:', erroInsert);
    throw erroInsert;
  }

  return novaConversa;
}

/**
 * Atualiza conversa no banco
 */
async function atualizarConversa(conversaId, updates) {
  console.log(`💾 SALVANDO NO SUPABASE (ID: ${conversaId}):`);
  console.log(JSON.stringify(updates, null, 2));
  
  const { data, error } = await supabase
    .from('conversas')
    .update({
      ...updates,
      data_ultima_interacao: new Date().toISOString()
    })
    .eq('id', conversaId)
    .select();

  if (error) {
    console.error('❌ ERRO AO SALVAR:', error);
    throw error;
  }
  
  console.log('✅ SALVO COM SUCESSO:', data);
}

/**
 * Monta prompt dinâmico COM PAYLOAD COMPLETO VISÍVEL
 */
function montarPromptComPayload(fase, payload, mensagemCliente, historico) {
  const nome = payload.nome || 'cliente';
  const prefs = payload.preferencias || {};
  
  let promptBase = `Você é Jana, atendente da Dana Jalecos. Seja DIRETA, use o NOME DO CLIENTE e emojis moderados.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PAYLOAD COMPLETO (MEMÓRIA):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Nome: ${nome}
🎯 Tipo Produto: ${prefs.tipoProduto || 'não definido'}
👔 Gênero: ${prefs.genero || 'não definido'}
🎨 Cor: ${prefs.cor || 'não definido'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HISTÓRICO (últimas 3 mensagens):
${historico.slice(-3).map(h => `${h.tipo === 'bot' ? 'Jana' : nome}: ${h.mensagem}`).join('\n')}

MENSAGEM ATUAL DO CLIENTE: "${mensagemCliente}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  switch (fase) {
    case 'saudacao':
      return promptBase + `┌─────────────────────────────────┐
│ FASE 1: SAUDAÇÃO - APRESENTAÇÃO
└─────────────────────────────────┘

OBJETIVO: Apresentar-se como Jana e perguntar o NOME.

REGRA ABSOLUTA:
- SEMPRE diga: "Olá! 👋 Meu nome é Jana, assistente virtual da Dana Jalecos! Estou aqui para te ajudar a encontrar os melhores produtos para você. Como posso te chamar?"
- NÃO pergunte sobre produto ainda
- NÃO ofereça catálogo
- FOQUE APENAS em saber o nome

Responda EXATAMENTE:`;

    case 'identificacao':
      // APÓS CAPTURAR O NOME, AGRADECER E MOSTRAR LISTA DE PRODUTOS
      const todosTipos = listarTiposProdutos();
      
      return promptBase + `┌──────────────────────────────────────┐
│ FASE 2: APÓS IDENTIFICAÇÃO
└──────────────────────────────────────┘

OBJETIVO: Cumprimentar pelo nome e mostrar lista de produtos.

📦 PRODUTOS DISPONÍVEIS NA LOJA:
${todosTipos.map(t => `• ${t.charAt(0).toUpperCase() + t.slice(1)}`).join('\n')}

REGRAS:
- Cumprimente: "Ótimo, ${nome}! Vou te mostrar nossos produtos. 😊"
- Mostre TODA a lista acima (use bullets •)
- Pergunte: "Qual desses produtos te interessa?"
- Cliente responde com o NOME do produto
- Se cliente mencionar produto válido, capturar e avançar para confirmacao_tipo

Responda:`;

    case 'filtro_tipo':
      const tipos = listarTiposProdutos();
      
      return promptBase + `┌──────────────────────────────────────┐
│ FASE: TIPO DE PRODUTO
└──────────────────────────────────────┘

OBJETIVO: Cliente escolher tipo de produto da lista.

📦 PRODUTOS DISPONÍVEIS:
${tipos.map(t => `• ${t.charAt(0).toUpperCase() + t.slice(1)}`).join('\n')}

REGRAS CRÍTICAS:
- Mostre EXATAMENTE a lista acima (com bullets •)
- Diga: "${nome}, qual desses produtos você quer? 😊"
- NÃO converse, NÃO invente cores, NÃO ofereça links
- APENAS mostre lista e pergunte
- Aguarde resposta do cliente

Responda:`;

    case 'filtro_genero':
      return promptBase + `┌──────────────────────────────────────┐
│ FASE: GÊNERO
└──────────────────────────────────────┘

TIPO ESCOLHIDO: ${prefs.tipoProduto}

REGRAS CRÍTICAS:
- Diga APENAS: "${nome}, masculino, feminino ou unissex? 👔"
- NÃO converse, NÃO ofereça cores, NÃO ofereça links
- APENAS pergunte o gênero
- Aguarde resposta

Responda:`;

    case 'filtro_cor':
      // LISTAR **TODAS** AS CORES DO TIPO ESCOLHIDO
      const coresDisponiveis = listarCoresDoTipo(prefs.tipoProduto);
      
      // SE NÃO TEM CORES, informar cliente
      if (!coresDisponiveis || coresDisponiveis.length === 0) {
        return promptBase + `┌──────────────────────────────────────┐
│ ERRO: SEM CORES
└──────────────────────────────────────┘

REGRAS:
- Diga: "Desculpe ${nome}, não encontrei cores para ${prefs.tipoProduto}. 😔"
- Pergunte se quer outro produto

Responda:`;
      }
      
      // FORMATAR lista com TODAS as cores
      const listaCores = coresDisponiveis.map(cor => `• ${cor}`).join('\n');
      
      return promptBase + `┌──────────────────────────────────────┐
│ FASE: COR
└──────────────────────────────────────┘

TIPO: ${prefs.tipoProduto} ${prefs.genero || ''}

🎨 CORES DISPONÍVEIS (${coresDisponiveis.length} opções):

${listaCores}

⚠️ IMPORTANTE: Liste APENAS cores que TEM produtos disponíveis no estoque.

REGRAS CRÍTICAS:
- Mostre TODAS as ${coresDisponiveis.length} cores acima (com bullets •)
- Diga: "${nome}, qual cor você prefere? 🎨"
- NÃO converse, NÃO invente cores, NÃO ofereça links
- APENAS mostre lista completa e pergunte
- Aguarde resposta

Responda:`;

    case 'confirmacao_cor':
      // ÚNICA PERGUNTA MÁGICA - Confirmação COMPLETA antes da busca
      const corEscolhida = prefs.cor || 'qualquer';
      
      return promptBase + `┌──────────────────────────────────────┐
│ PERGUNTA MÁGICA FINAL - CONFIRMAÇÃO COMPLETA
└──────────────────────────────────────┘

OBJETIVO: Confirmar TODOS os dados antes de buscar produtos.

DADOS COLETADOS:
✓ Tipo: ${prefs.tipoProduto}
✓ Gênero: ${prefs.genero}
✓ Cor: ${corEscolhida}

REGRA CRÍTICA - PERGUNTA MÁGICA:
- Diga APENAS: "Então posso pesquisar para você ${prefs.tipoProduto} ${prefs.genero} da cor ${corEscolhida}? 🤔"
- AGUARDE confirmação do cliente (sim/não)
- Se SIM: avança para busca
- Se NÃO: volta para filtro_cor

Responda:`;

    case 'busca':
      return promptBase + `┌──────────────────────────────────────┐
│ EXECUTANDO BUSCA...
└──────────────────────────────────────┘

FILTROS:
✓ Tipo: ${prefs.tipoProduto}
✓ Gênero: ${prefs.genero}
✓ Cor: ${prefs.cor}

REGRA CRÍTICA:
- Diga APENAS: "Buscando ${prefs.tipoProduto} ${prefs.genero} ${prefs.cor}... ⏳"
- NÃO mostre produtos aqui (o sistema vai buscar e mostrar automaticamente)
- NÃO invente links
- Seja BREVE

Responda:`;
    
    case 'feedback':
      return promptBase + `┌──────────────────────────────────────┐
│ FEEDBACK
└──────────────────────────────────────┘

REGRAS CRÍTICAS:
- Diga APENAS: "${nome}, posso te ajudar com mais algum produto? 😊"
- NÃO converse
- AGUARDE resposta

Responda:`;

    case 'reiniciar':
      return promptBase + `┌──────────────────────────────────────┐
│ FASE 7: REINICIAR BUSCA
└──────────────────────────────────────┘

OBJETIVO: Limpar preferências e começar nova busca.

REGRA CRÍTICA:
- Diga: "Ótimo, ${nome}! Vou te ajudar a buscar outro produto. 😊"
- O sistema vai LIMPAR todas as preferências (tipo e cor)
- Voltar para fase 'filtro_tipo' para começar nova busca
- NÃO pergunte nada mais, apenas confirme que vai começar de novo

Responda:`;

    case 'encerramento':
      return promptBase + `┌──────────────────────────────────────┐
│ FASE 8: ENCERRAMENTO E TRANSFERÊNCIA
└──────────────────────────────────────┘

OBJETIVO: Encerrar atendimento do bot e transferir para humano.

REGRAS CRÍTICAS:
- Agradeça: "Muito obrigado pela atenção, ${nome}! 😊"
- Avise: "Vou transferir sua conversa para um atendente humano que poderá finalizar sua compra e tirar outras dúvidas."
- O sistema vai marcar conversa como encerrada (bot não responde mais)
- NÃO ofereça mais ajuda automatizada
- NÃO volte para outras fases

Responda:`;

    default:
      return promptBase;
  }
}

/**
 * Extrai dados estruturados da resposta da IA
 */
async function extrairDadosResposta(mensagemCliente, fase, contexto) {
  const prompt = `Analise a mensagem do cliente e extraia dados estruturados.

MENSAGEM: "${mensagemCliente}"
FASE ATUAL: ${fase}

Retorne APENAS JSON válido:
{
  "nomeCliente": "string ou null",
  "profissao": "string ou null",
  "tipoProduto": "string ou null",
  "modelo": "string ou null",
  "cor": "string ou null",
  "genero": "masculino/feminino/unissex ou null",
  "confirmouBusca": boolean,
  "querEncerrar": boolean
}`;

  const resultado = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3
  });
  
  try {
    return JSON.parse(resultado.choices[0].message.content);
  } catch {
    return {};
  }
}

/**
 * PROCESSADOR PRINCIPAL - 4 BLOCOS COM MATCH DIRETO
 */
export async function processarMensagemRecebida(mensagemCliente, numeroCliente) {
  console.log('\n' + '='.repeat(80));
  console.log('🤖 PROCESSANDO - SISTEMA 4 BLOCOS COM MATCH DIRETO');
  console.log('='.repeat(80));
  console.log(`📥 Cliente: ${numeroCliente}`);
  console.log(`💬 Mensagem: ${mensagemCliente}`);
  
  try {
    // 1. Buscar ou criar conversa
    const conversa = await buscarOuCriarConversa(numeroCliente);
    const fase = conversa.fase_atendimento;
    
    console.log(`📊 Fase: ${fase}`);
    console.log(`👤 Nome: ${conversa.nome_cliente || 'não coletado'}`);
    
    // 2. Montar PAYLOAD COMPLETO
    // ⚠️ PARSEAR preferencias se vier como string JSON
    let preferenciasObj = conversa.preferencias || {};
    
    if (typeof preferenciasObj === 'string') {
      try {
        preferenciasObj = JSON.parse(preferenciasObj);
      } catch {
        preferenciasObj = { tipoProduto: null, modelo: null, cor: null, genero: null };
      }
    }
    
    // ⚠️ PARSEAR contexto se vier como string JSON
    let contextoArray = conversa.contexto || [];
    
    if (typeof contextoArray === 'string') {
      try {
        contextoArray = JSON.parse(contextoArray);
      } catch {
        contextoArray = [];
      }
    }
    
    const payload = {
      nome: conversa.nome_cliente,
      fase,
      preferencias: preferenciasObj,
      contexto: Array.isArray(contextoArray) ? contextoArray : [],
      produtosEncontrados: conversa.produtos_encontrados || [],
      ultimaBusca: conversa.ultima_busca || null
    };
    
    // 🕐 INICIAR TIMER DE TIMEOUT (2 minutos)
    iniciarTimeout(numeroCliente, payload, supabase);
    
    console.log('📦 PAYLOAD ATUAL:', JSON.stringify(payload, null, 2));
    
    // 3. Buscar HISTÓRICO COMPLETO (TODAS mensagens cliente + bot)
    console.log('📚 Carregando histórico COMPLETO da conversa...');
    const { data: historicoMsgs } = await supabase
      .from('conversas')
      .select('mensagem_cliente, metadados, timestamp')
      .eq('numero_cliente', numeroCliente)
      .order('timestamp', { ascending: true })
      .limit(50);  // 50 últimas mensagens (memória COMPLETA)
    
    // Montar histórico alternado (cliente → bot → cliente → bot)
    const historicoCompleto = [];
    (historicoMsgs || []).forEach(h => {
      // Mensagem do CLIENTE
      if (h.mensagem_cliente) {
        historicoCompleto.push({
          role: 'cliente',
          mensagem: h.mensagem_cliente,
          timestamp: h.timestamp
        });
      }
      // Resposta do BOT
      if (h.metadados?.resposta_bot) {
        historicoCompleto.push({
          role: 'bot',
          mensagem: h.metadados.resposta_bot,
          timestamp: h.timestamp
        });
      }
    });
    
    console.log(`   ✅ ${historicoCompleto.length} mensagens carregadas (cliente + bot)`);
    
    // 4. CONSULTAR IA PRIMEIRO (É A ÚNICA VERDADE)
    console.log('\n🧠 Consultando IA (ÚNICA FONTE DE DECISÃO)...');
    const resultadoIA = await entenderMensagem(mensagemCliente, payload, historicoCompleto);
    
    // IA É A DECISÃO FINAL (regex NÃO EXISTE MAIS)
    let decisaoFinal = {
      nome: resultadoIA.dadosExtraidos?.nome || null,
      tipo: resultadoIA.dadosExtraidos?.tipo || null,
      genero: resultadoIA.dadosExtraidos?.genero || null,
      cor: resultadoIA.dadosExtraidos?.cor || null,
      confirmacao: resultadoIA.intencao === 'confirmar_preferencia' ? true : (resultadoIA.intencao === 'negar' ? false : null),
      intencao: resultadoIA.intencao,
      acao: resultadoIA.acao,
      sentimento: resultadoIA.sentimento
    };
    
    console.log('✅ Decisão FINAL (100% IA):');
    console.log(`  Nome: ${decisaoFinal.nome || 'não detectado'}`);
    console.log(`  Tipo: ${decisaoFinal.tipo || 'não detectado'}`);
    console.log(`  Gênero: ${decisaoFinal.genero || 'não detectado'}`);
    console.log(`  Cor: ${decisaoFinal.cor || 'não detectado'}`);
    console.log(`  Confirmação: ${decisaoFinal.confirmacao !== null ? decisaoFinal.confirmacao : 'não detectado'}`);
    console.log(`  Intenção: ${decisaoFinal.intencao}`);
    console.log(`  Ação: ${decisaoFinal.acao}`);
    
    // 5. DETECTAR REJEIÇÃO DE CAPTURA ERRADA
    const msgLower = mensagemCliente.toLowerCase();
    if (msgLower.match(/n[aã]o escolhi|n[aã]o quero|não é|errado|engano/)) {
      // Cliente está rejeitando algo capturado
      console.log('⚠️ CLIENTE REJEITOU CAPTURA!');
      
      // Limpar a preferência que foi capturada errada
      if (payload.preferencias.tipoProduto && msgLower.includes(payload.preferencias.tipoProduto.toLowerCase())) {
        console.log(`🗑️ Limpando tipo errado: ${payload.preferencias.tipoProduto}`);
        payload.preferencias.tipoProduto = null;
        updates.preferencias = payload.preferencias;
        
        await atualizarConversa(conversa.id, updates);
        return `Desculpe ${payload.nome}, entendi errado! Vou perguntar novamente: qual produto você quer?`;
      }
    }
    
    // 5.2 DETECTAR REJEIÇÃO DE ENCERRAMENTO
    // Cliente na fase 'encerramento' mas quer CONTINUAR sendo atendido
    if (fase === 'encerramento' && msgLower.match(/n[aã]o|continue|continua|ajude|ajudar|quero|pesquis|procur|buscar|outro|mais/)) {
      console.log('🔄 CLIENTE REJEITOU ENCERRAMENTO - quer continuar sendo atendido');
      updates.fase_atendimento = 'refinamento';
      await atualizarConversa(conversa.id, updates);
      return `Claro ${payload.nome}! Estou aqui para ajudar. 😊\n\nQuer buscar outro produto ou alterar algo na busca anterior?`;
    }
    
    // 5.3 DETECTAR PERGUNTA SOBRE DISPONIBILIDADE
    // "quais modelos tem na cor azul?", "qual tem na cor branca?", "qual avental tem disponível?"
    const perguntaDisponibilidade = msgLower.match(/quais? (modelo|modelos|tem|opcoes|opcao|disponivel|disponiveis).*?(cor|azul|branco|preto|masculino|feminino)/i) ||
                                     msgLower.match(/(modelo|modelos|opcoes|avental|jaleco|gorro|dolma) (tem|na cor|da cor|de|com|disponivel)/i) ||
                                     msgLower.match(/qual.*(modelo|modelos|tem|avental|jaleco|gorro).*(cor|azul|branco|preto|areia|verde|rosa)/i) ||
                                     msgLower.match(/quero (as|os) (opcoes|modelos)/i) ||
                                     msgLower.match(/(qual|quais|tem).*(disponivel|disponiveis|tem).*(cor)/i);
    
    if (perguntaDisponibilidade && payload.preferencias.tipoProduto) {
      try {
        console.log('📋 CLIENTE PERGUNTOU SOBRE DISPONIBILIDADE');
        
        // Detectar se perguntou sobre cor específica
        const corPerguntada = matchCor(mensagemCliente, payload.preferencias.tipoProduto);
        const generoPerguntado = matchGenero(mensagemCliente);
        
        console.log(`   Cor detectada na pergunta: ${corPerguntada || 'nenhuma'}`);
        console.log(`   Cor atual no payload: ${payload.preferencias.cor || 'nenhuma'}`);
        
        // Usar gênero e cor do payload ou da pergunta
        const generoParaFiltrar = generoPerguntado || payload.preferencias.genero;
        const corParaFiltrar = corPerguntada || payload.preferencias.cor || null;
        
        // Buscar modelos filtrados
        const modelosDisponiveis = listarModelosFiltrados(
          payload.preferencias.tipoProduto,
          generoParaFiltrar,
          corParaFiltrar
        );
        
        if (modelosDisponiveis.length > 0) {
        let resposta = `${payload.nome}, `;
        if (corParaFiltrar && generoParaFiltrar) {
          resposta += `aqui estão os modelos de ${payload.preferencias.tipoProduto} ${generoParaFiltrar} disponíveis na cor ${corParaFiltrar}:\\n\\n`;
        } else if (corParaFiltrar) {
          resposta += `aqui estão os modelos disponíveis na cor ${corParaFiltrar}:\\n\\n`;
        } else if (generoParaFiltrar) {
          resposta += `aqui estão os modelos ${generoParaFiltrar} disponíveis:\\n\\n`;
        } else {
          resposta += `aqui estão os modelos disponíveis:\\n\\n`;
        }
        
        modelosDisponiveis.slice(0, 20).forEach((modelo, i) => {
          resposta += `• ${modelo}\\n`;
        });
        
        if (modelosDisponiveis.length > 20) {
          resposta += `\\n... e mais ${modelosDisponiveis.length - 20} modelos!`;
        }
        
        resposta += `\\n\\nQual modelo você prefere? 😊`;
        
        // SEMPRE salvar cor perguntada (mesmo que seja null, para limpar preferência antiga)
        if (corPerguntada && corPerguntada !== payload.preferencias.cor) {
          console.log(`   ✅ Atualizando cor no payload: "${payload.preferencias.cor}" → "${corPerguntada}"`);
          payload.preferencias.cor = corPerguntada;
          updates.preferencias = payload.preferencias;
          updates.fase_atendimento = 'filtro_modelo';
          await atualizarConversa(conversa.id, updates);
        }
        
        return resposta;
      } else {
        // Se não encontrou, pode ser que esteja perguntando após ter escolhido um modelo específico
        // Nesse caso, sugira outros modelos disponíveis na cor
        if (corParaFiltrar && payload.preferencias.modelo) {
          // Cliente tem modelo selecionado mas perguntou sobre cor
          // Verificar se existem outros modelos nessa cor
          const outrosModelos = listarModelosFiltrados(
            payload.preferencias.tipoProduto,
            generoParaFiltrar,
            corParaFiltrar
          );
          
          if (outrosModelos.length > 0) {
            let resposta = `${payload.nome}, não temos o modelo ${payload.preferencias.modelo} na cor ${corParaFiltrar}, mas temos esses modelos ${generoParaFiltrar || ''} disponíveis:\\n\\n`;
            outrosModelos.slice(0, 10).forEach((modelo, i) => {
              resposta += `${i + 1}. ${modelo}\\n`;
            });
            resposta += `\\nQuer que eu pesquise algum desses para você? 😊`;
            
            // Atualizar preferência de cor para facilitar próxima busca
            payload.preferencias.cor = corParaFiltrar;
            updates.preferencias = payload.preferencias;
            updates.fase_atendimento = 'filtro_modelo';
            await atualizarConversa(conversa.id, updates);
            
            return resposta;
          }
        }
        
        return `Desculpe ${payload.nome}, não encontrei modelos ${generoParaFiltrar || ''} ${corParaFiltrar ? `na cor ${corParaFiltrar}` : ''} disponíveis. 😔\\n\\nQuer tentar outra cor ou gênero?`;
      }
      } catch (error) {
        console.error('❌ Erro na detecção de disponibilidade:', error);
        // Não retornar erro, apenas continuar com o fluxo normal
      }
    }
    
    // ⚠️ CÓDIGO DE DETECÇÃO DE MUDANÇA REMOVIDO - USA APENAS decisaoFinal DA IA
    
    // 6. ATUALIZAR PAYLOAD com decisaoFinal da IA (IA sempre tem prioridade)
    let updates = {
      mensagem_cliente: mensagemCliente,
      metadados: { tipo: 'cliente' }
    };
    
    // ⚠️ DETECTAR MUDANÇA DE PRODUTO - Se cliente menciona NOVO produto, limpar preferências antigas
    if (decisaoFinal.tipo && decisaoFinal.tipo !== payload.preferencias.tipoProduto) {
      console.log(`🔄 MUDANÇA DE PRODUTO DETECTADA: "${payload.preferencias.tipoProduto}" → "${decisaoFinal.tipo}"`);
      console.log('   Limpando preferências antigas...');
      payload.preferencias = { tipoProduto: null, genero: null, cor: null };
      payload.contexto.push(`Cliente mudou de ${payload.preferencias.tipoProduto || 'nada'} para ${decisaoFinal.tipo}`);
    }
    
    // ⚠️ CAPTURAR NOME APENAS NA FASE SAUDACAO/IDENTIFICACAO
    if ((fase === 'saudacao' || fase === 'identificacao') && !payload.nome) {
      // Se IA não detectou nome, mas cliente respondeu algo, usar a mensagem como nome
      if (decisaoFinal.nome) {
        payload.nome = decisaoFinal.nome;
        updates.nome_cliente = decisaoFinal.nome;
        payload.contexto.push(`Nome capturado pela IA: ${decisaoFinal.nome}`);
        console.log(`✅ NOME CAPTURADO (IA): ${decisaoFinal.nome}`);
      } else if (fase === 'saudacao' && mensagemCliente.trim().length > 0) {
        // FALLBACK: Na fase saudação, QUALQUER texto é aceito como nome
        const nomeFallback = mensagemCliente.trim().split(' ')[0]; // Primeira palavra
        payload.nome = nomeFallback;
        updates.nome_cliente = nomeFallback;
        payload.contexto.push(`Nome capturado (fallback): ${nomeFallback}`);
        console.log(`✅ NOME CAPTURADO (FALLBACK): ${nomeFallback}`);
      }
    }
    
    // SEMPRE MANTER O NOME NO UPDATE (se existir)
    if (payload.nome) {
      updates.nome_cliente = payload.nome;
    }
    
    // CAPTURAR PREFERÊNCIAS (tipo → genero → cor)
    // ⚠️ IA pode detectar múltiplos filtros na MESMA mensagem
    
    // CAPTURAR TIPO (sempre que IA detectar)
    if (decisaoFinal.tipo && !payload.preferencias.tipoProduto) {
      payload.preferencias.tipoProduto = decisaoFinal.tipo;
      payload.contexto.push(`✅ TIPO capturado: "${decisaoFinal.tipo}"`);
      console.log(`✅ TIPO CAPTURADO: ${decisaoFinal.tipo}`);
    }
    
    // CAPTURAR GÊNERO (sempre que IA detectar)
    if (decisaoFinal.genero && !payload.preferencias.genero) {
      payload.preferencias.genero = decisaoFinal.genero;
      payload.contexto.push(`✅ GÊNERO capturado: "${decisaoFinal.genero}"`);
      console.log(`✅ GÊNERO CAPTURADO: ${decisaoFinal.genero}`);
    }
    
    // CAPTURAR COR (sempre que IA detectar)
    if (decisaoFinal.cor && !payload.preferencias.cor) {
      payload.preferencias.cor = decisaoFinal.cor;
      payload.contexto.push(`✅ COR capturada: "${decisaoFinal.cor}"`);
      console.log(`✅ COR CAPTURADA: ${decisaoFinal.cor}`);
    }
    
    // ⚠️ SALVAR preferencias e contexto no banco (JSONB)
    updates.preferencias = payload.preferencias;
    // Contexto deve ser salvo como JSONB array
    updates.contexto = Array.isArray(payload.contexto) ? payload.contexto : [];
    
    // 7. DETERMINAR PRÓXIMA FASE baseado no payload
    let novaFase = fase;
    
    // ⚠️ SE CAPTUROU MÚLTIPLOS FILTROS DE UMA VEZ, pular fases intermediárias
    if (payload.preferencias.tipoProduto && payload.preferencias.genero && payload.preferencias.cor) {
      console.log('⏭️ MÚLTIPLOS FILTROS CAPTURADOS - indo direto para confirmação final');
      novaFase = 'confirmacao_cor';
      payload.contexto.push('Cliente forneceu tipo + gênero + cor de uma vez');
    }
    // Se tem tipo + gênero (mas não cor), pular para filtro_cor
    else if (payload.preferencias.tipoProduto && payload.preferencias.genero && !payload.preferencias.cor) {
      console.log('⏭️ TIPO + GÊNERO capturados - indo para filtro_cor');
      novaFase = 'filtro_cor';
      payload.contexto.push('Cliente forneceu tipo + gênero, perguntando cor');
    }
    // Se tem apenas tipo (mas não gênero), pular para filtro_genero
    else if (payload.preferencias.tipoProduto && !payload.preferencias.genero) {
      console.log('⏭️ TIPO capturado - indo para filtro_genero');
      novaFase = 'filtro_genero';
      payload.contexto.push('Cliente forneceu tipo, perguntando gênero');
    }
    // Senão, seguir fluxo normal
    else if (fase === 'saudacao') {
      // ⚠️ SEMPRE avançar da saudação se tiver nome (IA ou fallback)
      if (payload.nome) {
        novaFase = 'identificacao';
        payload.contexto.push('Avançou para identificação após capturar nome');
        console.log('→ Avançou: SAUDAÇÃO → IDENTIFICAÇÃO');
      } else {
        // Se ainda não tem nome, continuar na saudação
        console.log('⚠️ Ainda na SAUDAÇÃO - aguardando nome');
      }
    }
    else if (fase === 'identificacao' && payload.nome) {
      // ⚠️ SE JÁ CAPTUROU TIPO NA MESMA MENSAGEM, IR DIRETO PARA GÊNERO
      if (payload.preferencias.tipoProduto) {
        console.log('   ⏭️ Cliente mencionou produto na identificação - pulando lista');
        novaFase = 'filtro_genero';
        payload.contexto.push(`Cliente mencionou ${payload.preferencias.tipoProduto} - indo direto para gênero`);
        console.log('→ Avançou: IDENTIFICAÇÃO → FILTRO GÊNERO (produto já mencionado)');
      } else {
        // Se não mencionou tipo, mostrar lista
        novaFase = 'filtro_tipo';
        payload.contexto.push('Mostrando lista de produtos após identificação');
        console.log('→ Avançou: IDENTIFICAÇÃO → FILTRO TIPO (mostrar lista)');
      }
    }
    else if (fase === 'filtro_tipo' && payload.preferencias.tipoProduto) {
      novaFase = 'filtro_genero';
      payload.contexto.push(`Tipo capturado: ${payload.preferencias.tipoProduto} - Avançando para gênero`);
      console.log('→ Avançou: FILTRO TIPO → FILTRO GÊNERO (direto, sem confirmação)');
    }
    else if (fase === 'filtro_genero' && payload.preferencias.genero) {
      novaFase = 'filtro_cor';
      payload.contexto.push(`Gênero capturado: ${payload.preferencias.genero} - Avançando para cor`);
      console.log('→ Avançou: FILTRO GÊNERO → FILTRO COR (direto, sem confirmação)');
    }
    else if (fase === 'filtro_cor' && payload.preferencias.cor) {
      novaFase = 'confirmacao_cor';
      payload.contexto.push(`Avançou para confirmação de cor após escolher ${payload.preferencias.cor}`);
      console.log('→ Avançou: FILTRO COR → CONFIRMAÇÃO COR');
    }
    else if (fase === 'confirmacao_cor' && decisaoFinal.confirmacao === true) {
      novaFase = 'busca';
      payload.contexto.push(`✅ CLIENTE CONFIRMOU COR: ${payload.preferencias.cor} - AÇÃO: Executar busca de TODOS os modelos do tipo ${payload.preferencias.tipoProduto} na cor ${payload.preferencias.cor}`);
      console.log('→ Avançou: CONFIRMAÇÃO COR → BUSCA');
    }
    else if (fase === 'confirmacao_cor' && decisaoFinal.confirmacao === false) {
      novaFase = 'filtro_cor';
      payload.contexto.push('Cliente não confirmou cor, voltando para escolher outra');
      console.log('→ Voltou: CONFIRMAÇÃO COR → FILTRO COR (rejeitou)');
    }
    else if (fase === 'busca') {
      // Após buscar produtos, ir para FEEDBACK
      novaFase = 'feedback';
      payload.contexto.push('Busca de TODOS os modelos realizada, indo para feedback');
      console.log('→ Avançou: BUSCA → FEEDBACK');
    }
    else if (fase === 'feedback') {
      // Cliente quer CONTINUAR buscando outro produto?
      if (decisaoFinal.confirmacao === true || mensagemCliente.match(/sim|quero|continua|continuar|buscar|outro|mais|ajud/i)) {
        novaFase = 'reiniciar';
        payload.contexto.push('Cliente quer continuar buscando, vai reiniciar fluxo');
        console.log('→ Avançou: FEEDBACK (quer continuar) → REINICIAR');
      }
      // Cliente quer ENCERRAR?
      else if (decisaoFinal.confirmacao === false || mensagemCliente.match(/n[aã]o|encerra|encerrar|pronto|s[oó] isso|suficiente|finaliza|acabou/i)) {
        novaFase = 'encerramento';
        payload.contexto.push('Cliente quer encerrar, transferindo para humano');
        console.log('→ Avançou: FEEDBACK (quer encerrar) → ENCERRAMENTO');
      }
    }
    else if (fase === 'reiniciar') {
      // Limpar preferências ANTES de capturar novas
      console.log('🗑️ Limpando preferências para nova busca');
      payload.preferencias = { tipoProduto: null, genero: null, cor: null };
      
      // ⚠️ CAPTURAR TODOS OS FILTROS que IA detectou
      if (decisaoFinal.tipo) {
        payload.preferencias.tipoProduto = decisaoFinal.tipo;
        console.log(`   ✅ Tipo capturado: ${decisaoFinal.tipo}`);
      }
      if (decisaoFinal.genero) {
        payload.preferencias.genero = decisaoFinal.genero;
        console.log(`   ✅ Gênero capturado: ${decisaoFinal.genero}`);
      }
      if (decisaoFinal.cor) {
        payload.preferencias.cor = decisaoFinal.cor;
        console.log(`   ✅ Cor capturada: ${decisaoFinal.cor}`);
      }
      
      // Decidir próxima fase baseado no que foi capturado
      if (payload.preferencias.tipoProduto && payload.preferencias.genero && payload.preferencias.cor) {
        // Tem tudo - ir para confirmação final
        novaFase = 'confirmacao_cor';
        payload.contexto.push('Cliente forneceu tipo + gênero + cor - indo para confirmação');
        console.log(`→ Avançou: REINICIAR → CONFIRMAÇÃO COR (todos os filtros capturados)`);
      } else if (payload.preferencias.tipoProduto && payload.preferencias.genero) {
        // Tem tipo + gênero - perguntar cor
        novaFase = 'filtro_cor';
        payload.contexto.push('Cliente forneceu tipo + gênero - perguntando cor');
        console.log(`→ Avançou: REINICIAR → FILTRO COR (tipo + gênero capturados)`);
      } else if (payload.preferencias.tipoProduto) {
        // Tem apenas tipo - perguntar gênero
        novaFase = 'filtro_genero';
        payload.contexto.push('Cliente forneceu tipo - perguntando gênero');
        console.log(`→ Avançou: REINICIAR → FILTRO GÊNERO (tipo capturado)`);
      } else {
        // Não capturou nada - mostrar lista
        novaFase = 'filtro_tipo';
        payload.contexto.push('Preferências limpas, começando nova busca');
        console.log('→ Avançou: REINICIAR → FILTRO TIPO (preferências limpas)');
      }
    }
    else if (fase === 'encerramento') {
      // Marcar conversa como encerrada
      console.log('🏁 Marcando conversa como encerrada');
      payload.atendimento_encerrado = true;
      payload.contexto.push('Atendimento encerrado, aguardando humano');
      console.log('→ ENCERRAMENTO: Atendimento finalizado');
    }
    
    updates.fase_atendimento = novaFase;
    
    // 8. SE JÁ TEM OS DADOS, NÃO PERGUNTAR DE NOVO
    // Verificar se fase atual ainda pede algo que já tem
    if (novaFase === 'filtro_tipo' && payload.preferencias.tipoProduto) {
      novaFase = 'filtro_genero';
      console.log('⏭️ Pulando FILTRO TIPO (já tem)');
    }
    if (novaFase === 'filtro_genero' && payload.preferencias.genero) {
      novaFase = 'filtro_cor';
      console.log('⏭️ Pulando FILTRO GÊNERO (já tem)');
    }
    if (novaFase === 'filtro_cor' && payload.preferencias.cor) {
      novaFase = 'confirmacao_cor';
      console.log('⏭️ Pulando FILTRO COR (já tem)');
    }
    if (novaFase === 'confirmacao_cor' && payload.preferencias.cor && decisaoFinal.confirmacao === true) {
      novaFase = 'busca';
      console.log('⏭️ Pulando CONFIRMAÇÃO COR (já confirmou)');
    }
    
    updates.fase_atendimento = novaFase;
    
    // 9. MONTAR PROMPT com payload completo visível (usando decisaoFinal da IA)
    const prompt = montarPromptComPayload(novaFase, payload, mensagemCliente, historicoCompleto);
    
    // 10. OBTER RESPOSTA DA IA (JÁ foi consultada no início - usar decisaoFinal)
    console.log('✅ Usando resultado da IA (já consultada)...');
    const respostaIA = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5  // Reduzido para respostas mais objetivas e menos criativas
    });
    let respostaTexto = respostaIA.choices[0].message.content;
    
    console.log(`✅ Resposta IA: ${respostaTexto.substring(0, 100)}...`);
    
    // 11. SE FASE = BUSCA, OBRIGATORIAMENTE buscar produtos E ir para FEEDBACK
    if (novaFase === 'busca' && payload.preferencias.tipoProduto && payload.preferencias.genero && payload.preferencias.cor) {
      const prefs = payload.preferencias;
      console.log('\n🔍 REALIZANDO BUSCA COM PREFERÊNCIAS:', prefs);
      
      // BUSCA DIRETA NO CATÁLOGO (case-insensitive)
      const produtos = buscarProdutosDireto(
        prefs.tipoProduto,
        prefs.modelo,
        prefs.cor,
        prefs.genero
      );
      
      console.log(`📦 Produtos encontrados: ${produtos.length}`);      
      // DEBUG: Se não encontrou, verificar normalização
      if (produtos.length === 0) {
        console.log('⚠️ NãO ENCONTROU PRODUTOS!');
        console.log(`   Tipo buscado: "${prefs.tipoProduto}"`);
        console.log(`   Gênero buscado: "${prefs.genero}"`);
        console.log(`   Cor buscada: "${prefs.cor}"`);
        console.log(`   Cor normalizada: "${normalizar(prefs.cor)}"`);
        
        // Listar cores disponíveis para debug
        const coresDisponiveis = listarCoresDoTipo(prefs.tipoProduto);
        console.log(`   Cores cadastradas (${coresDisponiveis.length}):`, coresDisponiveis.slice(0, 10));
      }      
      if (produtos && produtos.length > 0) {
        respostaTexto = `Encontrei ${produtos.length} produto(s)! 🎉

`;
        produtos.forEach((p, i) => {
          respostaTexto += `━━━━━━━━━━━━━━━━━━━━
`;
          respostaTexto += `📦 ${i + 1}. ${p.nome}

`;
          if (p.descricao) respostaTexto += `${p.descricao}

`;
          respostaTexto += `💰 R$ ${p.preco || 'Consultar'}
`;
          respostaTexto += `🔗 ${p.link || 'Link não disponível'}

`;
        });
        
        // NÃO incluir "Gostou?" aqui - será feito na próxima mensagem (fase feedback)
        // IMPORTANTE: Avançar para FEEDBACK
        novaFase = 'feedback';
        updates.fase_atendimento = novaFase;
        console.log('→ Após busca com produtos: BUSCA → FEEDBACK');
      } else {
        respostaTexto = `Desculpe ${payload.nome}, não encontrei produtos com essas especificações. 😔

`;
        respostaTexto += `🔍 Busca: ${payload.preferencias.tipoProduto} ${payload.preferencias.genero} ${payload.preferencias.cor}

`;
        respostaTexto += `Quer buscar outra cor ou outro produto?`;
        
        // Sem produtos: ir direto para refinamento
        novaFase = 'refinamento';
        updates.fase_atendimento = novaFase;
        console.log('→ Sem produtos: BUSCA → REFINAMENTO');
      }
    }
    
    // 12. INSERIR NOVA LINHA NO HISTÓRICO (CADA MENSAGEM = NOVA LINHA)
    console.log('💾 Inserindo NOVA linha no histórico...');
    
    // Retry logic - tentar 3 vezes
    let tentativas = 0;
    let novaLinha, erroInsert;
    
    while (tentativas < 3) {
      const resultado = await supabase
        .from('conversas')
        .insert({
          numero_cliente: numeroCliente,
          mensagem_cliente: mensagemCliente,
          nome_cliente: payload.nome || null,
          fase_atendimento: novaFase,
          preferencias: payload.preferencias, // JSONB direto
          contexto: JSON.stringify(payload.contexto), // Converter para STRING (campo é TEXT no banco)
          acao: 'conversa',
          metadados: {
            tipo: 'interacao',
            resposta_bot: respostaTexto
          },
          atendimento_encerrado: false,
          data_ultima_interacao: new Date().toISOString()
        })
        .select();
      
      novaLinha = resultado.data;
      erroInsert = resultado.error;
      
      if (!erroInsert) break;
      
      tentativas++;
      console.log(`⚠️ Tentativa ${tentativas}/3 falhou, tentando novamente...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1s
    }
    
    if (erroInsert) {
      console.error('❌ ERRO AO INSERIR:', erroInsert);
      console.error('❌ Detalhes:', erroInsert.message);
    } else {
      console.log('✅ NOVA LINHA INSERIDA! ID:', novaLinha[0].id);
    }
    
    console.log(`✅ Fase final: ${novaFase}`);
    
    // 🕐 CANCELAR TIMER se conversa encerrou ou finalizou
    if (novaFase === 'finalizado' || novaFase === 'encerrado') {
      cancelarTimeout(numeroCliente);
    }
    
    console.log('='.repeat(80) + '\n');
    
    return respostaTexto;
    
  } catch (error) {
    console.error('❌ Erro:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Mensagem:', error.message);
    return 'Desculpe, tive um problema. Pode tentar novamente? 🙏';
  }
}
