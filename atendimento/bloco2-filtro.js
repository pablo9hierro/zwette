/**
 * =====================================================
 * BLOCO 2: FILTRO DINÂMICO (TIPO → GÊNERO → COR)
 * Sistema inteligente de captura de preferências
 * =====================================================
 */

import { supabase } from '../db/supabase.js';
import {
  gerarListaEnumerada,
  processarRespostaLista,
  salvarListaEnumerada,
  carregarTiposProdutos,
  carregarCoresProduto,
  gerarListaTiposProdutosComRecomendacao
} from './lista-enumerada.js';
import { carregarGenerosProduto } from './carregar-generos.js';

/**
 * Gerencia o Bloco 2: Filtro Dinâmico
 * - Captura tipo de produto
 * - Captura gênero
 * - Captura cor (opcional)
 * - Pode capturar múltiplas informações numa mensagem ("jaleco feminino branco")
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
  console.log('   Mensagem:', mensagem);
  console.log('   Tipo:', contexto.tipoProduto || 'NÃO CAPTURADO');
  console.log('   Gênero:', contexto.genero || 'NÃO CAPTURADO');
  console.log('   Cor:', contexto.cor || 'NÃO CAPTURADO');
  console.log('   Aguardando:', contexto.aguardandoResposta);
  
  // ====================================================================
  // DETECÇÃO INTELIGENTE MÚLTIPLA: Captura 1, 2 ou 3 filtros de uma vez
  // Exemplo: "jaleco masculino verde" → captura os 3 de uma vez
  // ====================================================================
  
  // Se NÃO tem os 3 filtros ainda, tenta detectar múltiplos
  if (!contexto.tipoProduto || !contexto.genero || !contexto.cor) {
    console.log('   🔍 Tentando capturar múltiplos filtros...');
    
    let tipoCapturado = resultado.contextoAtualizado.tipoProduto;
    let generoCapturado = resultado.contextoAtualizado.genero;
    let corCapturada = resultado.contextoAtualizado.cor;
    
    // Detectar tipo (se ainda não tem)
    if (!tipoCapturado) {
      const tipoDetectado = detectarTipoProduto(mensagem);
      if (tipoDetectado) {
        tipoCapturado = tipoDetectado;
        resultado.contextoAtualizado.tipoProduto = tipoDetectado;
        resultado.contextoAtualizado.caracteristicasMencionadas = 
          resultado.contextoAtualizado.caracteristicasMencionadas || [];
        resultado.contextoAtualizado.caracteristicasMencionadas.push('tipo');
        console.log('   ✅ Tipo capturado:', tipoDetectado);
      }
    }
    
    // Detectar gênero (se ainda não tem)
    if (!generoCapturado) {
      const generoDetectado = detectarGenero(mensagem);
      if (generoDetectado) {
        generoCapturado = generoDetectado;
        resultado.contextoAtualizado.genero = generoDetectado;
        resultado.contextoAtualizado.caracteristicasMencionadas = 
          resultado.contextoAtualizado.caracteristicasMencionadas || [];
        resultado.contextoAtualizado.caracteristicasMencionadas.push('genero');
        console.log('   ✅ Gênero capturado:', generoDetectado);
      }
    }
    
    // Detectar cor (se ainda não tem E tem tipo)
    if (!corCapturada && tipoCapturado) {
      const coresDisponiveis = await carregarCoresProduto(tipoCapturado, generoCapturado);
      const corDetectada = detectarCor(mensagem, coresDisponiveis);
      if (corDetectada) {
        corCapturada = corDetectada;
        resultado.contextoAtualizado.cor = corDetectada;
        resultado.contextoAtualizado.caracteristicasMencionadas = 
          resultado.contextoAtualizado.caracteristicasMencionadas || [];
        resultado.contextoAtualizado.caracteristicasMencionadas.push('cor');
        console.log('   ✅ Cor capturada:', corDetectada);
      }
    }
    
    // ====================================================================
    // CENÁRIO 1: Capturou OS 3 FILTROS de uma vez!
    // ====================================================================
    if (tipoCapturado && generoCapturado && corCapturada) {
      console.log('   🎯 CAPTUROU 3 FILTROS! Indo direto para confirmação...');
      
      resultado.mensagem = gerarMensagemConfirmacao(resultado.contextoAtualizado);
      resultado.contextoAtualizado.faseAtual = 'confirmacao';
      resultado.contextoAtualizado.confirmacaoPendente = true;
      resultado.contextoAtualizado.aguardandoResposta = null;
      
      return resultado;
    }
    
    // ====================================================================
    // CENÁRIO 2: Capturou 2 FILTROS (tipo + genero)
    // ====================================================================
    if (tipoCapturado && generoCapturado && !corCapturada) {
      console.log('   🎯 CAPTUROU 2 FILTROS (tipo + gênero)! Verificando cores... [v3.0-ESPECIAL]');
      
      // Carregar cores disponíveis
      const cores = await carregarCoresProduto(tipoCapturado, generoCapturado);
      console.log(`   → 🎨 Cores disponíveis: ${cores.length} [v3.0-ESPECIAL]`);
      
      // ⚠️ CASO ESPECIAL: Produto SEM cores disponíveis
      // Ex: Bandeja, Kit Office, Mouse Pad, etc.
      if (cores.length === 0) {
        console.log('   ⚡ Produto SEM cores! Indo direto para confirmação...');
        
        // Definir cor como null (busca será feita com 2 filtros apenas)
        resultado.contextoAtualizado.cor = null;
        
        // Gerar mensagem de confirmação direta
        resultado.mensagem = 
          `✨ Perfeito! Então vou buscar:\n\n` +
          `• *${tipoCapturado}*\n` +
          `• *${generoCapturado}*\n\n` +
          `🔍 *Posso buscar no site as melhores opções pra você?*`;
        
        resultado.contextoAtualizado.faseAtual = 'confirmacao';
        resultado.contextoAtualizado.aguardandoResposta = 'confirmacao';
        resultado.contextoAtualizado.caracteristicasMencionadas = 
          resultado.contextoAtualizado.caracteristicasMencionadas || [];
        resultado.contextoAtualizado.caracteristicasMencionadas.push('sem_cor');
        
        return resultado;
      }
      
      // Produto TEM cores: perguntar normalmente
      const listaCores = gerarListaEnumerada(
        cores,
        `Cores disponíveis para o *${tipoCapturado} ${generoCapturado}*:`
      );
      
      // 📨 MENSAGEM SEQUENCIAL: Confirma os 2 + pede o terceiro
      const nomeCliente = resultado.contextoAtualizado.nomeCliente;
      const mensagem1 = `Que bom que escolheu *${tipoCapturado} ${generoCapturado}*! 😊\n\n` +
                       `Agora vou te ajudar a escolher a cor perfeita! 🎨`;
      const mensagem2 = listaCores;
      
      resultado.mensagem = [mensagem1, mensagem2];
      resultado.contextoAtualizado.aguardandoResposta = 'cor';
      resultado.contextoAtualizado.coresDisponiveis = cores;
      resultado.listaEnumerada = {
        tipo_lista: 'cores',
        itens: cores.map((c, i) => ({ numero: i + 1, valor: c })),
        referente_a: tipoCapturado
      };
      
      return resultado;
    }
    
    // ====================================================================
    // CENÁRIO 3: Capturou 2 FILTROS (tipo + cor) - RARO mas possível
    // ====================================================================
    if (tipoCapturado && !generoCapturado && corCapturada) {
      console.log('   🎯 CAPTUROU 2 FILTROS (tipo + cor)! Perguntando gênero...');
      
      // Carregar gêneros disponíveis
      const generos = await carregarGenerosProduto(tipoCapturado);
      const listaGeneros = gerarListaEnumerada(
        generos,
        `Agora escolha qual gênero você prefere:`
      );
      
      // 📨 MENSAGEM SEQUENCIAL
      const mensagem1 = `Que bom que escolheu *${tipoCapturado} ${corCapturada}*! 😊\n\n` +
                       `Agora me diz qual gênero você prefere:`;
      const mensagem2 = listaGeneros;
      
      resultado.mensagem = [mensagem1, mensagem2];
      resultado.contextoAtualizado.aguardandoResposta = 'genero';
      resultado.listaEnumerada = {
        tipo_lista: 'generos',
        itens: generos.map((g, i) => ({ numero: i + 1, valor: g })),
        referente_a: tipoCapturado
      };
      
      return resultado;
    }
  }
  
  // ====================================================================
  // ETAPA 1: CAPTURAR TIPO DE PRODUTO (fluxo normal - 1 filtro por vez)
  // ====================================================================
  // ====================================================================
  if (!resultado.contextoAtualizado.tipoProduto) {
    console.log('   → Capturando tipo de produto...');
    
    // Se já enviou lista, processar resposta
    if (contexto.ultimaListaEnumerada && contexto.ultimaListaEnumerada.tipo_lista === 'tipos_produto') {
      const tipoSelecionado = processarRespostaLista(
        mensagem, 
        contexto.ultimaListaEnumerada.itens.map(i => i.valor)
      );
      
      if (tipoSelecionado) {
        resultado.contextoAtualizado.tipoProduto = tipoSelecionado.toLowerCase();
        resultado.contextoAtualizado.caracteristicasMencionadas = 
          resultado.contextoAtualizado.caracteristicasMencionadas || [];
        resultado.contextoAtualizado.caracteristicasMencionadas.push('tipo');
        
        // Carregar gêneros disponíveis
        const generos = await carregarGenerosProduto(tipoSelecionado.toLowerCase());
        
        // ⚠️ CASO ESPECIAL: Produto com APENAS 1 GÊNERO
        // Ex: Crachá só existe em Unissex
        if (generos.length === 1) {
          const generoUnico = generos[0];
          console.log(`   ⚡ Produto tem apenas 1 gênero (${generoUnico})! Auto-capturando...`);
          
          // Auto-capturar gênero
          resultado.contextoAtualizado.genero = generoUnico.toLowerCase();
          resultado.contextoAtualizado.caracteristicasMencionadas.push('genero');
          
          // Carregar cores para esse gênero
          const cores = await carregarCoresProduto(tipoSelecionado.toLowerCase(), generoUnico);
          console.log(`   → 🎨 Cores disponíveis: ${cores.length}`);
          
          // Se NÃO tem cores, ir direto para confirmação
          if (cores.length === 0) {
            console.log('   ⚡ Produto SEM cores! Indo direto para confirmação...');
            
            resultado.contextoAtualizado.cor = null;
            resultado.mensagem = 
              `✨ Perfeito! Temos *${tipoSelecionado}* disponível apenas no gênero *${generoUnico}*.\n\n` +
              `Vou buscar:\n` +
              `• *${tipoSelecionado}*\n` +
              `• *${generoUnico}*\n\n` +
              `🔍 *Posso buscar no site as melhores opções pra você?*`;
            
            resultado.contextoAtualizado.faseAtual = 'confirmacao';
            resultado.contextoAtualizado.aguardandoResposta = 'confirmacao';
            resultado.contextoAtualizado.caracteristicasMencionadas.push('sem_cor');
            
            return resultado;
          }
          
          // TEM cores: mostrar lista de cores diretamente
          const listaCores = gerarListaEnumerada(
            cores,
            `Cores disponíveis:`
          );
          
          const nomeCliente = resultado.contextoAtualizado.nomeCliente;
          const mensagem1 = 
            `Perfeito, *${nomeCliente}*! 😊\n\n` +
            `Temos *${tipoSelecionado}* disponível apenas no gênero *${generoUnico}*.\n\n` +
            `Vou te mostrar as cores disponíveis! 🎨`;
          const mensagem2 = listaCores;
          
          resultado.mensagem = [mensagem1, mensagem2];
          resultado.contextoAtualizado.aguardandoResposta = 'cor';
          resultado.contextoAtualizado.coresDisponiveis = cores;
          resultado.listaEnumerada = {
            tipo_lista: 'cores',
            itens: cores.map((c, i) => ({ numero: i + 1, valor: c })),
            referente_a: tipoSelecionado.toLowerCase()
          };
          
          return resultado;
        }
        
        // Produto TEM múltiplos gêneros: perguntar normalmente
        const listaGeneros = gerarListaEnumerada(
          generos,
          `Agora escolha qual gênero você prefere:`
        );
        
        // 📨 MENSAGEM SEQUENCIAL: Confirmação + Lista de gêneros
        const nomeCliente = resultado.contextoAtualizado.nomeCliente;
        const mensagem1 = `Perfeito, *${nomeCliente}*! 😊\n\n` +
                         `Ótima escolha, *${tipoSelecionado}*! 👏`;
        const mensagem2 = listaGeneros;
        
        resultado.mensagem = [mensagem1, mensagem2];
        resultado.contextoAtualizado.aguardandoResposta = 'genero';
        resultado.listaEnumerada = {
          tipo_lista: 'generos',
          itens: generos.map((g, i) => ({ numero: i + 1, valor: g })),
          referente_a: tipoSelecionado
        };
        
        return resultado;
      } else {
        resultado.mensagem = `Hmm, não entendi sua escolha. Pode escolher pelo número ou nome da lista? 😅`;
        return resultado;
      }
    }
    
    // Não detectou tipo, enviar lista de tipos
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
  // ETAPA 2: CAPTURAR GÊNERO
  // ====================================================================
  if (resultado.contextoAtualizado.tipoProduto && !resultado.contextoAtualizado.genero) {
    console.log('   → Capturando gênero...');
    
    // Se já enviou lista de gêneros OU está aguardando resposta de gênero, processar
    if ((contexto.ultimaListaEnumerada && contexto.ultimaListaEnumerada.tipo_lista === 'generos') || 
        contexto.aguardandoResposta === 'genero') {
      
      // Carregar gêneros do catálogo para validação
      const generosDisponiveis = await carregarGenerosProduto(resultado.contextoAtualizado.tipoProduto);
      const generoSelecionado = processarRespostaLista(
        mensagem,
        generosDisponiveis
      );
      
      if (generoSelecionado) {
        console.log('   ✅ Gênero selecionado:', generoSelecionado);
        
        resultado.contextoAtualizado.genero = generoSelecionado.toLowerCase();
        resultado.contextoAtualizado.caracteristicasMencionadas = 
          resultado.contextoAtualizado.caracteristicasMencionadas || [];
        resultado.contextoAtualizado.caracteristicasMencionadas.push('genero');
        
        console.log('   → 🎨 CARREGANDO CORES...');
        
        // Perguntar cor
        const cores = await carregarCoresProduto(
          resultado.contextoAtualizado.tipoProduto, 
          null, 
          resultado.contextoAtualizado.genero  // Filtrar por gênero
        );
        
        console.log('   → 🎨 Cores carregadas:', cores.length);
        
        if (cores.length > 0) {
          const listaCores = gerarListaEnumerada(
            cores,
            `Cores disponíveis para o *${resultado.contextoAtualizado.tipoProduto} ${generoSelecionado}*:`
          );
          
          console.log('   → 🎨 ENVIANDO LISTA DE CORES');
          console.log('   → Mensagem:', listaCores.substring(0, 100));
          
          // 📨 MENSAGEM SEQUENCIAL: Transição + Lista de cores
          const nomeCliente = resultado.contextoAtualizado.nomeCliente;
          const tipoProduto = resultado.contextoAtualizado.tipoProduto;
          
          const mensagem1 = `Perfeito, *${nomeCliente}*! 🎯\n\n` +
                           `Para finalizar a melhor busca, vou te ajudar a decidir a cor do seu *${tipoProduto}*! 🎨`;
          const mensagem2 = listaCores + `\n\n_(Ou diga "qualquer cor" / "tanto faz" se não tiver preferência)_`;
          
          resultado.mensagem = [mensagem1, mensagem2];
          resultado.contextoAtualizado.aguardandoResposta = 'cor';
          resultado.contextoAtualizado.coresDisponiveis = cores;
          resultado.listaEnumerada = {
            tipo_lista: 'cores',
            itens: cores.map((c, i) => ({ numero: i + 1, valor: c })),
            referente_a: resultado.contextoAtualizado.tipoProduto
          };
          
          console.log('   → ✅ RETORNANDO COM LISTA DE CORES');
          
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
        resultado.mensagem = `Não encontrei esse gênero. Pode escolher da lista acima pelo número ou nome? 🤔`;
        return resultado;
      }
    }
    
    // Não detectou gênero, enviar lista (carregar do catálogo)
    const generos = await carregarGenerosProduto(resultado.contextoAtualizado.tipoProduto);
    const listaGeneros = gerarListaEnumerada(
      generos,
      `Você prefere modelo:`
    );
    
    resultado.mensagem = listaGeneros;
    resultado.contextoAtualizado.aguardandoResposta = 'genero';
    resultado.listaEnumerada = {
      tipo_lista: 'generos',
      itens: generos.map((g, i) => ({ numero: i + 1, valor: g })),
      referente_a: resultado.contextoAtualizado.tipoProduto
    };
    
    return resultado;
  }
  
  // ====================================================================
  // ETAPA 3: CAPTURAR COR (OBRIGATÓRIA!)
  // ====================================================================
  if (resultado.contextoAtualizado.tipoProduto && resultado.contextoAtualizado.genero && !resultado.contextoAtualizado.cor) {
    console.log('   → Capturando cor (OBRIGATÓRIA)...');
    console.log('   aguardandoResposta:', contexto.aguardandoResposta);
    console.log('   ultimaListaEnumerada tipo:', contexto.ultimaListaEnumerada?.tipo_lista);
    
    // Se JÁ enviou lista de cores e está aguardando resposta
    if (contexto.ultimaListaEnumerada?.tipo_lista === 'cores' && contexto.aguardandoResposta === 'cor') {
      console.log('   → Processando resposta de cor...');
      
      // Verificar se cliente está pedindo para ver lista novamente
      if (mensagem.toLowerCase().includes('quais') || 
          mensagem.toLowerCase().includes('lista') ||
          mensagem.toLowerCase().includes('cores')) {
        const cores = await carregarCoresProduto(
          resultado.contextoAtualizado.tipoProduto, 
          null,
          resultado.contextoAtualizado.genero  // Filtrar por gênero
        );
        
        if (cores.length > 0) {
          const listaCores = gerarListaEnumerada(
            cores,
            `Aqui estão as cores disponíveis de *${resultado.contextoAtualizado.tipoProduto} ${resultado.contextoAtualizado.genero}*:`
          );
          
          resultado.mensagem = listaCores + `\n\n_(Ou diga "qualquer cor" / "tanto faz" se não tiver preferência)_`;
          resultado.contextoAtualizado.aguardandoResposta = 'cor';
          resultado.contextoAtualizado.coresDisponiveis = cores;
          resultado.listaEnumerada = {
            tipo_lista: 'cores',
            itens: cores.map((c, i) => ({ numero: i + 1, valor: c })),
            referente_a: resultado.contextoAtualizado.tipoProduto
          };
          
          return resultado;
        }
      }
      
      // Verificar se cliente não tem preferência
      if (semPreferenciaCor(mensagem)) {
        resultado.contextoAtualizado.cor = null;
        resultado.proximaFase = 'confirmacao';
        resultado.contextoAtualizado.faseAtual = 'confirmacao';
        resultado.mensagem = gerarMensagemConfirmacao(resultado.contextoAtualizado);
        resultado.contextoAtualizado.confirmacaoPendente = true;
        return resultado;
      }
      
      // Processar resposta da lista
      const corSelecionada = processarRespostaLista(
        mensagem,
        contexto.ultimaListaEnumerada.itens.map(i => i.valor)
      );
      
      if (corSelecionada) {
        resultado.contextoAtualizado.cor = corSelecionada;
        resultado.contextoAtualizado.caracteristicasMencionadas = 
          resultado.contextoAtualizado.caracteristicasMencionadas || [];
        resultado.contextoAtualizado.caracteristicasMencionadas.push('cor');
        
        // Ir para confirmação
        resultado.proximaFase = 'confirmacao';
        resultado.contextoAtualizado.faseAtual = 'confirmacao';
        resultado.mensagem = gerarMensagemConfirmacao(resultado.contextoAtualizado);
        resultado.contextoAtualizado.confirmacaoPendente = true;
        return resultado;
      }
      
      // Não encontrou cor, pedir novamente
      resultado.mensagem = `Não encontrei essa cor. Pode escolher da lista acima pelo número ou nome?\n\nOu diga "qualquer cor" se não tiver preferência 😊`;
      return resultado;
    }
    
    // AINDA NÃO ENVIOU LISTA DE CORES - ENVIAR AGORA!
    console.log('   → 🔥 ENVIANDO LISTA DE CORES PELA PRIMEIRA VEZ...');
    
    const cores = await carregarCoresProduto(
      resultado.contextoAtualizado.tipoProduto, 
      null,
      resultado.contextoAtualizado.genero  // Filtrar por gênero
    );
    
    if (cores.length > 0) {
      const listaCores = gerarListaEnumerada(
        cores,
        `Legal, *${resultado.contextoAtualizado.tipoProduto} ${resultado.contextoAtualizado.genero}*! 👍\n\nQual cor você prefere?`
      );
      
      resultado.mensagem = listaCores + `\n\n_(Ou diga "qualquer cor" / "tanto faz" se não tiver preferência)_`;
      resultado.contextoAtualizado.aguardandoResposta = 'cor';
      resultado.contextoAtualizado.coresDisponiveis = cores;
      resultado.listaEnumerada = {
        tipo_lista: 'cores',
        itens: cores.map((c, i) => ({ numero: i + 1, valor: c })),
        referente_a: resultado.contextoAtualizado.tipoProduto
      };
      
      console.log('   → ✅ Lista de cores criada com', cores.length, 'itens');
      
      return resultado;
    } else {
      console.log('   → ⚠️ Nenhuma cor disponível, indo para confirmação');
      // Sem cores, ir para confirmação
      resultado.contextoAtualizado.cor = null;
      resultado.proximaFase = 'confirmacao';
      resultado.contextoAtualizado.faseAtual = 'confirmacao';
      resultado.mensagem = gerarMensagemConfirmacao(resultado.contextoAtualizado);
      resultado.contextoAtualizado.confirmacaoPendente = true;
      return resultado;
    }
  }
  
  // ====================================================================
  // FINALIZAÇÃO: Se tem tipo, gênero E COR → ir para confirmação
  // COR É OBRIGATÓRIA!
  // ====================================================================
  if (resultado.contextoAtualizado.tipoProduto && resultado.contextoAtualizado.genero && resultado.contextoAtualizado.cor !== undefined) {
    console.log('   → Filtros capturados (tipo, gênero, cor), indo para confirmação...');
    resultado.proximaFase = 'confirmacao';
    resultado.contextoAtualizado.faseAtual = 'confirmacao';
    resultado.mensagem = gerarMensagemConfirmacao(resultado.contextoAtualizado);
    resultado.contextoAtualizado.confirmacaoPendente = true;
    return resultado;
  }
  
  return resultado;
}

/**
 * Detecta tipo de produto na mensagem
 */
function detectarTipoProduto(mensagem) {
  const mensagemLower = mensagem.toLowerCase();
  
  const tipos = {
    'jaleco': ['jaleco', 'jalecos'],
    'scrub': ['scrub', 'scrubs', 'pijama cirurgico', 'pijama cirúrgico'],
    'gorro': ['gorro', 'gorros', 'touca cirurgica', 'touca cirúrgica', 'goros', 'goro'],
    'touca': ['touca', 'toucas'],
    'turbante': ['turbante', 'turbantes'],
    'robe': ['robe', 'robes', 'roupao', 'roupão', 'roupoes', 'roupões'],
    'dolma': ['dolma', 'dolmas', 'dolmã', 'dólmã'],
    'avental': ['avental', 'aventais'],
    'macacao': ['macacao', 'macacão', 'macacoes', 'macacões', 'macaca', 'macacas'],
    'vestido': ['vestido', 'vestidos'],
    'cracha': ['cracha', 'crachá', 'crachas', 'crachás'],
    'bandeja': ['bandeja', 'bandejas'],
    'desk-pad': ['desk pad', 'deskpad', 'desk-pad'],
    'kit-office': ['kit office', 'kit-office', 'kit escritorio', 'kit escritório'],
    'mouse-pad': ['mouse pad', 'mousepad', 'mouse-pad'],
    'porta-canetas': ['porta canetas', 'porta-canetas', 'porta caneta'],
    'porta-copo': ['porta copo', 'porta-copo', 'porta copos'],
    'porta-objetos': ['porta objetos', 'porta-objetos', 'porta objeto']
  };
  
  for (const [tipo, sinonimos] of Object.entries(tipos)) {
    if (sinonimos.some(s => mensagemLower.includes(s))) {
      return tipo;
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
 * Normaliza string removendo acentos, pontuação
 */
function normalizarTexto(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '') // Remove pontuação
    .trim();
}

/**
 * Detecta cor na mensagem
 * Prioriza cores compostas (ex: "Rosa Pink" antes de "Rosa")
 * ⚠️ NORMALIZA para evitar problemas com acentos (Bordô = Bordo)
 */
function detectarCor(mensagem, coresDisponiveis) {
  const mensagemNormalizada = normalizarTexto(mensagem);
  
  // Ordenar cores por tamanho (maiores primeiro) para priorizar compostas
  const coresOrdenadas = [...coresDisponiveis].sort((a, b) => b.length - a.length);
  
  // 1. Tentar match exato (normalizado)
  for (const cor of coresOrdenadas) {
    if (mensagemNormalizada === normalizarTexto(cor)) {
      return cor;
    }
  }
  
  // 2. Tentar match de palavra completa (normalizado)
  for (const cor of coresOrdenadas) {
    const corNormalizada = normalizarTexto(cor);
    const regex = new RegExp(`\\b${corNormalizada}\\b`, 'i');
    if (regex.test(mensagemNormalizada)) {
      return cor;
    }
  }
  
  // 3. Match parcial (normalizado)
  for (const cor of coresOrdenadas) {
    const corNormalizada = normalizarTexto(cor);
    
    // Cliente disse a cor (ou parte dela)
    if (mensagemNormalizada.includes(corNormalizada)) {
      return cor;
    }
    
    // Cor contém o que o cliente disse (match invertido)
    if (corNormalizada.includes(mensagemNormalizada)) {
      return cor;
    }
  }
  
  // 4. Match por palavras individuais
  for (const cor of coresOrdenadas) {
    const palavrasCor = normalizarTexto(cor).split(/\s+/);
    const palavrasMensagem = mensagemNormalizada.split(/\s+/);
    
    // Se alguma palavra da mensagem está nas palavras da cor
    for (const palavraMensagem of palavrasMensagem) {
      if (palavraMensagem.length >= 4) { // Palavras com 4+ caracteres
        for (const palavraCor of palavrasCor) {
          if (palavraCor === palavraMensagem || palavraCor.startsWith(palavraMensagem)) {
            return cor;
          }
        }
      }
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
  let mensagem = `✨ Perfeito! Então vou buscar:\n\n`;
  
  // Lista com bullet points
  mensagem += `• *${contexto.tipoProduto}*\n`;
  
  if (contexto.genero) {
    mensagem += `• *${contexto.genero}*\n`;
  }
  
  if (contexto.cor) {
    mensagem += `• *${contexto.cor}*\n`;
  } else {
    mensagem += `• Qualquer cor\n`;
  }
  
  mensagem += `\n🔍 *Posso buscar no site os melhores produtos pra você baseado nas suas preferências?*`;
  
  return mensagem;
}

// ====================================================================
// EXPORTAÇÕES: Funções de detecção usadas por outros blocos
// ====================================================================
export { detectarTipoProduto, detectarGenero, detectarCor };
