/**
 * =====================================================
 * BLOCO 3: INTEGRAÇÃO MAGAZORD E BUSCA DE PRODUTOS
 * Busca no catálogo local e verifica disponibilidade no Magazord
 * =====================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { supabase } from '../db/supabase.js';
import { buscarPrecosPromocionais, ordenarPorPromocao, formatarListaComPromocoes } from './buscar-precos-promocionais.js';

/**
 * Normaliza string removendo acentos e pontuação
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
 * Limpa nome de cor removendo informações redundantes
 * (MESMA lógica de lista-enumerada.js para garantir consistência)
 */
function limparNomeCor(nomeCor, tipoProduto) {
  if (!nomeCor) return nomeCor;
  
  let corLimpa = nomeCor;
  
  const palavrasRemover = [
    tipoProduto,
    'Magnético', 'Magnética',
    'Jaleco', 'Scrub', 'Avental', 'Touca', 'Gorro', 
    'Turbante', 'Dolma', 'Vestido', 'Robe', 'Macacão',
    'Crachá', 'Cracha',
    'Regulável', 'Regulavel', 'Ajustável', 'Ajustavel',
    'Linho'
  ];
  
  for (let i = 0; i < 3; i++) {
    for (const palavra of palavrasRemover) {
      const regexInicio = new RegExp(`^${palavra}\\s+`, 'gi');
      corLimpa = corLimpa.replace(regexInicio, '');
      
      const regexMeio = new RegExp(`\\s+${palavra}\\s+`, 'gi');
      corLimpa = corLimpa.replace(regexMeio, ' ');
      
      const regexFim = new RegExp(`\\s+${palavra}$`, 'gi');
      corLimpa = corLimpa.replace(regexFim, '');
    }
    
    corLimpa = corLimpa.trim().replace(/\s+/g, ' ');
  }
  
  return corLimpa;
}

/**
 * Busca produtos no catálogo local com filtro dinâmico
 */
export async function buscarProdutosFiltrado(contexto) {
  try {
    console.log('🔍 [Bloco 3 - VERSÃO ATUALIZADA v2.0] Buscando produtos com filtro:', contexto);
    
    // ⚠️ VALIDAÇÃO: DEVE TER tipo + gênero (cor é opcional para produtos sem cores)
    if (!contexto.tipoProduto || !contexto.genero) {
      console.error('❌ ERRO: Busca final EXIGE tipo e gênero obrigatoriamente!');
      console.error('Recebido:', {
        tipoProduto: contexto.tipoProduto || 'FALTANDO',
        genero: contexto.genero || 'FALTANDO',
        cor: contexto.cor || 'null (opcional)'
      });
      throw new Error('Busca final requer tipoProduto e genero obrigatoriamente');
    }
    
    const catalogoPath = path.join(
      process.cwd(),
      'catalogos',
      'produtos',
      `${contexto.tipoProduto.toLowerCase()}.json`
    );
    
    const conteudo = await fs.readFile(catalogoPath, 'utf-8');
    const catalogo = JSON.parse(conteudo);
    
    // ====================================================================
    // ⚠️ VALIDAÇÃO DINÂMICA: Verificar se produto TEM cores no catálogo
    // ====================================================================
    // Se contexto.cor é null, verificar se o produto REALMENTE não tem cores
    // Se o catálogo TEM cores disponíveis, é OBRIGATÓRIO ter cor no contexto!
    if (!contexto.cor || contexto.cor === null) {
      // Verificar se ALGUM produto no catálogo tem cores disponíveis
      const produtosComCores = (catalogo.produtosOriginais || []).filter(p => 
        p.coresDisponiveis && p.coresDisponiveis.length > 0
      );
      
      if (produtosComCores.length > 0) {
        // Pegar exemplo de cores para mostrar no erro
        const exemploCores = produtosComCores[0].coresDisponiveis.slice(0, 3).join(', ');
        const totalCores = produtosComCores[0].coresDisponiveis.length;
        
        console.error('❌ ERRO: Produto TEM cores disponíveis no catálogo!');
        console.error(`   → Exemplo de cores: ${exemploCores}${totalCores > 3 ? '...' : ''}`);
        console.error(`   → Total de produtos com cores: ${produtosComCores.length}`);
        console.error('   → É OBRIGATÓRIO fornecer a cor para fazer a busca!');
        console.error('   → Busca com 2 filtros só é permitida para produtos SEM cores no catálogo.');
        throw new Error(`Produto "${contexto.tipoProduto}" tem cores disponíveis. É obrigatório especificar a cor!`);
      }
      
      console.log('   ✅ Validação OK: Produto realmente NÃO tem cores no catálogo');
      console.log('   → Busca com 2 filtros (tipo + gênero) é permitida');
    }
    
    let produtosFiltrados = catalogo.produtosOriginais || [];
    
    // Filtrar por gênero (OBRIGATÓRIO)
    // ⚠️ IMPORTANTE: "Unissex" é compatível com TODOS os gêneros
    produtosFiltrados = produtosFiltrados.filter(p => {
      if (!p.sexo) return false; // Se não tem sexo, EXCLUI
      
      const sexoProduto = p.sexo.toLowerCase();
      const generoSolicitado = contexto.genero.toLowerCase();
      
      // Unissex aceita qualquer gênero
      if (sexoProduto === 'unissex') return true;
      
      // Match exato
      return sexoProduto === generoSolicitado;
    });
    
    // Filtrar por cor (OPCIONAL - só se tiver cor especificada)
    if (contexto.cor) {
      produtosFiltrados = produtosFiltrados.filter(p => {
        if (!p.coresDisponiveis || p.coresDisponiveis.length === 0) return false;
        
        const corBuscadaNormalizada = normalizarTexto(contexto.cor);
        const nomeProduto = (p.nome || p.nomeCompleto || '').toLowerCase();
        
        // A cor principal é a PRIMEIRA do array coresDisponiveis
        const corPrincipalOriginal = p.coresDisponiveis[0];
        
        // ⚠️ IMPORTANTE: Limpar e NORMALIZAR a cor do catálogo antes de comparar
        const corPrincipalLimpa = limparNomeCor(corPrincipalOriginal, contexto.tipoProduto);
        const corPrincipalNormalizada = normalizarTexto(corPrincipalLimpa);
        
        console.log(`   🎨 Comparando NORMALIZADO: "${corBuscadaNormalizada}" VS "${corPrincipalNormalizada}" (original: "${corPrincipalOriginal}")`);
        
        // Match exato normalizado (Bordô = Bordo = bordo)
        if (corPrincipalNormalizada !== corBuscadaNormalizada) {
          // Match parcial normalizado
          const matchParcial = 
            corPrincipalNormalizada.includes(corBuscadaNormalizada) || 
            corBuscadaNormalizada.includes(corPrincipalNormalizada);
          
          if (!matchParcial) {
            console.log(`   ❌ Cor não match: "${corBuscadaNormalizada}" ≠ "${corPrincipalNormalizada}"`);
            return false;
          }
        }
        
        console.log(`   ✅ Cor OK: "${corBuscadaNormalizada}" = "${corPrincipalNormalizada}"`);
        
        // ⚠️ VALIDAÇÃO ADICIONAL: Excluir produtos cujo NOME menciona OUTRA cor diferente
        // Lista de cores conhecidas para detectar conflito no nome
        const coresConhecidas = [
          'azul', 'branco', 'branca', 'verde', 'rosa', 'preto', 'preta', 
          'roxo', 'roxa', 'amarelo', 'amarela', 'vermelho', 'vermelha',
          'cinza', 'chumbo', 'bordo', 'bege', 'lilas', 'coral', 
          'tangerina', 'nude', 'off white', 'aco'
        ];
        
        // Verificar se o nome do produto menciona explicitamente outra cor
        for (const outraCor of coresConhecidas) {
          if (outraCor === corBuscadaNormalizada) continue; // Pular a cor que estamos buscando
          
          // Verificar se o nome contém a palavra "calca [outraCor]" ou "e calca [outraCor]"
          const regexCalca = new RegExp(`(e )?calca ${outraCor}\\b`, 'i');
          if (regexCalca.test(nomeProduto)) {
            return false; // Excluir este produto
          }
        }
        
        return true;
      });
    } else {
      console.log('   ⚠️ Busca SEM filtro de cor (produto não tem cores disponíveis)');
    }
    
    // Filtrar por tamanho (OPCIONAL - só se especificado)
    if (contexto.tamanho) {
      produtosFiltrados = produtosFiltrados.filter(p => {
        if (!p.tamanhos || p.tamanhos.length === 0) return true;
        return p.tamanhos.includes(contexto.tamanho.toUpperCase());
      });
    }
    
    console.log(`✅ Encontrados ${produtosFiltrados.length} produtos com os 3 filtros obrigatórios`);
    
    return {
      produtos: produtosFiltrados, // Retorna TODOS os produtos encontrados
      total: produtosFiltrados.length
    };
  } catch (erro) {
    // Se for erro de validação crítica (filtros obrigatórios ou cores obrigatórias), re-lançar
    if (
      erro.message.includes('3 filtros obrigatórios') || 
      erro.message.includes('requer tipoProduto') || 
      erro.message.includes('cores disponíveis') ||
      erro.message.includes('obrigatório especificar')
    ) {
      throw erro; // Re-lançar para não silenciar validação crítica
    }
    
    // Outros erros são silenciados e retornam objeto vazio
    console.error('❌ Erro ao buscar produtos:', erro);
    return {
      produtos: [],
      total: 0,
      erro: erro.message
    };
  }
}

/**
 * Formata produtos para enviar ao cliente COM PREÇOS PROMOCIONAIS
 * - Busca preços na API Magazord
 * - Ordena: promocionais primeiro
 * - Mostra preço SOMENTE em produtos promocionais
 * RETORNA ARRAY com 2 mensagens sequenciais
 */
export async function formatarProdutosParaCliente(produtos, contexto) {
  if (!produtos || produtos.length === 0) {
    return gerarMensagemNaoEncontrado(contexto);
  }
  
  console.log('\n🏷️ [Bloco 3] Consultando preços promocionais...');
  
  // Buscar preços e promoções na API Magazord
  const produtosComPreco = await buscarPrecosPromocionais(produtos);
  
  // Ordenar: promocionais primeiro, depois normais
  const produtosOrdenados = ordenarPorPromocao(produtosComPreco);
  
  const totalProdutos = produtosOrdenados.length;
  const totalPromocoes = produtosOrdenados.filter(p => p.emPromocao).length;
  
  // 📨 MENSAGEM 1: Lista de produtos
  let mensagem1 = `🎉 Encontrei *${totalProdutos}* ${totalProdutos === 1 ? 'produto' : 'produtos'} para você!`;
  
  if (totalPromocoes > 0) {
    mensagem1 += `\n🎁 *${totalPromocoes}* ${totalPromocoes === 1 ? 'está' : 'estão'} em PROMOÇÃO!`;
  }
  
  mensagem1 += `\n\n`;
  mensagem1 += formatarListaComPromocoes(produtosOrdenados);
  
  // 📨 MENSAGEM 2: Pergunta chave mágica humanizada
  const mensagem2 = 
    `Agora você quer *continuar buscando produtos* na minha loja? 🛍️\n\n` +
    `Ou quer que eu te ajude a *calcular o frete* para o seu CEP? 📦\n\n` +
    `Ou pode simplesmente *encerrar o atendimento*. 😊`;
  
  return [mensagem1, mensagem2];
}

/**
 * Verifica disponibilidade no Magazord (opcional para MVP)
 */
export async function verificarDisponibilidadeMagazord(sku) {
  // TODO: Implementar quando integração com Magazord estiver completa
  // Por enquanto, retorna sempre disponível
  console.log(`⏭️ [Magazord] Verificação de ${sku} (não implementado no MVP)`);
  
  return {
    disponivel: true,
    estoque: 'Consultar disponibilidade',
    mensagem: 'Produto disponível para consulta'
  };
}

/**
 * Salva produtos pesquisados no histórico
 */
export async function salvarProdutosPesquisados(numeroUsuario, conversaId, produtos, contexto) {
  try {
    const registros = produtos.map(produto => ({
      numero_usuario: numeroUsuario,
      conversa_id: conversaId,
      tipo_produto: contexto.tipoProduto,
      modelo: produto.modelo,
      cor: contexto.cor || 'qualquer',
      tamanho: contexto.tamanho || null,
      genero: contexto.genero,
      sku_produto: produto.sku,
      link_produto: produto.link,
      cliente_interessado: false,
      enviado_em: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('produtos_pesquisados_historico')
      .insert(registros);
    
    if (error) {
      console.error('Erro ao salvar histórico de produtos:', error);
      return false;
    }
    
    console.log(`✅ Salvos ${registros.length} produtos no histórico`);
    return true;
  } catch (erro) {
    console.error('Erro ao salvar produtos pesquisados:', erro);
    return false;
  }
}

/**
 * Marca produto como interessado pelo cliente
 */
export async function marcarProdutoInteressado(numeroUsuario, sku) {
  try {
    const { error } = await supabase
      .from('produtos_pesquisados_historico')
      .update({ cliente_interessado: true })
      .eq('numero_usuario', numeroUsuario)
      .eq('sku_produto', sku);
    
    if (error) {
      console.error('Erro ao marcar produto interessado:', error);
      return false;
    }
    
    return true;
  } catch (erro) {
    console.error('Erro ao marcar produto interessado:', erro);
    return false;
  }
}

/**
 * Gera mensagem quando não encontrou produtos
 */
function gerarMensagemNaoEncontrado(contexto) {
  let mensagem = `😔 Puxa, não encontrei produtos exatamente com essas características:\n\n`;
  
  if (contexto.tipoProduto) mensagem += `• Tipo: ${contexto.tipoProduto}\n`;
  if (contexto.modelo) mensagem += `• Modelo: ${contexto.modelo}\n`;
  if (contexto.genero) mensagem += `• Gênero: ${contexto.genero}\n`;
  if (contexto.cor) mensagem += `• Cor: ${contexto.cor}\n`;
  
  mensagem += `\nMas posso te ajudar de outras formas:\n\n`;
  mensagem += `1️⃣ Buscar outro modelo\n`;
  mensagem += `2️⃣ Ver outras cores disponíveis\n`;
  mensagem += `3️⃣ Escolher outro tipo de produto\n\n`;
  mensagem += `O que você prefere?`;
  
  return mensagem;
}

/**
 * Processa confirmação do cliente e realiza busca
 */
export async function processarConfirmacaoBusca(mensagem, contexto, numeroUsuario) {
  const resultado = {
    mensagem: '',
    contextoAtualizado: { ...contexto },
    produtosEncontrados: [],
    proximaFase: 'busca'
  };
  
  // VALIDAÇÃO CRÍTICA: Garantir que tem TODOS os dados obrigatórios
  if (!contexto.tipoProduto || !contexto.genero) {
    console.log('❌ ERRO: Tentou buscar sem dados obrigatórios!');
    console.log('   Tipo:', contexto.tipoProduto);
    console.log('   Gênero:', contexto.genero);
    console.log('   Cor:', contexto.cor);
    
    resultado.mensagem = `Ops! Faltam algumas informações para eu buscar. Vamos começar de novo?\n\nQue tipo de produto você quer?`;
    resultado.proximaFase = 'filtro';
    resultado.contextoAtualizado.confirmacaoPendente = false;
    resultado.contextoAtualizado.tipoProduto = null;
    resultado.contextoAtualizado.genero = null;
    resultado.contextoAtualizado.cor = null;
    return resultado;
  }
  
  // ====================================================================
  // 🔍 DETECÇÃO DE MUDANÇA: Antes de confirmar, verificar se cliente
  // está mudando algum filtro (ex: "quero jaleco feminino" ao invés de confirmar)
  // ====================================================================
  console.log('🔍 Verificando se cliente quer mudar filtros...');
  
  // Importar funções de detecção
  const { detectarTipoProduto, detectarGenero, detectarCor } = await import('./bloco2-filtro.js');
  const { carregarCoresProduto, carregarGenerosProduto } = await import('./lista-enumerada.js');
  
  const tipoNovo = detectarTipoProduto(mensagem);
  const generoNovo = detectarGenero(mensagem);
  
  // Se detectou tipo OU gênero DIFERENTE, cliente quer mudar!
  if ((tipoNovo && tipoNovo !== contexto.tipoProduto) || 
      (generoNovo && generoNovo !== contexto.genero)) {
    console.log('🔄 Cliente quer mudar filtros!');
    console.log('   Tipo novo:', tipoNovo);
    console.log('   Gênero novo:', generoNovo);
    
    // Atualizar os filtros detectados
    if (tipoNovo) resultado.contextoAtualizado.tipoProduto = tipoNovo;
    if (generoNovo) resultado.contextoAtualizado.genero = generoNovo;
    
    // Resetar cor se mudou tipo ou gênero
    resultado.contextoAtualizado.cor = null;
    resultado.contextoAtualizado.coresDisponiveis = [];
    
    // Carregar novas cores
    const tipo = resultado.contextoAtualizado.tipoProduto;
    const genero = resultado.contextoAtualizado.genero;
    
    if (tipo && genero) {
      // Tem tipo e gênero, pedir cor
      const cores = await carregarCoresProduto(tipo, genero);
      const { gerarListaEnumerada } = await import('./lista-enumerada.js');
      const listaCores = gerarListaEnumerada(
        cores,
        `Cores disponíveis para o *${tipo} ${genero}*:`
      );
      
      resultado.mensagem = `Entendi! Você quer *${tipo} ${genero}*! 😊\n\n` +
                          `Agora me diz qual cor você prefere:\n\n${listaCores}`;
      resultado.contextoAtualizado.aguardandoResposta = 'cor';
      resultado.contextoAtualizado.coresDisponiveis = cores;
      resultado.contextoAtualizado.faseAtual = 'filtro';
      resultado.proximaFase = 'filtro';
      
      return resultado;
    } else if (tipo && !genero) {
      // Tem só tipo, pedir gênero
      const generos = await carregarGenerosProduto(tipo);
      const { gerarListaEnumerada } = await import('./lista-enumerada.js');
      const listaGeneros = gerarListaEnumerada(
        generos,
        `Agora escolha qual gênero você prefere:`
      );
      
      resultado.mensagem = `Entendi! Você quer *${tipo}*! 😊\n\n${listaGeneros}`;
      resultado.contextoAtualizado.aguardandoResposta = 'genero';
      resultado.contextoAtualizado.faseAtual = 'filtro';
      resultado.proximaFase = 'filtro';
      
      return resultado;
    }
  }
  
  // Se não detectou mudança, continuar com fluxo normal de confirmação
  // Verificar se cliente confirmou
  const confirmou = verificarConfirmacao(mensagem);
  
  if (!confirmou) {
    // Cliente negou ou quer mudar algo
    if (verificarNegacao(mensagem)) {
      // ⚠️ CORREÇÃO: Usar tom humanizado com lista enumerada
      resultado.mensagem = `Tudo bem! O que você gostaria de mudar?\n\n`;
      resultado.mensagem += `1️⃣ Escolher outro *modelo*\n`;
      resultado.mensagem += `2️⃣ Mudar a *cor*\n`;
      resultado.mensagem += `3️⃣ Mudar o *tipo de produto*\n\n`;
      resultado.mensagem += `Digite o número ou fale o que quer mudar 😊`;
      resultado.proximaFase = 'filtro';
      resultado.contextoAtualizado.confirmacaoPendente = false;
      return resultado;
    } else {
      resultado.mensagem = `Não entendi. Pode confirmar se quer que eu busque? Responda *"sim"* ou *"não"* 😊`;
      return resultado;
    }
  }
  
  // Cliente confirmou, realizar busca
  console.log('✅ Cliente confirmou busca!');
  
  const { produtos, total } = await buscarProdutosFiltrado(contexto);
  
  if (produtos.length > 0) {
    // 🔍 FILTRAR APENAS PRODUTOS DISPONÍVEIS NO MAGAZORD (verificação silenciosa)
    const { filtrarProdutosDisponiveis } = await import('../tools/magazord-api.js');
    const produtosDisponiveis = await filtrarProdutosDisponiveis(produtos);
    
    resultado.mensagem = await formatarProdutosParaCliente(produtosDisponiveis, contexto);
    resultado.produtosEncontrados = produtosDisponiveis;
    resultado.contextoAtualizado.buscaRealizada = true;
    resultado.contextoAtualizado.totalBuscas++;
    resultado.contextoAtualizado.confirmacaoPendente = false;
    resultado.contextoAtualizado.faseAtual = 'continuacao';
    resultado.contextoAtualizado.aguardandoResposta = 'continuacao_ou_encerramento';
    
    // 🎯 SALVAR PRODUTOS E TIPO PARA CÁLCULO DE FRETE
    resultado.contextoAtualizado.produtosParaFrete = produtosDisponiveis.slice(0, 3); // Primeiros 3 produtos
    resultado.contextoAtualizado.tipoProdutoBuscado = contexto.tipoProduto; // Salvar tipo para mensagem de frete
    
    // Salvar no histórico
    // Buscar ou criar conversaId
    const conversaId = await obterConversaId(numeroUsuario);
    if (conversaId) {
      await salvarProdutosPesquisados(numeroUsuario, conversaId, produtosDisponiveis, contexto);
    }
    
    resultado.proximaFase = 'continuacao'; // Nova fase de continuação
  } else {
    resultado.mensagem = gerarMensagemNaoEncontrado(contexto);
    resultado.proximaFase = 'filtro';
    resultado.contextoAtualizado.confirmacaoPendente = false;
  }
  
  return resultado;
}

/**
 * Verifica se mensagem é uma confirmação
 */
function verificarConfirmacao(mensagem) {
  const palavrasConfirmacao = [
    'sim',
    'yes',
    'pode',
    'busca',
    'quero',
    'procura',
    'vamos',
    'claro',
    'confirmo',
    'ok',
    'beleza',
    'show',
    'isso',
    'exato'
  ];
  
  const mensagemLower = mensagem.toLowerCase().trim();
  return palavrasConfirmacao.some(p => mensagemLower.includes(p));
}

/**
 * Verifica se mensagem é uma negação
 */
function verificarNegacao(mensagem) {
  const palavrasNegacao = [
    'nao',
    'não',
    'nunca',
    'jamais',
    'negativo',
    'nem',
    'para'
  ];
  
  const mensagemLower = mensagem.toLowerCase().trim();
  return palavrasNegacao.some(p => mensagemLower.includes(p));
}

/**
 * Obtém ID da conversa no banco
 */
async function obterConversaId(numeroUsuario) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('numero_usuario', numeroUsuario)
      .eq('ativa', true)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.id;
  } catch (erro) {
    console.error('Erro ao obter conversa ID:', erro);
    return null;
  }
}
