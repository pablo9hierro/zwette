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
  detectarSatisfacao,
  detectarEncerramentoExplicito,
  processarEncerramento,
  querVerMaisOpcoes,
  clienteIndeciso
} from './bloco4-encerramento.js';
import { salvarListaEnumerada } from './lista-enumerada.js';

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
    // ETAPA 3: VERIFICAR INATIVIDADE
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
    // ETAPA 4: VERIFICAR ENCERRAMENTO EXPLÍCITO
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
    // ETAPA 5: DETECTAR SATISFAÇÃO (PÓS-BUSCA)
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
    // ETAPA 6: ROTEAMENTO POR FASE
    // ===================================================================
    
    let resultado;
    
    switch (contexto.faseAtual) {
      case 'identificacao':
        console.log('🆔 Processando Bloco 1: Identificação');
        
        // Se é primeira mensagem, enviar apresentação
        if (!contexto.nomeCliente && eSaudacaoInicial(mensagemUsuario)) {
          resultado = {
            mensagem: gerarMensagemApresentacao(),
            contextoAtualizado: contexto,
            proximaFase: 'identificacao'
          };
        } else {
          resultado = await processarBloco1(mensagemUsuario, contexto, numeroUsuario);
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
      
      case 'pos-busca':
        console.log('📦 Processando pós-busca');
        
        // Cliente quer ver mais opções
        if (querVerMaisOpcoes(mensagemUsuario)) {
          resultado = {
            mensagem: 'Claro! O que você gostaria de ver?\n\n' +
                     '• Outros modelos do mesmo produto\n' +
                     '• Outras cores\n' +
                     '• Outro tipo de produto',
            contextoAtualizado: contexto,
            proximaFase: 'filtro'
          };
          resultado.contextoAtualizado.faseAtual = 'filtro';
        } 
        // Cliente indeciso
        else if (clienteIndeciso(mensagemUsuario)) {
          resultado = {
            mensagem: `Sem problema! ${contexto.nomeCliente}, estou aqui para te ajudar.\n\n` +
                     'Posso te mostrar:\n' +
                     '• Outros modelos\n' +
                     '• Outras cores\n' +
                     '• Um produto diferente\n\n' +
                     'O que prefere?',
            contextoAtualizado: contexto,
            proximaFase: 'filtro'
          };
          resultado.contextoAtualizado.faseAtual = 'filtro';
        }
        // Detectar satisfação
        else if (detectarSatisfacao(mensagemUsuario)) {
          resultado = await processarEncerramento(
            mensagemUsuario,
            contexto,
            numeroUsuario,
            'satisfacao'
          );
        }
        // Fallback: perguntar se quer ver mais
        else {
          resultado = {
            mensagem: 'Gostou de algum desses produtos? 😊\n\n' +
                     'Posso:\n' +
                     '• Buscar mais opções\n' +
                     '• Te ajudar com outro produto\n' +
                     '• Ou se já encontrou o que queria, é só me avisar!',
            contextoAtualizado: contexto,
            proximaFase: 'pos-busca'
          };
        }
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
        console.log('⚠️ Fase desconhecida, reiniciando');
        contexto = inicializarContextoAvancado();
        resultado = {
          mensagem: gerarMensagemApresentacao(),
          contextoAtualizado: contexto,
          proximaFase: 'identificacao'
        };
    }
    
    // ===================================================================
    // ETAPA 7: SALVAR CONTEXTO ATUALIZADO
    // ===================================================================
    await salvarContexto(numeroUsuario, resultado.contextoAtualizado);
    
    // Atualizar última interação
    await atualizarUltimaInteracao(numeroUsuario);
    
    console.log('✅ Resposta gerada com sucesso!');
    console.log('📤 Mensagem:', resultado.mensagem.substring(0, 100) + '...');
    
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
    // Buscar conversa ativa
    const { data: conversaExistente, error: erroExistente } = await supabase
      .from('conversations')
      .select('*')
      .eq('numero_usuario', numeroUsuario)
      .eq('ativa', true)
      .single();
    
    if (conversaExistente) {
      return conversaExistente;
    }
    
    // Criar nova conversa
    const { data: novaConversa, error: erroCriar } = await supabase
      .from('conversations')
      .insert({
        numero_usuario: numeroUsuario,
        ativa: true,
        fase_atendimento: 'identificacao',
        contexto: serializarContexto(inicializarContextoAvancado()),
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
      .from('conversations')
      .update({
        contexto: contexto, // Supabase aceita objeto JSON diretamente
        fase_atendimento: contexto.faseAtual,
        nome_cliente: contexto.nomeCliente,
        profissao: contexto.profissao,
        atendimento_encerrado: contexto.atendimentoEncerrado || false,
        updated_at: new Date().toISOString()
      })
      .eq('numero_usuario', numeroUsuario)
      .eq('ativa', true);
    
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
      .from('conversations')
      .update({
        data_ultima_interacao: new Date().toISOString()
      })
      .eq('numero_usuario', numeroUsuario)
      .eq('ativa', true);
  } catch (erro) {
    console.error('Erro ao atualizar última interação:', erro);
  }
}

/**
 * Exportar para uso externo
 */
export default processarAtendimentoJana;
