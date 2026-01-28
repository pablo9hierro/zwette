import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Módulo de Busca e Formatação de Produtos
 * Realiza busca precisa no catálogo e formata resultados estruturados
 */

/**
 * Busca produtos no catálogo baseado no payload
 * @param {Object} payload - Payload de busca construído
 * @param {number} limite - Número máximo de resultados
 * @returns {Promise<Array>} Array de produtos encontrados
 */
export async function buscarProdutos(payload, limite = 4) {
  try {
    // Determinar qual catálogo carregar baseado no gênero
    const catalogo = await carregarCatalogo(payload.filtros.genero);
    
    if (!catalogo || catalogo.length === 0) {
      console.log('Catálogo vazio ou não encontrado');
      return [];
    }

    console.log(`Catálogo carregado: ${catalogo.length} produtos`);
    console.log('Filtros de busca:', payload.filtros);

    // Filtrar produtos
    let produtosFiltrados = catalogo.filter(produto => {
      return verificarCorrespondencia(produto, payload.filtros);
    });

    console.log(`Produtos após filtro: ${produtosFiltrados.length}`);

    // NÃO fazer busca flexível se solicitou cor específica e não achou
    // Melhor retornar vazio e avisar que não tem naquela cor
    if (produtosFiltrados.length === 0 && payload.filtros.cor) {
      console.log(`❌ Nenhum produto encontrado na cor "${payload.filtros.cor}"`);
      return []; // Retorna vazio para mostrar mensagem "não encontrado"
    }

    // Se não encontrou com todos os filtros E não tem cor específica, tentar busca mais flexível
    if (produtosFiltrados.length === 0) {
      produtosFiltrados = buscarFlexivel(catalogo, payload.filtros);
      console.log(`Produtos com busca flexível: ${produtosFiltrados.length}`);
    }

    // Ordenar por relevância
    produtosFiltrados = ordenarPorRelevancia(produtosFiltrados, payload);

    // Limitar resultados
    return produtosFiltrados.slice(0, limite);

  } catch (erro) {
    console.error('Erro ao buscar produtos:', erro);
    return [];
  }
}

/**
 * Carrega o catálogo apropriado baseado no gênero
 * @param {string} genero
 * @returns {Promise<Array>}
 */
async function carregarCatalogo(genero) {
  try {
    const catalogoPath = path.join(__dirname, '..', 'catalogos', `${genero}.json`);
    
    if (!fs.existsSync(catalogoPath)) {
      console.log(`Catálogo não encontrado: ${catalogoPath}`);
      return [];
    }

    const dados = fs.readFileSync(catalogoPath, 'utf-8');
    return JSON.parse(dados);
  } catch (erro) {
    console.error('Erro ao carregar catálogo:', erro);
    return [];
  }
}

/**
 * Verifica se um produto corresponde aos filtros
 * @param {Object} produto
 * @param {Object} filtros
 * @returns {boolean}
 */
function verificarCorrespondencia(produto, filtros) {
  const nomeCompleto = (produto.nome + ' ' + produto.nomeCompleto + ' ' + (produto.descricao || '')).toLowerCase();
  
  // Verificar tipo (jaleco, scrub, etc)
  if (filtros.tipo) {
    const tipoMatch = nomeCompleto.includes(filtros.tipo.toLowerCase());
    if (!tipoMatch) return false;
  }

  // Verificar cor - RIGOROSO
  if (filtros.cor) {
    const cores = Array.isArray(filtros.cor) ? filtros.cor : [filtros.cor];
    const corMatch = cores.some(cor => {
      const corLower = cor.toLowerCase();
      // Verificar se o nome do produto contém a cor EXATA
      // Para rosa: deve ter "rosa" no nome
      // Para azul: deve ter "azul"
      return nomeCompleto.includes(corLower);
    });
    
    if (!corMatch) {
      console.log(`❌ Produto "${produto.nome}" NÃO tem cor "${filtros.cor}"`);
      return false;
    }
  }

  // Verificar manga - CRÍTICO: ser preciso aqui
  if (filtros.manga) {
    if (filtros.manga === 'curta') {
      // Se pediu manga curta, NÃO pode ter "manga longa" no nome
      if (nomeCompleto.includes('manga longa')) {
        return false;
      }
      // E DEVE ter "manga curta" no nome
      if (!nomeCompleto.includes('manga curta')) {
        return false;
      }
    } else if (filtros.manga === 'longa') {
      // Se pediu manga longa, DEVE ter "manga longa"
      if (!nomeCompleto.includes('manga longa')) {
        return false;
      }
    }
  }

  // Verificar tamanho disponível
  if (filtros.tamanho && produto.tamanhos) {
    const tamanhoDisponivel = produto.tamanhos.includes(filtros.tamanho.toUpperCase());
    if (!tamanhoDisponivel) return false;
  }

  // Verificar estilo
  if (filtros.estilo) {
    const estilos = Array.isArray(filtros.estilo) ? filtros.estilo : [filtros.estilo];
    const estiloMatch = estilos.some(estilo => nomeCompleto.includes(estilo.toLowerCase()));
    if (!estiloMatch) return false;
  }

  return true;
}

/**
 * Busca mais flexível quando não encontra resultados exatos
 * @param {Array} catalogo
 * @param {Object} filtros
 * @returns {Array}
 */
function buscarFlexivel(catalogo, filtros) {
  return catalogo.filter(produto => {
    const nomeCompleto = (produto.nome + ' ' + produto.nomeCompleto).toLowerCase();
    
    let pontos = 0;
    
    // Tipo e gênero são obrigatórios mesmo na busca flexível
    if (filtros.tipo && nomeCompleto.includes(filtros.tipo.toLowerCase())) {
      pontos += 10;
    } else {
      return false; // Tipo é obrigatório
    }

    // Outros filtros são opcionais
    if (filtros.cor) {
      const cores = Array.isArray(filtros.cor) ? filtros.cor : [filtros.cor];
      if (cores.some(cor => nomeCompleto.includes(cor.toLowerCase()))) {
        pontos += 5;
      }
    }

    if (filtros.manga) {
      if (filtros.manga === 'curta' && nomeCompleto.includes('manga curta')) {
        pontos += 5;
      } else if (filtros.manga === 'longa' && nomeCompleto.includes('manga longa')) {
        pontos += 5;
      }
    }

    return pontos >= 10; // Mínimo de pontos para ser incluído
  });
}

/**
 * Ordena produtos por relevância
 * @param {Array} produtos
 * @param {Object} payload
 * @returns {Array}
 */
function ordenarPorRelevancia(produtos, payload) {
  return produtos.sort((a, b) => {
    const scoreA = calcularScore(a, payload);
    const scoreB = calcularScore(b, payload);
    return scoreB - scoreA;
  });
}

/**
 * Calcula score de relevância de um produto
 * @param {Object} produto
 * @param {Object} payload
 * @returns {number}
 */
function calcularScore(produto, payload) {
  let score = 0;
  const nomeCompleto = (produto.nome + ' ' + produto.nomeCompleto + ' ' + (produto.descricao || '')).toLowerCase();

  // Correspondência exata de palavras-chave
  payload.palavrasChave.forEach(palavra => {
    if (nomeCompleto.includes(palavra.toLowerCase())) {
      score += 10;
    }
  });

  // Prioridades
  payload.prioridade.forEach(prioridade => {
    if (nomeCompleto.includes(prioridade.toLowerCase())) {
      score += 5;
    }
  });

  // Preferir produtos com descrição
  if (produto.descricao) {
    score += 2;
  }

  return score;
}

/**
 * Formata produtos encontrados para exibição estruturada
 * @param {Array} produtos
 * @returns {string}
 */
export function formatarResultados(produtos) {
  if (!produtos || produtos.length === 0) {
    return 'Desculpe, não encontrei produtos com essas características no momento. Posso te ajudar com outra opção?';
  }

  let mensagem = `Encontrei ${produtos.length} ${produtos.length === 1 ? 'opção disponível' : 'opções disponíveis'}:\n\n`;

  produtos.forEach((produto, index) => {
    mensagem += `${index + 1}. ✅ ${produto.nomeCompleto}\n\n`;

    if (produto.descricao) {
      mensagem += `📝 ${produto.descricao}\n\n`;
    }

    mensagem += `💰 Preço: ${produto.preco}\n\n`;

    if (produto.tamanhos && produto.tamanhos.length > 0) {
      mensagem += `📏 Tamanhos disponíveis:\n${produto.tamanhos.join(', ')}\n\n`;
    }

    mensagem += `🔗 Ver no site: ${produto.link}\n\n`;

    if (index < produtos.length - 1) {
      mensagem += '─────────────────\n\n';
    }
  });

  return mensagem;
}

/**
 * Gera mensagem quando não encontra produtos
 * @param {Object} payload
 * @returns {string}
 */
export function gerarMensagemNaoEncontrado(contexto) {
  const partes = [];
  
  if (contexto.tipo) partes.push(contexto.tipo);
  if (contexto.genero) partes.push(contexto.genero);
  if (contexto.cor) partes.push(`na cor ${contexto.cor}`);
  if (contexto.manga) partes.push(`manga ${contexto.manga}`);
  if (contexto.tamanho) partes.push(`tamanho ${contexto.tamanho}`);
  
  const descricao = partes.join(' ');
  
  return `Desculpe, não encontrei ${descricao} no catálogo. 😔

Posso te ajudar de outra forma:
• Mudar a cor?
• Outro tipo de manga?
• Ver outros tamanhos?

Qual você prefere?`;
}

/**
 * Extrai resumo dos produtos encontrados (para contexto)
 * @param {Array} produtos
 * @returns {Object}
 */
export function extrairResumoResultados(produtos) {
  if (!produtos || produtos.length === 0) {
    return { encontrados: 0, nomes: [] };
  }

  return {
    encontrados: produtos.length,
    nomes: produtos.map(p => p.nome),
    links: produtos.map(p => p.link)
  };
}
