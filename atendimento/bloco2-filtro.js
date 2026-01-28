/**
 * =====================================================
 * BLOCO 2: FILTRO DINÂMICO E RECOMENDAÇÃO
 * Sistema inteligente de captura de preferências e filtro
 * =====================================================
 */

import { supabase } from '../db/supabase.js';
import {
  gerarListaEnumerada,
  processarRespostaLista,
  salvarListaEnumerada,
  carregarTiposProdutos,
  carregarModelosProduto,
  carregarCoresProduto,
  carregarTamanhosProduto,
  gerarListaTiposProdutosComRecomendacao
} from './lista-enumerada.js';

/**
 * Gerencia o Bloco 2: Filtro Dinâmico
 * - Captura tipo de produto
 * - Captura modelo (com lista enumerada)
 * - Captura gênero
 * - Captura cor (opcional, com lista)
 * - Monta filtro dinâmico conforme cliente fala
 */

/**
 * Processa mensagem no Bloco 2
 */
export async function processarBloco2(mensagem, contexto, numeroUsuario) {
  const resultado = {
    mensagem: '',
    contextoAtualizado: { ...contexto },
    proximaFase: 'filtro',
    listaEnumerada: null
  };
  
  console.log('🔍 [Bloco 2] Iniciando filtro dinâmico...');
  console.log('   Contexto atual:', JSON.stringify(contexto, null, 2));
  console.log('   Aguardando resposta:', contexto.aguardandoResposta);
  
  // ====================================================================
  // ETAPA 1: CAPTURAR TIPO DE PRODUTO
  // ====================================================================
  if (!contexto.tipoProduto) {
    console.log('   → Capturando tipo de produto...');
    
    // Se já enviou lista, processar resposta
    if (contexto.ultimaListaEnumerada && contexto.ultimaListaEnumerada.tipo_lista === 'tipos_produto') {
      const tipoSelecionado = processarRespostaLista(
        mensagem, 
        contexto.ultimaListaEnumerada.itens.map(i => i.valor)
      );
      
      if (tipoSelecionado) {
        resultado.contextoAtualizado.tipoProduto = tipoSelecionado.toLowerCase();
        resultado.contextoAtualizado.caracteristicasMencionadas.push('tipo');
        
        // Perguntar modelo
        const modelos = await carregarModelosProduto(tipoSelecionado);
        
        if (modelos.length > 0) {
          const listaMensagem = gerarListaEnumerada(
            modelos.slice(0, 20), // Máximo 20 modelos por vez
            `Ótima escolha! Para *${tipoSelecionado}*, temos estes modelos:`
          );
          
          resultado.mensagem = listaMensagem;
          resultado.contextoAtualizado.aguardandoResposta = 'modelo';
          resultado.contextoAtualizado.modelosDisponiveis = modelos;
          resultado.listaEnumerada = {
            tipo_lista: 'modelos',
            itens: modelos.slice(0, 20).map((m, i) => ({ numero: i + 1, valor: m })),
            referente_a: tipoSelecionado
          };
          
          return resultado;
        } else {
          resultado.mensagem = `Legal! Você escolheu *${tipoSelecionado}*. Você prefere modelo masculino, feminino ou unissex?`;
          resultado.contextoAtualizado.aguardandoResposta = 'genero';
          return resultado;
        }
      } else {
        resultado.mensagem = `Hmm, não entendi sua escolha. Pode escolher pelo número ou nome da lista? 😅`;
        return resultado;
      }
    }
    
    // Tentar detectar tipo na mensagem
    const tipoDetectado = await detectarTipoProduto(mensagem);
    
    if (tipoDetectado) {
      resultado.contextoAtualizado.tipoProduto = tipoDetectado;
      resultado.contextoAtualizado.caracteristicasMencionadas.push('tipo');
      
      // Perguntar modelo
      const modelos = await carregarModelosProduto(tipoDetectado);
      
      if (modelos.length > 0) {
        const listaMensagem = gerarListaEnumerada(
          modelos.slice(0, 20),
          `Ótima escolha! Para *${tipoDetectado}*, temos estes modelos:`
        );
        
        resultado.mensagem = listaMensagem;
        resultado.contextoAtualizado.aguardandoResposta = 'modelo';
        resultado.contextoAtualizado.modelosDisponiveis = modelos;
        resultado.listaEnumerada = {
          tipo_lista: 'modelos',
          itens: modelos.slice(0, 20).map((m, i) => ({ numero: i + 1, valor: m })),
          referente_a: tipoDetectado
        };
        
        return resultado;
      }
    }
    
    // Não detectou, enviar lista de tipos
    const { mensagem: listaTipos, lista } = await gerarListaTiposProdutosComRecomendacao(
      contexto.profissao
    );
    
    resultado.mensagem = listaTipos;
    resultado.contextoAtualizado.aguardandoResposta = 'tipo_produto';
    resultado.listaEnumerada = {
      tipo_lista: 'tipos_produto',
      itens: lista.map((t, i) => ({ numero: i + 1, valor: t })),
      referente_a: null
    };
    
    return resultado;
  }
  
  // ====================================================================
  // ETAPA 2: CAPTURAR MODELO
  // ====================================================================
  if (contexto.tipoProduto && !contexto.modelo) {
    console.log('   → Capturando modelo...');
    
    // Se já enviou lista de modelos, processar resposta
    if (contexto.ultimaListaEnumerada && contexto.ultimaListaEnumerada.tipo_lista === 'modelos') {
      const modeloSelecionado = processarRespostaLista(
        mensagem,
        contexto.ultimaListaEnumerada.itens.map(i => i.valor)
      );
      
      if (modeloSelecionado) {
        resultado.contextoAtualizado.modelo = modeloSelecionado;
        resultado.contextoAtualizado.caracteristicasMencionadas.push('modelo');
        
        // Adicionar à lista de modelos solicitados
        if (!resultado.contextoAtualizado.modelosSolicitados.includes(modeloSelecionado)) {
          resultado.contextoAtualizado.modelosSolicitados.push(modeloSelecionado);
        }
        
        // Perguntar gênero
        resultado.mensagem = `Perfeito! Modelo *${modeloSelecionado}* anotado! 👍\n\nVocê prefere modelo *masculino*, *feminino* ou *unissex*?`;
        resultado.contextoAtualizado.aguardandoResposta = 'genero';
        
        return resultado;
      } else {
        resultado.mensagem = `Não encontrei esse modelo. Pode escolher da lista acima pelo número ou nome? 🤔`;
        return resultado;
      }
    }
    
    // Tentar detectar modelo na mensagem
    const modeloDetectado = await detectarModelo(mensagem, contexto.tipoProduto);
    
    if (modeloDetectado) {
      resultado.contextoAtualizado.modelo = modeloDetectado;
      resultado.contextoAtualizado.caracteristicasMencionadas.push('modelo');
      
      if (!resultado.contextoAtualizado.modelosSolicitados.includes(modeloDetectado)) {
        resultado.contextoAtualizado.modelosSolicitados.push(modeloDetectado);
      }
      
      // Perguntar gênero
      resultado.mensagem = `Perfeito! Modelo *${modeloDetectado}* anotado! 👍\n\nVocê prefere modelo *masculino*, *feminino* ou *unissex*?`;
      resultado.contextoAtualizado.aguardandoResposta = 'genero';
      
      return resultado;
    }
    
    // Não detectou, verificar se cliente quer ver lista
    if (mensagem.toLowerCase().includes('lista') || 
        mensagem.toLowerCase().includes('quais') ||
        mensagem.toLowerCase().includes('modelos')) {
      
      const modelos = await carregarModelosProduto(contexto.tipoProduto);
      
      if (modelos.length > 0) {
        const listaMensagem = gerarListaEnumerada(
          modelos.slice(0, 20),
          `Aqui estão os modelos de *${contexto.tipoProduto}* disponíveis:`
        );
        
        resultado.mensagem = listaMensagem;
        resultado.contextoAtualizado.aguardandoResposta = 'modelo';
        resultado.contextoAtualizado.modelosDisponiveis = modelos;
        resultado.listaEnumerada = {
          tipo_lista: 'modelos',
          itens: modelos.slice(0, 20).map((m, i) => ({ numero: i + 1, valor: m })),
          referente_a: contexto.tipoProduto
        };
        
        return resultado;
      }
    }
    
    resultado.mensagem = `Qual modelo de *${contexto.tipoProduto}* você prefere?\n\n_(Ou digite "lista" para ver todos os modelos disponíveis)_`;
    return resultado;
  }
  
  // ====================================================================
  // ETAPA 3: CAPTURAR GÊNERO
  // ====================================================================
  if (contexto.tipoProduto && contexto.modelo && !contexto.genero) {
    console.log('   → Capturando gênero...');
    
    const generoDetectado = detectarGenero(mensagem);
    
    if (generoDetectado) {
      resultado.contextoAtualizado.genero = generoDetectado;
      resultado.contextoAtualizado.caracteristicasMencionadas.push('genero');
      
      // Perguntar cor
      const cores = await carregarCoresProduto(contexto.tipoProduto, contexto.modelo);
      
      if (cores.length > 0) {
        const listaCores = gerarListaEnumerada(
          cores.slice(0, 15),
          `Legal! Qual cor você prefere para o *${contexto.tipoProduto} ${contexto.modelo}*?`
        );
        
        resultado.mensagem = listaCores + `\n\n_(Ou diga "qualquer cor" / "tanto faz" se não tiver preferência)_`;
        resultado.contextoAtualizado.aguardandoResposta = 'cor';
        resultado.contextoAtualizado.coresDisponiveis = cores;
        resultado.listaEnumerada = {
          tipo_lista: 'cores',
          itens: cores.slice(0, 15).map((c, i) => ({ numero: i + 1, valor: c })),
          referente_a: `${contexto.tipoProduto} ${contexto.modelo}`
        };
        
        return resultado;
      } else {
        // Sem cores, ir para confirmação
        resultado.proximaFase = 'confirmacao';
        resultado.contextoAtualizado.faseAtual = 'confirmacao';
        resultado.mensagem = gerarMensagemConfirmacao(resultado.contextoAtualizado);
        resultado.contextoAtualizado.confirmacaoPendente = true;
        return resultado;
      }
    } else {
      resultado.mensagem = `Não entendi o gênero. Você prefere modelo *masculino*, *feminino* ou *unissex*? 🤔`;
      return resultado;
    }
  }
  
  // ====================================================================
  // ETAPA 4: CAPTURAR COR (OPCIONAL)
  // ====================================================================
  if (contexto.tipoProduto && contexto.modelo && contexto.genero && !contexto.cor) {
    console.log('   → Capturando cor (opcional)...');
    
    // Verificar se cliente não tem preferência
    if (semPreferenciaCor(mensagem)) {
      resultado.contextoAtualizado.cor = null; // Deixa nulo = qualquer cor
      resultado.proximaFase = 'confirmacao';
      resultado.contextoAtualizado.faseAtual = 'confirmacao';
      resultado.mensagem = gerarMensagemConfirmacao(resultado.contextoAtualizado);
      resultado.contextoAtualizado.confirmacaoPendente = true;
      return resultado;
    }
    
    // Processar resposta da lista
    if (contexto.ultimaListaEnumerada && contexto.ultimaListaEnumerada.tipo_lista === 'cores') {
      const corSelecionada = processarRespostaLista(
        mensagem,
        contexto.ultimaListaEnumerada.itens.map(i => i.valor)
      );
      
      if (corSelecionada) {
        resultado.contextoAtualizado.cor = corSelecionada;
        resultado.contextoAtualizado.caracteristicasMencionadas.push('cor');
        
        // Ir para confirmação
        resultado.proximaFase = 'confirmacao';
        resultado.contextoAtualizado.faseAtual = 'confirmacao';
        resultado.mensagem = gerarMensagemConfirmacao(resultado.contextoAtualizado);
        resultado.contextoAtualizado.confirmacaoPendente = true;
        return resultado;
      }
    }
    
    // Tentar detectar cor na mensagem
    const corDetectada = detectarCor(mensagem, contexto.coresDisponiveis);
    
    if (corDetectada) {
      resultado.contextoAtualizado.cor = corDetectada;
      resultado.contextoAtualizado.caracteristicasMencionadas.push('cor');
      
      // Ir para confirmação
      resultado.proximaFase = 'confirmacao';
      resultado.contextoAtualizado.faseAtual = 'confirmacao';
      resultado.mensagem = gerarMensagemConfirmacao(resultado.contextoAtualizado);
      resultado.contextoAtualizado.confirmacaoPendente = true;
      return resultado;
    }
    
    resultado.mensagem = `Não encontrei essa cor. Pode escolher da lista acima ou dizer "qualquer cor"? 😊`;
    return resultado;
  }
  
  return resultado;
}

/**
 * Detecta tipo de produto na mensagem
 */
async function detectarTipoProduto(mensagem) {
  const mensagemLower = mensagem.toLowerCase();
  
  const tipos = {
    'jaleco': ['jaleco', 'jalecos'],
    'scrub': ['scrub', 'scrubs', 'pijama cirurgico'],
    'gorro': ['gorro', 'gorros', 'touca cirurgica'],
    'touca': ['touca', 'toucas'],
    'robe': ['robe', 'robes', 'roupao'],
    'avental': ['avental', 'aventais'],
    'macacao': ['macacao', 'macacão', 'macacoes'],
    'outros': ['outros', 'acessorio', 'acessorios']
  };
  
  for (const [tipo, sinonimos] of Object.entries(tipos)) {
    if (sinonimos.some(s => mensagemLower.includes(s))) {
      return tipo;
    }
  }
  
  return null;
}

/**
 * Detecta modelo na mensagem
 */
async function detectarModelo(mensagem, tipoProduto) {
  const modelos = await carregarModelosProduto(tipoProduto);
  const mensagemLower = mensagem.toLowerCase();
  
  for (const modelo of modelos) {
    if (mensagemLower.includes(modelo.toLowerCase())) {
      return modelo;
    }
  }
  
  return null;
}

/**
 * Detecta gênero na mensagem
 */
function detectarGenero(mensagem) {
  const mensagemLower = mensagem.toLowerCase();
  
  if (mensagemLower.includes('masculino') || mensagemLower.includes('homem')) {
    return 'masculino';
  }
  
  if (mensagemLower.includes('feminino') || mensagemLower.includes('mulher')) {
    return 'feminino';
  }
  
  if (mensagemLower.includes('unissex') || mensagemLower.includes('uni sex') || mensagemLower.includes('ambos')) {
    return 'unissex';
  }
  
  return null;
}

/**
 * Detecta cor na mensagem
 */
function detectarCor(mensagem, coresDisponiveis) {
  const mensagemLower = mensagem.toLowerCase();
  
  for (const cor of coresDisponiveis) {
    if (mensagemLower.includes(cor.toLowerCase())) {
      return cor;
    }
  }
  
  return null;
}

/**
 * Verifica se cliente não tem preferência de cor
 */
function semPreferenciaCor(mensagem) {
  const palavras = [
    'qualquer',
    'tanto faz',
    'nao importa',
    'não importa',
    'qualquer uma',
    'qualquer cor',
    'sem preferencia',
    'sem preferência'
  ];
  
  const mensagemLower = mensagem.toLowerCase();
  return palavras.some(p => mensagemLower.includes(p));
}

/**
 * Gera mensagem de confirmação antes da busca
 */
function gerarMensagemConfirmacao(contexto) {
  let mensagem = `Perfeito! Então vou buscar:\n\n`;
  mensagem += `📦 *Produto:* ${contexto.tipoProduto}\n`;
  mensagem += `👔 *Modelo:* ${contexto.modelo}\n`;
  
  if (contexto.genero) {
    mensagem += `⚧️ *Gênero:* ${contexto.genero}\n`;
  }
  
  if (contexto.cor) {
    mensagem += `🎨 *Cor:* ${contexto.cor}\n`;
  } else {
    mensagem += `🎨 *Cor:* Qualquer cor\n`;
  }
  
  mensagem += `\n*Posso buscar pra você?* 🔍\n\n`;
  mensagem += `_(Responda "sim" / "pode" / "busca" para confirmar)_`;
  
  return mensagem;
}
