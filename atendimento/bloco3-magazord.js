/**
 * =====================================================
 * BLOCO 3: INTEGRAÇÃO MAGAZORD E BUSCA DE PRODUTOS
 * Busca no catálogo local e verifica disponibilidade no Magazord
 * =====================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { supabase } from '../db/supabase.js';

/**
 * Busca produtos no catálogo local com filtro dinâmico
 */
export async function buscarProdutosFiltrado(contexto) {
  try {
    console.log('🔍 [Bloco 3] Buscando produtos com filtro:', contexto);
    
    const catalogoPath = path.join(
      process.cwd(),
      'catalogos',
      'produtos',
      `${contexto.tipoProduto.toLowerCase()}.json`
    );
    
    const conteudo = await fs.readFile(catalogoPath, 'utf-8');
    const catalogo = JSON.parse(conteudo);
    
    let produtosFiltrados = catalogo.produtos || [];
    
    // Filtrar por modelo
    if (contexto.modelo) {
      produtosFiltrados = produtosFiltrados.filter(p => 
        p.modelo && p.modelo.toLowerCase() === contexto.modelo.toLowerCase()
      );
    }
    
    // Filtrar por gênero
    if (contexto.genero) {
      produtosFiltrados = produtosFiltrados.filter(p => {
        if (!p.sexo) return true; // Se não tem info de sexo, inclui
        return p.sexo.toLowerCase() === contexto.genero.toLowerCase();
      });
    }
    
    // Filtrar por cor (se especificada)
    if (contexto.cor) {
      produtosFiltrados = produtosFiltrados.filter(p => {
        if (!p.coresDisponiveis || p.coresDisponiveis.length === 0) return true;
        return p.coresDisponiveis.some(cor => 
          cor.toLowerCase().includes(contexto.cor.toLowerCase()) ||
          contexto.cor.toLowerCase().includes(cor.toLowerCase())
        );
      });
    }
    
    // Filtrar por tamanho (se especificado)
    if (contexto.tamanho) {
      produtosFiltrados = produtosFiltrados.filter(p => {
        if (!p.tamanhos || p.tamanhos.length === 0) return true;
        return p.tamanhos.includes(contexto.tamanho.toUpperCase());
      });
    }
    
    // Se tem múltiplos modelos solicitados (até 5), buscar todos
    if (contexto.modelosSolicitados && contexto.modelosSolicitados.length > 1) {
      const produtosMultiplos = [];
      
      for (const modelo of contexto.modelosSolicitados.slice(0, 5)) {
        const produtosModelo = (catalogo.produtos || []).filter(p =>
          p.modelo && p.modelo.toLowerCase() === modelo.toLowerCase()
        );
        produtosMultiplos.push(...produtosModelo);
      }
      
      produtosFiltrados = produtosMultiplos;
    }
    
    console.log(`✅ Encontrados ${produtosFiltrados.length} produtos`);
    
    return {
      produtos: produtosFiltrados.slice(0, 10), // Máximo 10 produtos
      total: produtosFiltrados.length
    };
  } catch (erro) {
    console.error('❌ Erro ao buscar produtos:', erro);
    return {
      produtos: [],
      total: 0,
      erro: erro.message
    };
  }
}

/**
 * Formata produtos para enviar ao cliente
 * NÃO ENVIA SKU, apenas nome, link, preço, tecido
 */
export function formatarProdutosParaCliente(produtos, contexto) {
  if (!produtos || produtos.length === 0) {
    return gerarMensagemNaoEncontrado(contexto);
  }
  
  let mensagem = `🎉 *Encontrei ${produtos.length} opções perfeitas para você!*\n\n`;
  
  produtos.forEach((produto, index) => {
    const numero = index + 1;
    
    mensagem += `*${numero}. ${produto.nome || produto.nomeCompleto}*\n`;
    
    if (produto.preco) {
      // Limpar e formatar preço
      const precoLimpo = produto.preco.split('no')[0].trim();
      mensagem += `💰 ${precoLimpo}\n`;
    }
    
    if (produto.caracteristicas && produto.caracteristicas.Tecido) {
      mensagem += `🧵 Tecido: ${produto.caracteristicas.Tecido}\n`;
    }
    
    if (produto.link) {
      mensagem += `🔗 ${produto.link}\n`;
    }
    
    mensagem += `\n`;
  });
  
  mensagem += `_Qual desses produtos mais te interessou? Posso buscar mais detalhes! 😊_`;
  
  return mensagem;
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
  
  // Verificar se cliente confirmou
  const confirmou = verificarConfirmacao(mensagem);
  
  if (!confirmou) {
    // Cliente negou ou quer mudar algo
    if (verificarNegacao(mensagem)) {
      resultado.mensagem = `Tudo bem! O que você gostaria de mudar?\n\n`;
      resultado.mensagem += `• Digite *"modelo"* para escolher outro modelo\n`;
      resultado.mensagem += `• Digite *"cor"* para mudar a cor\n`;
      resultado.mensagem += `• Digite *"tipo"* para mudar o tipo de produto`;
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
    resultado.mensagem = formatarProdutosParaCliente(produtos, contexto);
    resultado.produtosEncontrados = produtos;
    resultado.contextoAtualizado.buscaRealizada = true;
    resultado.contextoAtualizado.totalBuscas++;
    resultado.contextoAtualizado.confirmacaoPendente = false;
    
    // Salvar no histórico
    // Buscar ou criar conversaId
    const conversaId = await obterConversaId(numeroUsuario);
    if (conversaId) {
      await salvarProdutosPesquisados(numeroUsuario, conversaId, produtos, contexto);
    }
    
    resultado.proximaFase = 'pos-busca'; // Nova fase pós-busca
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
