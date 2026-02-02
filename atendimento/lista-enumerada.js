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
  
  // Função auxiliar: normalizar texto (remover hífens, acentos, espaços extras)
  const normalizar = (texto) => {
    return texto
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[-_\s]+/g, ' ') // Substitui hífens, underscores e múltiplos espaços por 1 espaço
      .trim();
  };
  
  const mensagemNormalizada = normalizar(mensagem);
  
  // Ordenar lista por tamanho (maiores primeiro) para priorizar matches compostos
  const listaOrdenada = [...lista].sort((a, b) => b.length - a.length);
  
  // 1. Tentar match exato primeiro
  for (const item of listaOrdenada) {
    if (item.toLowerCase() === mensagemLower) {
      return item;
    }
  }
  
  // 2. Tentar match exato normalizado (sem hífens/acentos)
  for (const item of listaOrdenada) {
    if (normalizar(item) === mensagemNormalizada) {
      return item;
    }
  }
  
  // 3. Tentar match de palavra completa
  for (const item of listaOrdenada) {
    const regex = new RegExp(`\\b${item.toLowerCase()}\\b`, 'i');
    if (regex.test(mensagemLower)) {
      return item;
    }
  }
  
  // 4. Match com primeira palavra (ex: "dolma" matches "Dolma-avental")
  for (const item of listaOrdenada) {
    const primeiraPalavra = normalizar(item).split(' ')[0];
    const primeiraPalavraMensagem = mensagemNormalizada.split(' ')[0];
    
    if (primeiraPalavra === primeiraPalavraMensagem && primeiraPalavra.length >= 4) {
      return item;
    }
  }
  
  // 5. Fallback: match parcial normalizado (itens maiores/compostos primeiro)
  for (const item of listaOrdenada) {
    const itemNormalizado = normalizar(item);
    if (itemNormalizado.includes(mensagemNormalizada) || 
        mensagemNormalizada.includes(itemNormalizado)) {
      return item;
    }
  }
  
  // 6. Última tentativa: match parcial original (sem normalização)
  for (const item of listaOrdenada) {
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
 * Limpa nome de cor removendo informações redundantes
 * Exemplos:
 * - "Crachá Magnético Dourado" → "Dourado"
 * - "Linho Açafrão Regulável" → "Açafrão"
 * - "Cinza Chumbo Regulável" → "Cinza Chumbo"
 */
/**
 * Normaliza string removendo acentos, pontuação e convertendo para lowercase
 * @param {string} texto - Texto a normalizar
 * @returns {string} Texto normalizado
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
 * Valida se uma string é realmente uma cor válida
 * Descarta nomes de produtos que foram erroneamente categorizados como cores
 * @param {string} cor - Nome da cor a validar
 * @returns {boolean} True se é uma cor válida
 */
export function validarCor(cor) {
  if (!cor || cor.trim() === '') return false;
  
  const corLower = cor.toLowerCase().trim();
  
  // ⚠️ REGRA 1: Descartar se contém palavras suspeitas que indicam nome de produto
  const palavrasSuspeitas = [
    'estampado', 'estampa',
    'manga longa', 'manga curta', 'manga',
    'botão', 'botao', 'ziper',
    'kids', 'baby', 'bebê', 'bebe',
    'gatos', 'dogs', 'dinos', 'pet', 'fada', 'jardim', 'abc',
    'lego', 'games', 'circo', 'fazendinha', 'geometria',
    'liga da fofura', 'peças de amor', 'sweet'
  ];
  
  for (const palavra of palavrasSuspeitas) {
    if (corLower.includes(palavra)) {
      console.log(`   ⚠️ Cor inválida descartada: "${cor}" (contém "${palavra}")`);
      return false;
    }
  }
  
  // ⚠️ REGRA 2: Descartar se tem mais de 4 palavras (provavelmente é nome de produto)
  const numeroPalavras = cor.trim().split(/\s+/).length;
  if (numeroPalavras > 4) {
    console.log(`   ⚠️ Cor inválida descartada: "${cor}" (${numeroPalavras} palavras - muito longa)`);
    return false;
  }
  
  // ⚠️ REGRA 3: Descartar se contém números ou caracteres especiais suspeitos
  if (/\d/.test(cor) && !/(gr|g\d+|p|m|pp)/i.test(cor)) {
    // Permitir números em tamanhos (G1, G2, PP, etc) mas bloquear outros números
    console.log(`   ⚠️ Cor inválida descartada: "${cor}" (contém números suspeitos)`);
    return false;
  }
  
  return true;
}

/**
 * Limpa nome de cor removendo informações redundantes
 */
function limparNomeCor(nomeCor, tipoProduto) {
  if (!nomeCor) return nomeCor;
  
  let corLimpa = nomeCor;
  
  // Lista completa de palavras a remover (em ordem de prioridade)
  const palavrasRemover = [
    // Nome do produto (detectado dinamicamente)
    tipoProduto,
    // Variações de produtos
    'Magnético', 'Magnética',
    'Jaleco', 'Scrub', 'Avental', 'Touca', 'Gorro', 
    'Turbante', 'Dolma', 'Vestido', 'Robe', 'Macacão',
    'Crachá', 'Cracha',
    // Gêneros
    'Feminino', 'Masculino', 'Unissex',
    // Modelos comuns
    'Manuela', 'Marta', 'Isabel', 'Heloisa', 'Rute', 'Dani', 'Lis', 'Chloe',
    'Clara', 'Clinic', 'Kids',
    // Tipos de estampas
    'Estampado', 'Estampa',
    // Palavras redundantes
    'Regulável', 'Regulavel', 'Ajustável', 'Ajustavel',
    'Manga Longa', 'Manga Curta', 'Manga',
    'Longo', 'Curto', 'Longa', 'Curta',
    'Botão', 'Ziper', 'Detalhes',
    'Linho', 'Tecido', 'Tec', 'Easy'
  ];
  
  // Remover todas as palavras (múltiplas passadas para pegar tudo)
  for (let i = 0; i < 3; i++) { // Até 3 passadas para garantir
    for (const palavra of palavrasRemover) {
      // Remover do início
      const regexInicio = new RegExp(`^${palavra}\\s+`, 'gi');
      corLimpa = corLimpa.replace(regexInicio, '');
      
      // Remover do meio/fim
      const regexMeio = new RegExp(`\\s+${palavra}\\s+`, 'gi');
      corLimpa = corLimpa.replace(regexMeio, ' ');
      
      // Remover do fim
      const regexFim = new RegExp(`\\s+${palavra}$`, 'gi');
      corLimpa = corLimpa.replace(regexFim, '');
    }
    
    // Limpar espaços extras após cada passada
    corLimpa = corLimpa.trim().replace(/\s+/g, ' ');
  }
  
  return corLimpa;
}

/**
 * Carrega cores disponíveis de um produto
 * @param {string} tipoProduto - Tipo do produto (jaleco, scrub, etc)
 * @param {string} modelo - Modelo específico (opcional)
 * @param {string} genero - Gênero para filtrar cores (opcional)
 */
export async function carregarCoresProduto(tipoProduto, modelo = null, genero = null) {
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
    
    // Filtrar produtos por gênero e modelo
    let produtosFiltrados = catalogo.produtosOriginais || [];
    
    // Filtrar por gênero (PRIORITÁRIO)
    // ⚠️ IMPORTANTE: "Unissex" é compatível com TODOS os gêneros
    if (genero && Array.isArray(produtosFiltrados)) {
      produtosFiltrados = produtosFiltrados.filter(p => {
        if (!p.sexo) return false; // Se não tem sexo, exclui
        
        const sexoProduto = p.sexo.toLowerCase();
        const generoSolicitado = genero.toLowerCase();
        
        // Unissex aceita qualquer gênero
        if (sexoProduto === 'unissex') return true;
        
        // Match exato
        return sexoProduto === generoSolicitado;
      });
      console.log(`⚡ Cores filtradas por gênero "${genero}": ${produtosFiltrados.length} produtos (incluindo unissex)`);
    }
    
    // Se especificou modelo, filtrar por modelo
    if (modelo && Array.isArray(produtosFiltrados)) {
      produtosFiltrados = produtosFiltrados.filter(p => 
        p.modelo && p.modelo.toLowerCase() === modelo.toLowerCase()
      );
    }
    
    // Extrair cores únicas dos produtos filtrados
    // ⚠️ CRÍTICO: Pegar TODAS as cores disponíveis (não só a primeira)
    if (produtosFiltrados.length > 0) {
      const todasCores = [];
      produtosFiltrados.forEach(p => {
        if (p.coresDisponiveis && Array.isArray(p.coresDisponiveis)) {
          todasCores.push(...p.coresDisponiveis);
        }
      });
      cores = [...new Set(todasCores)]; // Remove duplicatas
    } else if (!genero) {
      // Se NÃO especificou gênero, tentar pegar do catálogo geral
      if (catalogo.coresDeJaleco) {
        cores = catalogo.coresDeJaleco;
      } else if (catalogo.cores) {
        cores = catalogo.cores;
      } else if (Array.isArray(catalogo.produtosOriginais)) {
        const todasCores = [];
        catalogo.produtosOriginais.forEach(p => {
          if (p.coresDisponiveis && Array.isArray(p.coresDisponiveis)) {
            todasCores.push(...p.coresDisponiveis);
          }
        });
        cores = [...new Set(todasCores)]; // Remove duplicatas
      }
    }
    
    // ⚠️ IMPORTANTE: NUNCA retornar lista genérica
    // Sistema deve oferecer APENAS cores que realmente existem no catálogo
    if (cores.length === 0) {
      console.log(`⚠️ Nenhuma cor encontrada para ${tipoProduto} ${genero || ''} - retornando lista vazia`);
      console.log(`   → Sistema NÃO deve sugerir cores inexistentes`);
    }
    
    // Limpar nomes de cores (remover redundâncias)
    const coresLimpas = cores
      .map(cor => limparNomeCor(cor, tipoProduto))
      .filter(c => c && c !== '')
      .filter(cor => validarCor(cor)); // ⚠️ Validar se é realmente uma cor
    
    // ⚠️ CRÍTICO: Remover duplicatas após normalizar (Bordô = Bordo = bordo)
    const coresUnicas = [];
    const coresNormalizadas = new Set();
    
    for (const cor of coresLimpas) {
      const corNormalizada = normalizarTexto(cor);
      if (!coresNormalizadas.has(corNormalizada)) {
        coresNormalizadas.add(corNormalizada);
        coresUnicas.push(cor); // Mantém a primeira versão encontrada
      }
    }
    
    console.log(`   → 🎨 Cores disponíveis REAIS para ${tipoProduto} ${genero || ''}: ${coresUnicas.length}`);
    if (coresUnicas.length > 0) {
      console.log(`   → Primeiras 5 cores: ${coresUnicas.slice(0, 5).join(', ')}`);
    }
    
    return coresUnicas;
  } catch (erro) {
    console.error(`Erro ao carregar cores de ${tipoProduto}:`, erro.message);
    
    // ⚠️ IMPORTANTE: NUNCA retornar lista genérica em caso de erro
    // Sistema deve falhar graciosamente ao invés de sugerir cores inexistentes
    console.log(`⚠️ Retornando lista vazia devido a erro - sistema NÃO deve inventar cores`);
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
