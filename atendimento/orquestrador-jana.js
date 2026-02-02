/**
 * =====================================================
 * ORQUESTRADOR JANA - SISTEMA DE 4 BLOCOS
 * Integração completa do atendimento humanizado
 * =====================================================
 */

import { supabase } from '../db/supabase.js';
import { 
  inicializarContextoAvancado, 
  atualizarContextoAvancado,
  desserializarContexto,
  serializarContexto,
  gerarResumoContexto,
  verificarInatividade
} from './contexto-avancado.js';
import { 
  processarBloco1,
  eSaudacaoInicial,
  gerarMensagemApresentacao
} from './bloco1-identificacao.js';
import {
  processarBloco2
} from './bloco2-filtro.js';
import {
  processarConfirmacaoBusca
} from './bloco3-magazord.js';
import {
  processarPosBusca
} from './bloco4-pos-busca.js';
import {
  detectarSatisfacao,
  detectarEncerramentoExplicito,
  processarEncerramento,
  querVerMaisOpcoes,
  clienteIndeciso
} from './bloco4-encerramento.js';
import { salvarListaEnumerada } from './lista-enumerada.js';

/**
 * Detecta se a mensagem é a palavra-chave inicial "simitarra"
 */
function ePalavraChaveInicial(mensagem) {
  const mensagemLimpa = mensagem.toLowerCase().trim();
  return mensagemLimpa === 'simitarra' || mensagemLimpa.includes('simitarra');
}

/**
 * Orquestrador Principal do Atendimento Jana
 */
export async function processarAtendimentoJana(mensagemUsuario, numeroUsuario) {
  try {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║         🤖 JANA - ATENDIMENTO HUMANIZADO          ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('📥 Mensagem:', mensagemUsuario);
    console.log('👤 Usuário:', numeroUsuario);
    
    // ===================================================================
    // ETAPA 1: RECUPERAR OU CRIAR CONVERSA
    // ===================================================================
    const conversa = await buscarOuCriarConversa(numeroUsuario);
    
    if (!conversa) {
      return 'Desculpe, houve um erro ao processar seu atendimento. Tente novamente.';
    }
    
    // ===================================================================
    // ETAPA 2: RECUPERAR CONTEXTO
    // ===================================================================
    let contexto = desserializarContexto(conversa.contexto);
    
    // Se não tem contexto, inicializar
    if (!contexto || !contexto.faseAtual) {
      contexto = inicializarContextoAvancado();
    }
    
    console.log('📋 Contexto atual:', gerarResumoContexto(contexto));
    console.log('📍 Fase:', contexto.faseAtual);
    
    // ===================================================================
    // ETAPA 3: DETECTAR PALAVRA-CHAVE INICIAL "SIMITARRA"
    // ===================================================================
    if (ePalavraChaveInicial(mensagemUsuario)) {
      console.log('🔑 Palavra-chave "simitarra" detectada - Iniciando atendimento');
      
      // Resetar contexto para iniciar novo atendimento
      contexto = inicializarContextoAvancado();
      
      // 📨 MENSAGEM 1: Apresentação da Jana
      const mensagemApresentacao = '👋 Olá! Meu nome é *Jana*, sou assistente virtual da *Dana Jalecos*! 🩺\n\n' +
                                  'Estou aqui para te ajudar a encontrar o produto perfeito para você! ✨';
      
      // 📨 MENSAGEM 2: Pergunta do nome
      const mensagemNome = 'Para te atender melhor e personalizar suas recomendações, me diga:\n\n' +
                          '*Como posso te chamar?* 😊';
      
      contexto.aguardandoResposta = 'nome';
      contexto.faseAtual = 'identificacao';
      
      await salvarContexto(numeroUsuario, contexto);
      
      // Retornar ARRAY com 2 mensagens para envio sequencial
      return [mensagemApresentacao, mensagemNome];
    }
    
    // ===================================================================
    // ETAPA 3.1: VERIFICAR SE ATENDIMENTO FOI INICIADO
    // Permite se: tem nome OU está aguardando nome (após "simitarra") OU disse "simitarra" agora
    // ===================================================================
    if (!contexto.nomeCliente && contexto.aguardandoResposta !== 'nome' && !ePalavraChaveInicial(mensagemUsuario)) {
      console.log('⚠️ Atendimento não iniciado - aguardando palavra-chave "simitarra"');
      return null; // Não responde nada
    }
    
    // ===================================================================
    // ETAPA 4: VERIFICAR INATIVIDADE
    // ===================================================================
    if (verificarInatividade(contexto)) {
      console.log('⏰ Cliente inativo há mais de 12 horas');
      const resultado = await processarEncerramento(
        mensagemUsuario,
        contexto,
        numeroUsuario,
        'inatividade'
      );
      
      await salvarContexto(numeroUsuario, resultado.contextoAtualizado);
      return resultado.mensagem;
    }
    
    // ===================================================================
    // ETAPA 5: VERIFICAR ENCERRAMENTO EXPLÍCITO
    // ===================================================================
    if (detectarEncerramentoExplicito(mensagemUsuario)) {
      console.log('🔚 Cliente solicitou encerramento');
      const resultado = await processarEncerramento(
        mensagemUsuario,
        contexto,
        numeroUsuario,
        'explicito'
      );
      
      await salvarContexto(numeroUsuario, resultado.contextoAtualizado);
      return resultado.mensagem;
    }
    
    // ===================================================================
    // ETAPA 6: DETECTAR SATISFAÇÃO (PÓS-BUSCA)
    // ===================================================================
    if (contexto.buscaRealizada && detectarSatisfacao(mensagemUsuario)) {
      console.log('😊 Cliente satisfeito');
      const resultado = await processarEncerramento(
        mensagemUsuario,
        contexto,
        numeroUsuario,
        'satisfacao'
      );
      
      await salvarContexto(numeroUsuario, resultado.contextoAtualizado);
      return resultado.mensagem;
    }
    
    // ===================================================================
    // ETAPA 6.5: DETECÇÃO UNIVERSAL DE PRODUTO (TODAS AS FASES)
    // Se cliente menciona produto em qualquer fase, redirecionar para busca
    // ===================================================================
    if (!contexto.aguardandoCEP && contexto.faseAtual !== 'filtro' && contexto.faseAtual !== 'confirmacao') {
      const { detectarTipoProduto, detectarGenero, detectarCor } = await import('./bloco2-filtro.js');
      const tipoProdutoDetectado = detectarTipoProduto(mensagemUsuario);
      
      if (tipoProdutoDetectado) {
        console.log('🎯 DETECÇÃO UNIVERSAL: Produto mencionado fora do fluxo de busca');
        console.log('   Produto:', tipoProdutoDetectado);
        console.log('   🔀 Redirecionando para bloco de filtro...');
        
        // Detectar também gênero e cor se mencionados
        const generoDetectado = detectarGenero(mensagemUsuario);
        
        // Atualizar contexto para busca
        contexto.tipoProduto = tipoProdutoDetectado;
        contexto.genero = generoDetectado;
        contexto.cor = null;
        contexto.faseAtual = 'filtro';
        contexto.aguardandoResposta = generoDetectado ? 'cor' : 'genero';
        contexto.caracteristicasMencionadas = ['tipo'];
        if (generoDetectado) contexto.caracteristicasMencionadas.push('genero');
        
        // Processar com bloco 2
        resultado = await processarBloco2(mensagemUsuario, contexto, numeroUsuario);
        
        // Salvar lista enumerada se foi criada
        if (resultado.listaEnumerada) {
          const listaSalva = await salvarListaEnumerada(
            numeroUsuario,
            conversa.id,
            resultado.listaEnumerada.tipo_lista,
            resultado.listaEnumerada.itens.map(i => i.valor),
            resultado.listaEnumerada.referente_a
          );
          
          if (listaSalva) {
            resultado.contextoAtualizado.ultimaListaEnumerada = listaSalva;
          }
        }
        
        // Pular o switch - já processamos
        await salvarContexto(numeroUsuario, resultado.contextoAtualizado);
        await atualizarUltimaInteracao(numeroUsuario);
        
        return Array.isArray(resultado.mensagem) ? resultado.mensagem : [resultado.mensagem];
      }
    }
    
    // ===================================================================
    // ETAPA 7: ROTEAMENTO POR FASE
    // ===================================================================
    
    let resultado;
    
    // Normalizar fases/aguardandoResposta não reconhecidas
    // Se aguardandoResposta indica pós-frete/pós-busca, forçar fase 'continuacao'
    if (contexto.aguardandoResposta === 'pos_frete' || 
        contexto.aguardandoResposta === 'continuacao_ou_encerramento' ||
        contexto.aguardandoResposta === 'pos_busca') {
      console.log(`   🔄 Normalizando fase: ${contexto.faseAtual} → continuacao (devido a aguardandoResposta: ${contexto.aguardandoResposta})`);
      contexto.faseAtual = 'continuacao';
    }
    
    switch (contexto.faseAtual) {
      case 'identificacao':
        console.log('🆔 Processando Bloco 1: Identificação');
        
        // Se é cliente novo sem nome, NÃO processar (já foi bloqueado acima)
        // Só processa se já tem nome ou está aguardando resposta
        if (!contexto.nomeCliente && !contexto.aguardandoResposta) {
          console.log('⚠️ Cliente novo sem palavra-chave - bloqueado');
          return null;
        }
        
        // Processar resposta do cliente
        resultado = await processarBloco1(mensagemUsuario, contexto, numeroUsuario);
        
        // Salvar lista enumerada se foi criada
        if (resultado.listaEnumerada) {
          const listaSalva = await salvarListaEnumerada(
            numeroUsuario,
            conversa.id,
            resultado.listaEnumerada.tipo_lista,
            resultado.listaEnumerada.itens.map(i => i.valor),
            resultado.listaEnumerada.referente_a
          );
          
          if (listaSalva) {
            resultado.contextoAtualizado.ultimaListaEnumerada = listaSalva;
          }
        }
        break;
      
      case 'filtro':
        console.log('🔍 Processando Bloco 2: Filtro Dinâmico');
        resultado = await processarBloco2(mensagemUsuario, contexto, numeroUsuario);
        
        // Salvar lista enumerada se foi criada
        if (resultado.listaEnumerada) {
          const listaSalva = await salvarListaEnumerada(
            numeroUsuario,
            conversa.id,
            resultado.listaEnumerada.tipo_lista,
            resultado.listaEnumerada.itens.map(i => i.valor),
            resultado.listaEnumerada.referente_a
          );
          
          if (listaSalva) {
            resultado.contextoAtualizado.ultimaListaEnumerada = listaSalva;
          }
        }
        break;
      
      case 'confirmacao':
        console.log('✅ Processando Bloco 3: Confirmação e Busca');
        resultado = await processarConfirmacaoBusca(mensagemUsuario, contexto, numeroUsuario);
        break;
      
      case 'continuacao':
        console.log('📦 Processando Bloco 4: Pós-Busca (Frete, Nova Busca)');
        
        // Buscar produtos da última busca se necessário
        const produtosEncontrados = contexto.produtosParaFrete || contexto.produtosEncontrados || [];
        
        resultado = await processarPosBusca(mensagemUsuario, contexto, produtosEncontrados);
        
        // ⚠️ REDIRECIONAMENTO: Se detectou menção de produto, redirecionar para filtro
        if (resultado.redirecionarPara === 'filtro') {
          console.log('   🔀 Redirecionando para bloco de filtros...');
          
          try {
            resultado = await processarBloco2(mensagemUsuario, resultado.contextoAtualizado, numeroUsuario);
            
            // Salvar lista enumerada se foi criada
            if (resultado.listaEnumerada) {
              const listaSalva = await salvarListaEnumerada(
                numeroUsuario,
                conversa.id,
                resultado.listaEnumerada.tipo_lista,
                resultado.listaEnumerada.itens.map(i => i.valor),
                resultado.listaEnumerada.referente_a
              );
              
              if (listaSalva) {
                resultado.contextoAtualizado.ultimaListaEnumerada = listaSalva;
              }
            }
          } catch (erroRedirect) {
            console.error('❌ Erro ao redirecionar para filtro:', erroRedirect);
            console.error('   Stack:', erroRedirect.stack);
            
            // Retornar mensagem de erro amigável
            resultado.mensagem = 'Entendi que você quer buscar outro produto! Vou te ajudar com isso. Qual produto você está procurando? 😊';
            resultado.contextoAtualizado.faseAtual = 'filtro';
          }
        }
        break;
      
      case 'pos-busca':
        console.log('📦 Processando pós-busca');
        
        resultado = await processarPosBusca(
          mensagemUsuario,
          contexto,
          contexto.produtosEncontrados || []
        );
        
        // ⚠️ REDIRECIONAMENTO: Se detectou menção de produto, redirecionar para filtro
        if (resultado.redirecionarPara === 'filtro') {
          console.log('   🔀 Redirecionando para bloco de filtros...');
          
          const { processarFiltro } = await import('./bloco2-filtro.js');
          resultado = await processarFiltro(mensagemUsuario, resultado.contextoAtualizado, numeroUsuario);
        }
        
        resultado.contextoAtualizado.faseAtual = resultado.contextoAtualizado.faseAtual || 'continuacao';
        break;
      
      case 'encerramento':
        console.log('🔚 Atendimento já encerrado');
        resultado = {
          mensagem: 'Seu atendimento já foi transferido para um atendente humano. Aguarde o contato! 😊',
          contextoAtualizado: contexto,
          proximaFase: 'encerramento'
        };
        break;
      
      default:
        console.log(`⚠️ Fase/aguardandoResposta não reconhecida: ${contexto.faseAtual} / ${contexto.aguardandoResposta}`);
        console.log('   🔍 Tentando detectar filtros na mensagem...');
        
        // Tentar detectar filtros (produto/gênero/cor)
        const { detectarTipoProduto, detectarGenero } = await import('./bloco2-filtro.js');
        const tipoProdutoDetectado = detectarTipoProduto(mensagemUsuario);
        
        if (tipoProdutoDetectado) {
          console.log('   ✅ Produto detectado:', tipoProdutoDetectado);
          
          // Processar como se fosse continuação e deixar bloco4 redirecionar
          resultado = await processarPosBusca(
            mensagemUsuario,
            contexto,
            contexto.produtosEncontrados || []
          );
          
          // ⚠️ REDIRECIONAMENTO: Se detectou menção de produto, redirecionar para filtro
          if (resultado.redirecionarPara === 'filtro') {
            console.log('   🔀 Redirecionando para bloco de filtros...');
            resultado = await processarBloco2(mensagemUsuario, resultado.contextoAtualizado, numeroUsuario);
          }
        } else {
          // Não detectou nada, mensagem genérica
          console.log('   ⚠️ Nenhum filtro detectado - enviando mensagem padrão');
          resultado = {
            mensagem: 'Desculpa, não entendi. 😅\n\n💬 O que você gostaria de fazer?\n\n1️⃣ Ver mais detalhes de algum produto\n2️⃣ 📦 Calcular frete para o meu CEP\n3️⃣ Buscar outro produto\n4️⃣ Encerrar atendimento',
            contextoAtualizado: contexto,
            proximaFase: 'continuacao'
          };
        }
        break;
    }
    
    // ===================================================================
    // ETAPA 8: SALVAR CONTEXTO ATUALIZADO
    // ===================================================================
    await salvarContexto(numeroUsuario, resultado.contextoAtualizado);
    
    // Atualizar última interação
    await atualizarUltimaInteracao(numeroUsuario);
    
    console.log('✅ Resposta gerada com sucesso!');
    
    // Log de mensagem (compatível com string ou array)
    if (Array.isArray(resultado.mensagem)) {
      console.log(`📤 Mensagem: [ARRAY com ${resultado.mensagem.length} mensagens]`);
    } else {
      console.log('📤 Mensagem:', resultado.mensagem.substring(0, 100) + '...');
    }
    
    return resultado.mensagem;
    
  } catch (erro) {
    console.error('❌ Erro no orquestrador:', erro);
    return 'Desculpe, ocorreu um erro. Nosso time foi notificado. Pode tentar novamente? 😊';
  }
}

/**
 * Busca ou cria conversa no banco
 */
async function buscarOuCriarConversa(numeroUsuario) {
  try {
    // Buscar conversa ativa (não encerrada)
    const { data: conversaExistente, error: erroExistente } = await supabase
      .from('conversas')
      .select('*')
      .eq('numero_cliente', numeroUsuario)
      .eq('atendimento_encerrado', false)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (conversaExistente && !erroExistente) {
      return conversaExistente;
    }
    
    // Criar nova conversa
    const { data: novaConversa, error: erroCriar } = await supabase
      .from('conversas')
      .insert({
        numero_cliente: numeroUsuario,
        mensagem_cliente: 'Iniciando atendimento',
        contexto: serializarContexto(inicializarContextoAvancado()),
        acao: 'conversa',
        fase_atendimento: 'identificacao',
        atendimento_encerrado: false,
        data_ultima_interacao: new Date().toISOString()
      })
      .select()
      .single();
    
    if (erroCriar) {
      console.error('Erro ao criar conversa:', erroCriar);
      return null;
    }
    
    return novaConversa;
  } catch (erro) {
    console.error('Erro ao buscar/criar conversa:', erro);
    return null;
  }
}

/**
 * Salva contexto no banco
 */
async function salvarContexto(numeroUsuario, contexto) {
  try {
    const { error } = await supabase
      .from('conversas')
      .update({
        contexto: contexto, // Supabase aceita objeto JSON diretamente
        fase_atendimento: contexto.faseAtual,
        nome_cliente: contexto.nomeCliente,
        profissao: contexto.profissao,
        atendimento_encerrado: contexto.atendimentoEncerrado || false,
        data_ultima_interacao: new Date().toISOString()
      })
      .eq('numero_cliente', numeroUsuario)
      .eq('atendimento_encerrado', false)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Erro ao salvar contexto:', error);
      return false;
    }
    
    return true;
  } catch (erro) {
    console.error('Erro ao salvar contexto:', erro);
    return false;
  }
}

/**
 * Atualiza timestamp de última interação
 */
async function atualizarUltimaInteracao(numeroUsuario) {
  try {
    await supabase
      .from('conversas')
      .update({
        data_ultima_interacao: new Date().toISOString()
      })
      .eq('numero_cliente', numeroUsuario)
      .eq('atendimento_encerrado', false)
      .order('timestamp', { ascending: false })
      .limit(1);
  } catch (erro) {
    console.error('Erro ao atualizar última interação:', erro);
  }
}

/**
 * Exportar para uso externo
 */
export default processarAtendimentoJana;
