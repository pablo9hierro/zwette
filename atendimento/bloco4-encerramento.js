/**
 * =====================================================
 * BLOCO 4: ENCERRAMENTO DE ATENDIMENTO
 * Detecta satisfação, encerra e transfere para humano
 * =====================================================
 */

import { supabase } from '../db/supabase.js';
import { verificarInatividade } from './contexto-avancado.js';

/**
 * Detecta se cliente está satisfeito e quer encerrar
 */
export function detectarSatisfacao(mensagem) {
  const palavrasSatisfacao = [
    'obrigado',
    'obrigada',
    'valeu',
    'perfeito',
    'ótimo',
    'otimo',
    'excelente',
    'adorei',
    'amei',
    'consegui',
    'ajudou',
    'resolveu',
    'ficou ótimo',
    'ficou otimo',
    'ficou perfeito',
    'é isso',
    'é esse',
    'esse mesmo',
    'vou comprar',
    'vou levar',
    'quero esse',
    'me decidi'
  ];
  
  const mensagemLower = mensagem.toLowerCase();
  return palavrasSatisfacao.some(p => mensagemLower.includes(p));
}

/**
 * Detecta se cliente quer encerrar explicitamente
 */
export function detectarEncerramentoExplicito(mensagem) {
  const palavrasEncerramento = [
    'encerrar',
    'finalizar',
    'tchau',
    'até logo',
    'ate logo',
    'pode encerrar',
    'já era',
    'ja era',
    'é só isso',
    'só isso',
    'so isso',
    'finalizou'
  ];
  
  const mensagemLower = mensagem.toLowerCase();
  return palavrasEncerramento.some(p => mensagemLower.includes(p));
}

/**
 * Gera mensagem de encerramento com satisfação
 */
export function gerarMensagemEncerramentoSatisfeito(nomeCliente) {
  return `Que ótimo que você gostou, *${nomeCliente}*! 😊✨

Nossa conversa vai ser transferida para um *atendente humano* que vai te ajudar a finalizar a compra e tirar qualquer dúvida adicional!

Foi um prazer te atender! 🎉`;
}

/**
 * Gera mensagem de encerramento explícito
 */
export function gerarMensagemEncerramentoExplicito(nomeCliente) {
  return `Entendido, *${nomeCliente}*! 👍

Vou transferir nossa conversa para um *atendente humano* que pode te ajudar melhor com o que você precisa.

Obrigada pela conversa! 😊`;
}

/**
 * Gera mensagem de encerramento por inatividade
 */
export function gerarMensagemEncerramentoInatividade(nomeCliente) {
  return `Oi *${nomeCliente}*! 👋

Vi que você ficou um tempo sem responder. Não tem problema!

Vou transferir nossa conversa para um *atendente humano* que pode continuar te ajudando quando você retornar. 😊

Até logo!`;
}

/**
 * Salva encerramento no banco de dados
 */
export async function salvarEncerramento(numeroUsuario, motivo, contexto) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        fase_atendimento: 'encerramento',
        atendimento_encerrado: true,
        transferido_humano: true,
        resumo: gerarResumoFinal(contexto),
        updated_at: new Date().toISOString()
      })
      .eq('numero_usuario', numeroUsuario)
      .eq('ativa', true)
      .select();
    
    if (error) {
      console.error('Erro ao salvar encerramento:', error);
      return false;
    }
    
    console.log(`✅ Atendimento encerrado: ${motivo}`);
    return true;
  } catch (erro) {
    console.error('Erro ao salvar encerramento:', erro);
    return false;
  }
}

/**
 * Gera resumo final da conversa
 */
function gerarResumoFinal(contexto) {
  const partes = [];
  
  partes.push(`ATENDIMENTO ENCERRADO`);
  
  if (contexto.nomeCliente) {
    partes.push(`Cliente: ${contexto.nomeCliente}`);
  }
  
  if (contexto.profissao) {
    partes.push(`Profissão: ${contexto.profissao}`);
  }
  
  if (contexto.tipoProduto) {
    partes.push(`Interesse: ${contexto.tipoProduto}`);
    
    if (contexto.modelo) {
      partes.push(`Modelo: ${contexto.modelo}`);
    }
    
    if (contexto.cor) {
      partes.push(`Cor: ${contexto.cor}`);
    }
  }
  
  if (contexto.totalBuscas > 0) {
    partes.push(`Total de buscas: ${contexto.totalBuscas}`);
  }
  
  if (contexto.produtosPesquisados && contexto.produtosPesquisados.length > 0) {
    partes.push(`Produtos visualizados: ${contexto.produtosPesquisados.length}`);
  }
  
  return partes.join(' | ');
}

/**
 * Processa encerramento
 */
export async function processarEncerramento(mensagem, contexto, numeroUsuario, motivo = 'explicito') {
  const resultado = {
    mensagem: '',
    contextoAtualizado: { ...contexto },
    encerrado: true,
    motivoEncerramento: motivo
  };
  
  resultado.contextoAtualizado.atendimentoEncerrado = true;
  resultado.contextoAtualizado.faseAtual = 'encerramento';
  
  // Determinar mensagem baseada no motivo
  switch (motivo) {
    case 'satisfacao':
      resultado.mensagem = gerarMensagemEncerramentoSatisfeito(
        contexto.nomeCliente || 'amigo(a)'
      );
      break;
    
    case 'explicito':
      resultado.mensagem = gerarMensagemEncerramentoExplicito(
        contexto.nomeCliente || 'amigo(a)'
      );
      break;
    
    case 'inatividade':
      resultado.mensagem = gerarMensagemEncerramentoInatividade(
        contexto.nomeCliente || 'amigo(a)'
      );
      break;
    
    default:
      resultado.mensagem = gerarMensagemEncerramentoExplicito(
        contexto.nomeCliente || 'amigo(a)'
      );
  }
  
  // Salvar no banco
  await salvarEncerramento(numeroUsuario, motivo, contexto);
  
  return resultado;
}

/**
 * Verifica se deve encerrar por inatividade (12 horas)
 */
export async function verificarEncerramentoPorInatividade() {
  try {
    const { data, error } = await supabase
      .rpc('verificar_inatividade_atendimento');
    
    if (error) {
      console.error('Erro ao verificar inatividade:', error);
      return [];
    }
    
    return data || [];
  } catch (erro) {
    console.error('Erro ao verificar inatividade:', erro);
    return [];
  }
}

/**
 * Processa múltiplos encerramentos por inatividade (job agendado)
 */
export async function processarEncerramentosInativos() {
  console.log('🔍 Verificando conversas inativas...');
  
  const conversasInativas = await verificarEncerramentoPorInatividade();
  
  if (conversasInativas.length === 0) {
    console.log('✅ Nenhuma conversa inativa');
    return;
  }
  
  console.log(`⚠️ Encontradas ${conversasInativas.length} conversas inativas`);
  
  for (const conversa of conversasInativas) {
    console.log(`   Encerrando: ${conversa.numero_usuario} (${conversa.nome_cliente})`);
    
    // Buscar contexto da conversa
    const { data } = await supabase
      .from('conversations')
      .select('contexto, nome_cliente')
      .eq('numero_usuario', conversa.numero_usuario)
      .single();
    
    const contexto = data?.contexto || {};
    contexto.nomeCliente = data?.nome_cliente || 'amigo(a)';
    
    // Processar encerramento
    await processarEncerramento(
      '', 
      contexto, 
      conversa.numero_usuario, 
      'inatividade'
    );
  }
  
  console.log('✅ Encerramentos por inatividade processados');
}

/**
 * Detecta se cliente quer ver mais opções
 */
export function querVerMaisOpcoes(mensagem) {
  const palavras = [
    'mais',
    'outros',
    'outras',
    'diferente',
    'opções',
    'opcoes',
    'mostrar mais',
    'tem mais',
    'outra coisa',
    'outro produto'
  ];
  
  const mensagemLower = mensagem.toLowerCase();
  return palavras.some(p => mensagemLower.includes(p));
}

/**
 * Detecta se cliente está indeciso
 */
export function clienteIndeciso(mensagem) {
  const palavras = [
    'nao sei',
    'não sei',
    'na duvida',
    'na dúvida',
    'ainda nao',
    'ainda não',
    'pensando',
    'vou pensar',
    'depois',
    'talvez',
    'me confundi'
  ];
  
  const mensagemLower = mensagem.toLowerCase();
  return palavras.some(p => mensagemLower.includes(p));
}
