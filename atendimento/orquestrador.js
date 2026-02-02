import 'dotenv/config';
import { entenderMensagem } from '../atendimento/entender_mensagem_IA.js';
import { eRespostaPergunta, eRespostaCaracteristica } from '../atendimento/entender_mensagem.js';
import { buscarProdutosComIA, formatarProdutosIA } from '../atendimento/buscar_produtos_ia.js';
import { 
  inicializarContexto, 
  atualizarContexto, 
  verificarContextoCompleto,
  recuperarContexto,
  registrarPergunta,
  marcarBuscaRealizada,
  gerarResumoContexto
} from '../atendimento/contexto.js';
import { 
  construirPayload, 
  payloadValido, 
  descreverPayload 
} from '../atendimento/payload.js';
import { 
  gerarSugestoes, 
  deveFazerSugestao, 
  gerarMensagemConfirmacao,
  mensagemJaUsada,
  gerarMensagemPorSentimento
} from '../atendimento/pesquisar_catalogo.js';
import { 
  buscarProdutos, 
  formatarResultados,
  gerarMensagemNaoEncontrado
} from '../atendimento/pesquisar.js';
import { buscarHistoricoConversa, salvarMensagemConversa } from '../db/memoria-conversa.js';

/**
 * Orquestrador Principal do Atendimento
 * Integra todos os módulos para processar mensagens do cliente
 */

/**
 * Processa a mensagem do cliente usando arquitetura modular
 * @param {string} mensagemUsuario - Mensagem do cliente
 * @param {string} numeroUsuario - Número WhatsApp do cliente
 * @returns {Promise<string>} Resposta formatada
 */
export async function processarMensagemRecebida(mensagemUsuario, numeroUsuario) {
  try {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  🧠 SISTEMA MODULAR DE ATENDIMENTO          ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('📥 Mensagem:', mensagemUsuario);
    console.log('👤 Usuário:', numeroUsuario);

    // ===================================================================
    // ETAPA 1: RECUPERAR HISTÓRICO E CONTEXTO
    // ===================================================================
    console.log('\n💾 ETAPA 1: Recuperando histórico...');
    const { eNovaConversa, historico, resumo } = await buscarHistoricoConversa(numeroUsuario);
    
    // Recuperar contexto anterior ou inicializar novo
    const contextoAnterior = recuperarContexto(resumo);
    console.log('� Contexto ANTERIOR recuperado:', JSON.stringify(contextoAnterior, null, 2));

    // Extrair mensagens do histórico para verificação
    const historicoMensagensBot = historico
      .filter(h => h.metadados?.tipo === 'bot')
      .map(h => h.conteudo);

    // ===================================================================
    // ETAPA 2: ENTENDER A MENSAGEM DO CLIENTE COM HISTÓRICO
    // ===================================================================
    console.log('\n🤖 ETAPA 2: Analisando mensagem com histórico...');
    
    // Formatar histórico para a IA
    const historicoFormatado = historico.slice(-8).map(h => ({
      role: h.metadados?.tipo === 'bot' ? 'bot' : 'cliente',
      mensagem: h.conteudo
    }));
    
    const analise = await entenderMensagem(mensagemUsuario, contextoAnterior, historicoFormatado);
    console.log('📊 Análise:', JSON.stringify(analise, null, 2));

    // 🔥 CRÍTICO: Verificar se BOT já enviou essa mensagem recentemente
    function jaMandouEssaMensagem(mensagem, historico) {
      const ultimasMensagensBot = historico.slice(-3).filter(h => h.metadados?.tipo === 'bot').map(h => h.conteudo);
      return ultimasMensagensBot.includes(mensagem);
    }

    // ===================================================================
    // ETAPA 3: ATUALIZAR CONTEXTO COM DADOS EXTRAÍDOS PELA IA
    // ===================================================================
    console.log('\n🔄 ETAPA 3: Atualizando contexto com dados da IA...');
    console.log('   Contexto ANTES:', JSON.stringify(contextoAnterior));
    console.log('   Dados extraídos pela IA:', JSON.stringify(analise.dadosExtraidos));
    
    let contextoAtualizado, mudancasDetectadas, caracteristicasNovas;
    
    // CRÍTICO: Se detectou mudança de TIPO, NÃO atualizar ainda - só após confirmação
    if (analise.mudancaDeTipo && !contextoAnterior.aguardandoConfirmacaoMudancaTipo) {
      console.log('⚠️ Mudança de tipo detectada, aguardando confirmação do cliente...');
      contextoAtualizado = contextoAnterior;
      mudancasDetectadas = [];
      caracteristicasNovas = [];
    } else {
      // CRÍTICO: Se cliente quer MUDAR característica, LIMPAR esse campo
      let contextoParaAtualizar = { ...contextoAnterior };
      if (analise.mudancaDetectada && analise.caracteristicaParaMudar) {
        console.log(`🔄 Cliente quer MUDAR ${analise.caracteristicaParaMudar}`);
        contextoParaAtualizar[analise.caracteristicaParaMudar] = null;
        contextoParaAtualizar.buscaRealizada = false;
        contextoParaAtualizar.aguardandoConfirmacao = false;
      }
      
      // 🔥 NOVO: Atualizar contexto com TODOS os dados extraídos pela IA
      const resultado = atualizarContexto(contextoParaAtualizar, analise.dadosExtraidos);
      contextoAtualizado = resultado.contextoAtualizado;
      mudancasDetectadas = resultado.mudancasDetectadas;
      caracteristicasNovas = resultado.caracteristicasNovas;

      console.log('   Contexto DEPOIS:', JSON.stringify(contextoAtualizado));
      console.log('   🔥 IA preencheu:', Object.keys(analise.dadosExtraidos).filter(k => analise.dadosExtraidos[k]).join(', '));
    }
    
    if (mudancasDetectadas.length > 0) {
      console.log('🔁 Mudanças detectadas:', mudancasDetectadas);
    }
    if (caracteristicasNovas.length > 0) {
      console.log('✨ Novas características:', caracteristicasNovas);
    }

    console.log('📝 Contexto atualizado:', gerarResumoContexto(contextoAtualizado));

    // ===================================================================
    // ETAPA 4: DECIDIR AÇÃO COM BASE NA INTENÇÃO
    // ===================================================================
    console.log('\n🎯 ETAPA 4: Decidindo ação...');
    console.log('   - Intenção:', analise.intencao);
    console.log('   - Tipo mensagem:', analise.tipoMensagem);
    console.log('   - Match catálogo:', analise.temMatchCatalogo);
    
    let respostaFinal = '';
    let contextoFinal = contextoAtualizado;

    // Verificar informações do contexto
    const { 
      temInfoSuficiente, 
      quantidadeCaracteristicas, 
      prontoParaBuscaRobusta 
    } = verificarContextoCompleto(contextoAtualizado);
    
    console.log(`   - Características coletadas: ${quantidadeCaracteristicas}`);
    console.log(`   - Pronto para busca robusta: ${prontoParaBuscaRobusta}`);

    // Verificar se cliente está frustrado
    if (analise.sentimento === 'frustrado') {
      const mensagemEmpática = gerarMensagemPorSentimento(analise.sentimento, contextoAtualizado);
      if (mensagemEmpática && analise.intencao === 'confirmar_busca') {
        // Cliente frustrado confirmando busca - fazer busca imediatamente
        console.log('😤 Cliente frustrado, buscando imediatamente...');
        const payload = construirPayload(contextoAtualizado);
        const produtos = await buscarProdutos(payload);
        respostaFinal = formatarResultados(produtos);
        contextoFinal = marcarBuscaRealizada(contextoAtualizado);
      } else if (mensagemEmpática) {
        respostaFinal = mensagemEmpática;
      }
    }

    // Se ainda não temos resposta, processar normalmente
    if (!respostaFinal) {
      
      // ===== FLUXO 0A: CLIENTE MUDOU TIPO DE PRODUTO (jaleco → gorro) =====
      if (analise.mudancaDeTipo && !contextoAtualizado.aguardandoConfirmacaoMudancaTipo) {
        console.log(`🔄 Cliente quer mudar de "${contextoAtualizado.tipo}" para "${analise.dadosExtraidos.tipo}"`);
        const tipoAtual = contextoAtualizado.tipo;
        const tipoNovo = analise.dadosExtraidos.tipo;
        respostaFinal = `Entendi! Então você não quer mais ${tipoAtual} e agora quer ${tipoNovo}? Posso te ajudar a buscar ${tipoNovo}s?`;
        // Marcar que estamos aguardando confirmação de mudança de tipo
        contextoFinal = {
          ...contextoAtualizado,
          aguardandoConfirmacaoMudancaTipo: true,
          tipoNovoPendente: tipoNovo
        };
      }
      // ===== FLUXO 0B: CLIENTE CONFIRMOU MUDANÇA DE TIPO =====
      else if (contextoAtualizado.aguardandoConfirmacaoMudancaTipo && 
               (analise.intencao === 'confirmar_busca' || eRespostaPergunta(mensagemUsuario, contextoAtualizado.ultimaPergunta))) {
        console.log(`✅ Cliente CONFIRMOU mudança de tipo para "${contextoAtualizado.tipoNovoPendente}"`);
        // Resetar contexto mantendo genero e cor se compatíveis
        const contextoNovo = inicializarContexto();
        contextoNovo.tipo = contextoAtualizado.tipoNovoPendente;
        if (contextoAtualizado.genero) contextoNovo.genero = contextoAtualizado.genero;
        if (contextoAtualizado.cor) contextoNovo.cor = contextoAtualizado.cor;
        contextoNovo.caracteristicasMencionadas = ['tipo'];
        if (contextoAtualizado.genero) contextoNovo.caracteristicasMencionadas.push('genero');
        if (contextoAtualizado.cor) contextoNovo.caracteristicasMencionadas.push('cor');
        
        // Perguntar se quer buscar com essas características
        const sugestao = gerarSugestoes(contextoNovo);
        respostaFinal = sugestao.mensagem;
        contextoFinal = registrarPergunta(contextoNovo, sugestao.mensagem);
      }
      // ===== FLUXO 0C: CLIENTE NEGOU MUDANÇA DE TIPO =====
      else if (contextoAtualizado.aguardandoConfirmacaoMudancaTipo && analise.intencao === 'negar_busca') {
        console.log(`❌ Cliente NEGOU mudança de tipo`);
        // Perguntar se quer manter o anterior e buscar
        const tipoAtual = contextoAtualizado.tipo;
        const descricao = gerarResumoContexto(contextoAtualizado);
        respostaFinal = `Ok! Então você quer manter ${descricao}? Posso buscar isso pra você?`;
        contextoFinal = {
          ...contextoAtualizado,
          aguardandoConfirmacaoMudancaTipo: false,
          tipoNovoPendente: null,
          aguardandoConfirmacao: true, // Aguardando confirmação para buscar com contexto atual
          ultimaPergunta: respostaFinal
        };
      }
      // ===== FLUXO 0E: CLIENTE CONFIRMOU MANTER CONTEXTO APÓS NEGAR MUDANÇA =====
      else if (contextoAtualizado.aguardandoConfirmacao && 
               (analise.intencao === 'confirmar_busca' || eRespostaPergunta(mensagemUsuario, contextoAtualizado.ultimaPergunta))) {
        console.log(`✅ Cliente CONFIRMOU manter contexto atual`);
        // Se ainda faltam características, perguntar
        if (!prontoParaBuscaRobusta) {
          console.log(`📋 Faltam características, coletando mais...`);
          const sugestao = gerarSugestoes(contextoAtualizado);
          respostaFinal = sugestao.mensagem;
          contextoFinal = registrarPergunta(contextoAtualizado, sugestao.mensagem);
        } else {
          // Pronto para buscar
          const payload = construirPayload(contextoAtualizado);
          const produtos = await buscarProdutos(payload);
          if (!produtos || produtos.length === 0) {
            respostaFinal = gerarMensagemNaoEncontrado(contextoAtualizado);
          } else {
            respostaFinal = formatarResultados(produtos);
          }
          contextoFinal = marcarBuscaRealizada(contextoAtualizado);
        }
      }
      // ===== FLUXO 0D: CLIENTE QUER MUDAR CARACTERÍSTICA =====
      else if (analise.mudancaDetectada && analise.caracteristicaParaMudar) {
        console.log(`🔄 Processando mudança de ${analise.caracteristicaParaMudar}...`);
        // Perguntar a nova preferência usando pesquisar_catalogo
        const sugestao = gerarSugestoes(contextoAtualizado);
        respostaFinal = sugestao.mensagem;
        contextoFinal = registrarPergunta(contextoAtualizado, sugestao.mensagem);
      }
      
      // ===== FLUXO 1: CLIENTE PERGUNTANDO SOBRE PRODUTOS =====
      else if (analise.intencao === 'perguntar_disponibilidade' || 
               analise.intencao === 'responder' && contextoAtualizado.tipo && quantidadeCaracteristicas === 1 ||
               mensagemUsuario.toLowerCase().match(/tem (qual|quais|o que)|quais produtos|tem (gorro|dolma|jaleco|scrub)/)) {
        console.log('❓ Cliente perguntando sobre produtos disponíveis...');
        
        // Se já extraiu o tipo (gorro, dolma, etc), responder especificamente
        if (contextoAtualizado.tipo) {
          const tipo = contextoAtualizado.tipo.toLowerCase();
          if (['jaleco', 'scrub', 'gorro', 'robe', 'macacao'].includes(tipo)) {
            respostaFinal = `Sim! Temos ${contextoAtualizado.tipo}s! 😊\n\nVocê quer masculino ou feminino? Ou tem alguma cor preferida?`;
          } else if (tipo === 'dolma' || tipo === 'dolmã') {
            respostaFinal = 'Dolmã é como avental de chef! Sim, temos vários modelos! Quer ver opções masculinas ou femininas?';
          } else {
            respostaFinal = `Deixa eu ver o que temos de ${contextoAtualizado.tipo}... Pode me dar mais detalhes? Masculino ou feminino?`;
          }
        } else {
          respostaFinal = 'Temos jalecos, scrubs, gorros, robes, macacões, aventais e uniformes! 😊\n\nQual desses produtos te interessa?';
        }
      }
      // ===== FLUXO 2: SEM MATCH COM CATÁLOGO - SONDAGEM =====
      else if (!analise.temMatchCatalogo && !temInfoSuficiente && !contextoAnterior.tipo) {
        console.log('❓ Sem match com catálogo, fazendo sondagem...');
        const msgSondagem = 'Estou aqui para ajudar! Você está procurando jalecos, scrubs, aventais ou outro produto?';
        // 🔥 NÃO REPETIR!
        if (jaMandouEssaMensagem(msgSondagem, historico)) {
          respostaFinal = 'Percebo que você está buscando algo. Pode me dizer o tipo de produto que procura? (jaleco, scrub, gorro, etc)';
        } else {
          respostaFinal = msgSondagem;
        }
      }
      
      // ===== FLUXO 3: TEM MATCH MAS POUCAS CARACTERÍSTICAS - PESQUISAR_CATALOGO =====
      else if (temInfoSuficiente && !prontoParaBuscaRobusta && !contextoAtualizado.buscaRealizada) {
        console.log(`📋 Tem ${quantidadeCaracteristicas} características, coletando mais via pesquisar_catalogo...`);
        
        // Usar pesquisar_catalogo para sugestões e coletar mais informações
        const sugestao = gerarSugestoes(contextoAtualizado);
        
        // Verificar se já perguntamos isso
        if (mensagemJaUsada(sugestao.mensagem, historicoMensagensBot)) {
          console.log('⚠️ Mensagem já usada, avançando...');
          // Já perguntou, cliente deve ter respondido - atualizar e continuar
        } else {
          respostaFinal = sugestao.mensagem;
          contextoFinal = registrarPergunta(contextoAtualizado, sugestao.mensagem);
        }
      }
      
      // ===== FLUXO 4: PRONTO PARA BUSCA ROBUSTA (3-4 CARACTERÍSTICAS) - MAS SÓ BUSCA APÓS CONFIRMAÇÃO =====
      else if (prontoParaBuscaRobusta) {
        
        // Se cliente está CONFIRMANDO característica atual (repetindo), resetar busca e perguntar de novo
        if (analise.confirmandoCaracteristica && contextoAtualizado.buscaRealizada) {
          console.log('🔁 Cliente CONFIRMOU característica atual, vai buscar novamente');
          const confirmacao = gerarMensagemConfirmacao(contextoAtualizado);
          respostaFinal = confirmacao;
          contextoFinal = {
            ...contextoAtualizado,
            buscaRealizada: false, // Resetar para permitir nova busca
            ultimaPergunta: confirmacao,
            aguardandoConfirmacao: true
          };
        }
        // Se já buscou e NENHUMA mudança/confirmação
        else if (contextoAtualizado.buscaRealizada && !mudancasDetectadas.length && !caracteristicasNovas.length && !analise.confirmandoCaracteristica) {
          console.log('⚠️ Busca já realizada, sem mudanças');
          const descricao = gerarResumoContexto(contextoAtualizado);
          respostaFinal = `Já mostrei ${descricao}. Quer mudar alguma coisa? Qual preferência quer alterar: cor, manga ou tamanho?`;
        }
        // Cliente confirmou EXPLICITAMENTE com "sim", "pode", etc - FAZER BUSCA COM IA
        else if (eRespostaPergunta(mensagemUsuario, contextoAtualizado.ultimaPergunta) || analise.confirmacaoBusca) {
          console.log('🤖 Cliente confirmou, fazendo busca INTELIGENTE com IA...');
          
          // Formatar histórico para passar pra IA
          const historicoFormatado = historico.slice(-8).map(h => ({
            role: h.metadados?.tipo === 'bot' ? 'bot' : 'cliente',
            mensagem: h.conteudo
          }));
          
          const resultadoBusca = await buscarProdutosComIA(contextoAtualizado, historicoFormatado);
          
          if (!resultadoBusca.sucesso || !resultadoBusca.produtos?.length) {
            respostaFinal = resultadoBusca.mensagemIA || gerarMensagemNaoEncontrado(contextoAtualizado);
          } else {
            respostaFinal = formatarProdutosIA(resultadoBusca);
          }
          
          contextoFinal = marcarBuscaRealizada(contextoAtualizado);
        }
        // Cliente respondeu característica (cor, tamanho) - COLETAR e PEDIR CONFIRMAÇÃO
        else if (eRespostaCaracteristica(mensagemUsuario, contextoAtualizado.ultimaPergunta)) {
          console.log('📝 Cliente respondeu característica, coletando e pedindo confirmação...');
          const confirmacao = gerarMensagemConfirmacao(contextoAtualizado);
          respostaFinal = confirmacao;
          contextoFinal = registrarPergunta(contextoAtualizado, confirmacao);
        }
        // PRIMEIRA VEZ chegando em 3+ características - PEDIR CONFIRMAÇÃO
        else {
          console.log('🤔 Pronto para buscar pela primeira vez, PEDINDO confirmação...');
          const confirmacao = gerarMensagemConfirmacao(contextoAtualizado);
          respostaFinal = confirmacao;
          contextoFinal = registrarPergunta(contextoAtualizado, confirmacao);
        }
      }
      
      // ===== FLUXO 5: CASOS ESPECIAIS =====
      else {
        switch (analise.intencao) {
          case 'saudacao':
            respostaFinal = 'Olá! Como posso te ajudar hoje? 😊';
            break;

          case 'negar_busca':
            respostaFinal = 'Sem problemas! Quer ver outras opções ou mudar alguma preferência?';
            break;

          case 'perguntar':
            // Cliente fazendo pergunta
            // Se já buscou e está perguntando de novo, explicar que não tem
            if (contextoAtualizado.buscaRealizada && analise.temMatchCatalogo) {
              const descricaoBuscada = gerarResumoContexto(contextoAtualizado);
              respostaFinal = `Infelizmente não temos ${descricaoBuscada} disponível no momento. 😔\n\nMas posso te mostrar outras opções! Quer mudar:\n• Cor?\n• Manga?\n• Ver outro modelo?`;
            } else {
              // Pergunta normal - dar informações via pesquisar_catalogo
              const sugestaoPergunta = gerarSugestoes(contextoAtualizado);
              respostaFinal = sugestaoPergunta.mensagem;
              contextoFinal = registrarPergunta(contextoAtualizado, sugestaoPergunta.mensagem);
            }
            break;

          case 'responder':
            // Cliente respondendo - agradecer e coletar mais ou buscar
            if (prontoParaBuscaRobusta) {
              const confirmacao = gerarMensagemConfirmacao(contextoAtualizado);
              respostaFinal = confirmacao;
              contextoFinal = registrarPergunta(contextoAtualizado, confirmacao);
            } else {
              const sugestaoResposta = gerarSugestoes(contextoAtualizado);
              respostaFinal = sugestaoResposta.mensagem;
              contextoFinal = registrarPergunta(contextoAtualizado, sugestaoResposta.mensagem);
            }
            break;

          default:
            // Intenção não reconhecida
            if (temInfoSuficiente) {
              const sugestaoDefault = gerarSugestoes(contextoAtualizado);
              respostaFinal = sugestaoDefault.mensagem;
              contextoFinal = registrarPergunta(contextoAtualizado, sugestaoDefault.mensagem);
            } else {
              respostaFinal = 'Desculpe, não entendi bem. Você está procurando algum produto específico?';
            }
        }
      }
    }

    // ===================================================================
    // ETAPA 5: SALVAR NO BANCO E RETORNAR
    // ===================================================================
    console.log('\n💾 ETAPA 5: Salvando no banco...');
    await salvarMensagemConversa(
      numeroUsuario,
      mensagemUsuario,
      respostaFinal,
      contextoFinal
    );

    console.log('✅ Resposta:', respostaFinal.substring(0, 100) + '...');
    return respostaFinal;

  } catch (erro) {
    console.error('❌ Erro no processamento:', erro);
    return 'Desculpe, ocorreu um erro. Pode tentar novamente?';
  }
}
