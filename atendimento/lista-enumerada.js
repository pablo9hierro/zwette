/**
 * =====================================================
 * SISTEMA DE LISTAS ENUMERADAS
 * Facilita escolha do cliente com listas numeradas
 * =====================================================
 */

import { supabase } from '../db/supabase.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Gera lista enumerada formatada para WhatsApp
 */
export function gerarListaEnumerada(itens, titulo = '') {
  let mensagem = titulo ? `${titulo}\n\n` : '';
  
  itens.forEach((item, index) => {
    mensagem += `• ${item}\n`;
  });
  
  mensagem += `\n_Digite o nome do item que você quer! 😊_`;
  
  return mensagem;
}

/**
 * Obtém emoji de número
 */
function obterEmojiNumero(numero) {
  const emojis = {
    1: '1️⃣',
    2: '2️⃣',
    3: '3️⃣',
    4: '4️⃣',
    5: '5️⃣',
    6: '6️⃣',
    7: '7️⃣',
    8: '8️⃣',
    9: '9️⃣',
    10: '🔟'
  };
  
  return emojis[numero] || '▪️';
}

/**
 * Processa resposta do cliente a uma lista enumerada
 * Retorna o item selecionado
 */
export function processarRespostaLista(mensagem, lista) {
  const mensagemLower = mensagem.toLowerCase().trim();
  
  // Verificar se é um número
  const numero = parseInt(mensagemLower);
  if (!isNaN(numero) && numero >= 1 && numero <= lista.length) {
    return lista[numero - 1];
  }
  
  // Verificar se é o nome do item (partial match)
  for (const item of lista) {
    if (item.toLowerCase().includes(mensagemLower) || 
        mensagemLower.includes(item.toLowerCase())) {
      return item;
    }
  }
  
  return null;
}

/**
 * Salva lista enumerada no banco
 */
export async function salvarListaEnumerada(numeroUsuario, conversaId, tipoLista, itens, referenteA = null) {
  try {
    const itensFormatados = itens.map((item, index) => ({
      valor: item  // SEM número - apenas valor
    }));
    
    const { data, error } = await supabase
      .from('mensagens_enumeradas')
      .insert({
        numero_usuario: numeroUsuario,
        conversa_id: conversaId,
        tipo_lista: tipoLista,
        itens: itensFormatados,
        referente_a: referenteA,
        enviada_em: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Erro ao salvar lista enumerada:', error);
      return null;
    }
    
    return data[0];
  } catch (erro) {
    console.error('Erro ao salvar lista enumerada:', erro);
    return null;
  }
}

/**
 * Busca última lista enumerada enviada
 */
export async function buscarUltimaListaEnumerada(numeroUsuario, conversaId) {
  try {
    const { data, error } = await supabase
      .from('mensagens_enumeradas')
      .select('*')
      .eq('numero_usuario', numeroUsuario)
      .eq('conversa_id', conversaId)
      .eq('cliente_respondeu', false)
      .order('enviada_em', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    return data[0];
  } catch (erro) {
    console.error('Erro ao buscar última lista:', erro);
    return null;
  }
}

/**
 * Marca lista como respondida
 */
export async function marcarListaRespondida(listaId, respostaCliente) {
  try {
    const { error } = await supabase
      .from('mensagens_enumeradas')
      .update({
        cliente_respondeu: true,
        resposta_cliente: respostaCliente
      })
      .eq('id', listaId);
    
    if (error) {
      console.error('Erro ao marcar lista respondida:', error);
      return false;
    }
    
    return true;
  } catch (erro) {
    console.error('Erro ao marcar lista respondida:', erro);
    return false;
  }
}

/**
 * Carrega lista de tipos de produtos do catálogo
 */
export async function carregarTiposProdutos() {
  try {
    const catalogoPath = path.join(process.cwd(), 'catalogos', 'produtos');
    const arquivos = await fs.readdir(catalogoPath);
    
    // Extrair nomes sem extensão .json
    const tipos = arquivos
      .filter(arquivo => arquivo.endsWith('.json') && arquivo !== 'resumo-catalogo.json')
      .map(arquivo => {
        const nome = arquivo.replace('.json', '');
        // Capitalizar primeira letra
        return nome.charAt(0).toUpperCase() + nome.slice(1);
      });
    
    return tipos;
  } catch (erro) {
    console.error('Erro ao carregar tipos de produtos:', erro);
    // Fallback para lista padrão
    return [
      'Jaleco',
      'Scrub',
      'Gorro',
      'Touca',
      'Robe',
      'Avental',
      'Macacão',
      'Outros'
    ];
  }
}

/**
 * Carrega modelos de um produto específico
 */
export async function carregarModelosProduto(tipoProduto) {
  try {
    const catalogoPath = path.join(
      process.cwd(), 
      'catalogos', 
      'produtos', 
      `${tipoProduto.toLowerCase()}.json`
    );
    
    const conteudo = await fs.readFile(catalogoPath, 'utf-8');
    const catalogo = JSON.parse(conteudo);
    
    // Retornar lista de modelos únicos
    if (catalogo.modelosDeJaleco) {
      return catalogo.modelosDeJaleco;
    } else if (catalogo.modelos) {
      return catalogo.modelos;
    } else if (Array.isArray(catalogo.produtos)) {
      // Extrair modelos únicos dos produtos
      const modelos = [...new Set(
        catalogo.produtos
          .map(p => p.modelo)
          .filter(m => m && m !== 'null')
      )];
      return modelos;
    }
    
    return [];
  } catch (erro) {
    console.error(`Erro ao carregar modelos de ${tipoProduto}:`, erro);
    return [];
  }
}

/**
 * Carrega cores disponíveis de um produto
 */
export async function carregarCoresProduto(tipoProduto, modelo = null) {
  try {
    const catalogoPath = path.join(
      process.cwd(), 
      'catalogos', 
      'produtos', 
      `${tipoProduto.toLowerCase()}.json`
    );
    
    const conteudo = await fs.readFile(catalogoPath, 'utf-8');
    const catalogo = JSON.parse(conteudo);
    
    let cores = [];
    
    // Se especificou modelo, filtrar por modelo
    if (modelo && Array.isArray(catalogo.produtos)) {
      const produtosModelo = catalogo.produtos.filter(p => 
        p.modelo && p.modelo.toLowerCase() === modelo.toLowerCase()
      );
      
      cores = [...new Set(
        produtosModelo.flatMap(p => p.coresDisponiveis || [])
      )];
    } else {
      // Pegar todas as cores do tipo
      if (catalogo.coresDeJaleco) {
        cores = catalogo.coresDeJaleco;
      } else if (catalogo.cores) {
        cores = catalogo.cores;
      } else if (Array.isArray(catalogo.produtos)) {
        cores = [...new Set(
          catalogo.produtos.flatMap(p => p.coresDisponiveis || [])
        )];
      }
    }
    
    return cores.filter(c => c && c !== '');
  } catch (erro) {
    console.error(`Erro ao carregar cores de ${tipoProduto}:`, erro);
    return [];
  }
}

/**
 * Carrega tamanhos disponíveis de um produto
 */
export async function carregarTamanhosProduto(tipoProduto, modelo = null) {
  try {
    const catalogoPath = path.join(
      process.cwd(), 
      'catalogos', 
      'produtos', 
      `${tipoProduto.toLowerCase()}.json`
    );
    
    const conteudo = await fs.readFile(catalogoPath, 'utf-8');
    const catalogo = JSON.parse(conteudo);
    
    let tamanhos = [];
    
    if (modelo && Array.isArray(catalogo.produtos)) {
      const produtosModelo = catalogo.produtos.filter(p => 
        p.modelo && p.modelo.toLowerCase() === modelo.toLowerCase()
      );
      
      tamanhos = [...new Set(
        produtosModelo.flatMap(p => p.tamanhos || [])
      )];
    } else if (Array.isArray(catalogo.produtos)) {
      tamanhos = [...new Set(
        catalogo.produtos.flatMap(p => p.tamanhos || [])
      )];
    }
    
    // Ordenar tamanhos corretamente
    const ordemTamanhos = ['PPP', 'PP', 'P', 'M', 'G', 'GG', 'G1', 'G2', 'G3'];
    tamanhos.sort((a, b) => {
      const indexA = ordemTamanhos.indexOf(a);
      const indexB = ordemTamanhos.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    
    return tamanhos;
  } catch (erro) {
    console.error(`Erro ao carregar tamanhos de ${tipoProduto}:`, erro);
    return [];
  }
}

/**
 * Gera lista de tipos de produtos com recomendações por profissão
 */
export async function gerarListaTiposProdutosComRecomendacao(profissao = null) {
  const tipos = await carregarTiposProdutos();
  
  if (!profissao) {
    return {
      mensagem: gerarListaEnumerada(tipos, '📦 *Que tipo de produto você está procurando?*'),
      lista: tipos
    };
  }
  
  // Buscar produtos recomendados para profissão
  try {
    const { data, error } = await supabase
      .from('profissoes_catalogo')
      .select('produtos_recomendados')
      .eq('nome', profissao.toLowerCase())
      .single();
    
    if (!error && data && data.produtos_recomendados) {
      const recomendados = data.produtos_recomendados;
      
      // Organizar lista: recomendados primeiro
      const tiposOrdenados = [
        ...tipos.filter(t => recomendados.includes(t.toLowerCase())),
        ...tipos.filter(t => !recomendados.includes(t.toLowerCase()))
      ];
      
      let mensagem = `📦 *Que tipo de produto você está procurando?*\n\n`;
      mensagem += `_✨ Recomendados para ${profissao}:_\n`;
      
      tiposOrdenados.forEach((tipo, index) => {
        const numero = index + 1;
        const emoji = obterEmojiNumero(numero);
        const estrela = recomendados.includes(tipo.toLowerCase()) ? ' ⭐' : '';
        mensagem += `${emoji} *${numero}.* ${tipo}${estrela}\n`;
      });
      
      mensagem += `\n_Você pode responder com o número ou o nome! 😊_`;
      
      return {
        mensagem,
        lista: tiposOrdenados
      };
    }
  } catch (erro) {
    console.error('Erro ao gerar lista com recomendação:', erro);
  }
  
  // Fallback sem recomendação
  return {
    mensagem: gerarListaEnumerada(tipos, '📦 *Que tipo de produto você está procurando?*'),
    lista: tipos
  };
}
