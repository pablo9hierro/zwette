import fs from 'fs';
import path from 'path';

/**
 * MATCH DIRETO NO CATÁLOGO - SEM DEPENDER DA IA BURRA
 * Normaliza texto e faz match direto nos arquivos JSON
 */

// Normalizar texto: remove acento, pontuação, lowercase
export function normalizar(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '') // Remove pontuação
    .trim();
}

// Carregar todos os catálogos
const CATALOGOS_DIR = path.join(process.cwd(), 'catalogos', 'produtos');
const CATALOGOS = {};

function carregarCatalogos() {
  const arquivos = fs.readdirSync(CATALOGOS_DIR);
  for (const arquivo of arquivos) {
    if (arquivo.endsWith('.json') && !arquivo.startsWith('INDICE') && !arquivo.startsWith('README') && !arquivo.startsWith('ESTATISTICAS') && !arquivo.startsWith('RESUMO')) {
      const nome = arquivo.replace('.json', '');
      const conteudo = JSON.parse(fs.readFileSync(path.join(CATALOGOS_DIR, arquivo), 'utf-8'));
      CATALOGOS[nome] = conteudo;
    }
  }
  console.log('📚 Catálogos carregados:', Object.keys(CATALOGOS).join(', '));
}

carregarCatalogos();

/**
 * Retorna catálogo de um tipo específico
 */
export function carregarCatalogoPorTipo(tipoProduto) {
  if (!tipoProduto) return null;
  return CATALOGOS[tipoProduto] || null;
}

/**
 * Match direto de tipo de produto na mensagem
 */
export function matchTipoProduto(mensagem) {
  const textoNorm = normalizar(mensagem);
  const tipos = Object.keys(CATALOGOS);
  
  // 1. Tentar match EXATO (com normalização - ignora maiúsculas, acentos, pontuação)
  for (const tipo of tipos) {
    const tipoNorm = normalizar(tipo);
    if (textoNorm === tipoNorm) {
      console.log(`✅ MATCH EXATO tipo produto: "${tipo}" (ignorou maiúsculas/acentos/pontuação)`);
      return tipo;
    }
  }
  
  // 2. Tentar match por PALAVRAS COMPOSTAS (dolma-avental → "dolma" ou "avental")
  for (const tipo of tipos) {
    const partes = tipo.split('-');
    for (const parte of partes) {
      const parteNorm = normalizar(parte);
      // Match com plural: "dolma" → "dolmas", "avental" → "aventais"
      const plural = parteNorm + 's';
      if (textoNorm === parteNorm || textoNorm === plural || textoNorm.includes(parteNorm)) {
        console.log(`✅ MATCH por PARTE: "${parte}" (ignorou maiúsculas/acentos/pontuação) → tipo: "${tipo}"`);
        return tipo;
      }
    }
  }
  
  // 3. Tentar match CONTÉM (fallback)
  for (const tipo of tipos) {
    const tipoNorm = normalizar(tipo);
    if (textoNorm.includes(tipoNorm)) {
      console.log(`✅ MATCH CONTÉM tipo produto: "${tipo}" (ignorou maiúsculas/acentos/pontuação)`);
      return tipo;
    }
  }
  
  return null;
}

/**
 * Match direto de modelo na mensagem
 * NOVA ESTRUTURA: modelos é um objeto com chaves sendo os nomes
 */
export function matchModelo(mensagem, tipoProduto) {
  if (!tipoProduto || !CATALOGOS[tipoProduto]) return null;
  
  const textoNorm = normalizar(mensagem);
  const catalogo = CATALOGOS[tipoProduto];
  
  // NOVA ESTRUTURA: pegar chaves do objeto modelos
  if (!catalogo.modelos || typeof catalogo.modelos !== 'object') {
    console.log(`⚠️ Nenhum modelo encontrado para ${tipoProduto}`);
    return null;
  }
  
  const modelos = Object.keys(catalogo.modelos);
  
  // 1. Tentar match por NÚMERO da lista enumerada
  const numeroMatch = mensagem.trim().match(/^(\d+)$/);
  if (numeroMatch) {
    const index = parseInt(numeroMatch[1]) - 1;
    if (index >= 0 && index < modelos.length) {
      console.log(`✅ MATCH por NÚMERO: ${numeroMatch[1]} → modelo: "${modelos[index]}"`);
      return modelos[index];
    }
  }
  
  // 2. Tentar match por NOME do modelo
  for (const modelo of modelos) {
    const modeloNorm = normalizar(modelo);
    if (textoNorm.includes(modeloNorm)) {
      console.log(`✅ MATCH DIRETO modelo: "${modelo}"`);
      return modelo;
    }
  }
  
  // Fallback (não deve chegar aqui se número já foi tratado)
  const numero = parseInt(mensagem.trim());
  if (!isNaN(numero) && numero > 0 && numero <= modelos.length) {
    console.log(`✅ MATCH POR NÚMERO: "${modelos[numero - 1]}"`);
    return modelos[numero - 1];
  }
  
  return null;
}

/**
 * Match direto de cor na mensagem
 * NOVA ESTRUTURA: cores dentro de cada modelo
 */
export function matchCor(mensagem, tipoProduto, modelo = null) {
  const textoNorm = normalizar(mensagem);
  
  // Se não tem tipoProduto, buscar em TODOS os catálogos (cores comuns)
  if (!tipoProduto || !CATALOGOS[tipoProduto]) {
    // Cores comuns que aparecem em todos os produtos
    const coresComuns = [
      'Azul', 'Branco', 'Preto', 'Verde', 'Rosa', 'Bege', 'Cinza', 'Vermelho',
      'Amarelo', 'Roxo', 'Chumbo', 'Bordo', 'Lilás', 'Tangerina', 'Areia',
      'Azul Marinho', 'Azul Bebê', 'Rosa Bebê', 'Rosa Pink', 'Verde Claro', 'Verde Escuro',
      'Off White', 'Estampado', 'Azul Médio'
    ];
    
    for (const cor of coresComuns) {
      const corNorm = normalizar(cor);
      if (textoNorm.includes(corNorm)) {
        console.log(`✅ MATCH cor COMUM: "${cor}" (sem tipoProduto definido)`);
        return cor;
      }
    }
    
    return null;
  }
  
  const catalogo = CATALOGOS[tipoProduto];
  
  // NOVA ESTRUTURA: buscar cores do modelo específico ou de todos
  let cores = [];
  
  if (modelo && catalogo.modelos && catalogo.modelos[modelo]) {
    // Cores específicas do modelo
    const modeloData = catalogo.modelos[modelo];
    cores = [...(modeloData.cores || []), ...(modeloData.estampas || [])];
  } else if (catalogo.modelos) {
    // Todas as cores de todos os modelos
    const todasCores = new Set();
    Object.values(catalogo.modelos).forEach(modeloData => {
      (modeloData.cores || []).forEach(cor => todasCores.add(cor));
      (modeloData.estampas || []).forEach(est => todasCores.add(est));
    });
    cores = Array.from(todasCores);
  }
  
  // 1. Tentar match por NOME da cor (ignora maiúsculas, acentos, pontuação)
  for (const cor of cores) {
    const corNorm = normalizar(cor);
    if (textoNorm.includes(corNorm)) {
      console.log(`✅ MATCH DIRETO cor: "${cor}" (ignorou maiúsculas/acentos/pontuação)`);
      return cor;
    }
  }
  
  return null;
}

/**
 * Match de gênero
 */
export function matchGenero(mensagem) {
  const textoNorm = normalizar(mensagem);
  
  if (textoNorm.includes('feminino') || textoNorm.includes('mulher') || textoNorm.includes('feminina')) {
    console.log('✅ MATCH DIRETO gênero: feminino');
    return 'feminino';
  }
  
  if (textoNorm.includes('masculino') || textoNorm.includes('homem') || textoNorm.includes('masculina')) {
    console.log('✅ MATCH DIRETO gênero: masculino');
    return 'masculino';
  }
  
  if (textoNorm.includes('unissex') || textoNorm.includes('uni sex') || textoNorm.includes('tanto faz')) {
    console.log('✅ MATCH DIRETO gênero: unissex');
    return 'unissex';
  }
  
  return null;
}

/**
 * Match de profissão (por número ou nome)
 */
export function matchProfissao(mensagem) {
  const profissoes = [
    'Biomédico',
    'Dentista',
    'Enfermeiro',
    'Esteticista',
    'Farmacêutico',
    'Fisioterapeuta',
    'Médico',
    'Nutricionista',
    'Pediatra',
    'Psicólogo',
    'Veterinário',
    'Nenhuma dessas'
  ];
  
  const textoNorm = normalizar(mensagem);
  
  // 1. Tentar match por NÚMERO (1-12)
  const numeroMatch = mensagem.trim().match(/^(\d+)$/);
  if (numeroMatch) {
    const index = parseInt(numeroMatch[1]) - 1;
    if (index >= 0 && index < profissoes.length) {
      console.log(`✅ MATCH PROFISSÃO por NÚMERO: ${numeroMatch[1]} → "${profissoes[index]}"`);
      return profissoes[index];
    }
  }
  
  // 2. Tentar match por NOME
  for (const profissao of profissoes) {
    const profissaoNorm = normalizar(profissao);
    if (textoNorm.includes(profissaoNorm)) {
      console.log(`✅ MATCH PROFISSÃO por NOME: "${profissao}"`);
      return profissao;
    }
  }
  
  return null;
}

/**
 * Obter lista de tipos de produtos
 */
export function listarTiposProdutos() {
  return Object.keys(CATALOGOS);
}

/**
 * Obter lista de modelos de um tipo
 * NOVA ESTRUTURA: modelos é um objeto com chaves sendo os nomes dos modelos
 */
export function listarModelos(tipoProduto) {
  if (!tipoProduto || !CATALOGOS[tipoProduto]) return [];
  const catalogo = CATALOGOS[tipoProduto];
  
  // NOVA ESTRUTURA: modelos é um objeto, pegar as chaves
  if (catalogo.modelos && typeof catalogo.modelos === 'object') {
    return Object.keys(catalogo.modelos);
  }
  
  return [];
}

/**
 * Listar modelos FILTRADOS por gênero e/ou cor disponível
 * @param {string} tipoProduto - Tipo do produto (jaleco, gorro, etc)
 * @param {string} genero - Filtro de gênero (masculino, feminino, unissex)
 * @param {string} cor - Filtro de cor (opcional)
 * @returns {Array<string>} Lista de modelos disponíveis
 */
export function listarModelosFiltrados(tipoProduto, genero = null, cor = null) {
  if (!tipoProduto || !CATALOGOS[tipoProduto]) return [];
  
  const catalogo = CATALOGOS[tipoProduto];
  const produtos = catalogo.produtosOriginais || [];
  
  console.log(`\n🔍 FILTRANDO MODELOS:`);
  console.log(`   Tipo: ${tipoProduto}`);
  console.log(`   Gênero: ${genero || 'qualquer'}`);
  console.log(`   Cor: ${cor || 'qualquer'}`);
  
  // Filtrar produtos que atendem aos critérios
  let produtosFiltrados = produtos;
  
  // Filtrar por gênero
  if (genero) {
    const generoNorm = normalizar(genero);
    produtosFiltrados = produtosFiltrados.filter(p => {
      const sexoNorm = normalizar(p.sexo || '');
      return sexoNorm === generoNorm || sexoNorm === 'unissex';
    });
    console.log(`   Após filtrar gênero: ${produtosFiltrados.length} produtos`);
  }
  
  // Filtrar por cor
  if (cor) {
    const corNorm = normalizar(cor);
    produtosFiltrados = produtosFiltrados.filter(p => {
      const coresDisponiveis = p.coresDisponiveis || [];
      const nomeNorm = normalizar(p.nome || '');
      const corProdutoNorm = normalizar(p.cor || '');
      
      const corNasCores = coresDisponiveis.some(c => normalizar(c).includes(corNorm));
      const corNoNome = nomeNorm.includes(corNorm);
      const corDireta = corProdutoNorm.includes(corNorm);
      
      return corNasCores || corNoNome || corDireta;
    });
    console.log(`   Após filtrar cor: ${produtosFiltrados.length} produtos`);
  }
  
  // Extrair modelos únicos dos produtos filtrados
  const modelosDisponiveis = [...new Set(
    produtosFiltrados.map(p => p.modelo || p.nome?.split(' ')[0]).filter(Boolean)
  )];
  
  console.log(`✅ Modelos disponíveis: ${modelosDisponiveis.length}`);
  console.log(`   ${modelosDisponiveis.slice(0, 10).join(', ')}${modelosDisponiveis.length > 10 ? '...' : ''}`);
  
  return modelosDisponiveis;
}

/**
 * Obter lista de cores de um tipo e modelo específico
 * NOVA ESTRUTURA: cada modelo tem suas próprias cores disponíveis
 */
export function listarCores(tipoProduto, modelo = null) {
  if (!tipoProduto || !CATALOGOS[tipoProduto]) return [];
  const catalogo = CATALOGOS[tipoProduto];
  
  // Se especificou modelo, retorna cores daquele modelo
  if (modelo && catalogo.modelos && catalogo.modelos[modelo]) {
    const modeloData = catalogo.modelos[modelo];
    const cores = modeloData.cores || [];
    const estampas = modeloData.estampas || [];
    return [...cores, ...estampas]; // Combina cores sólidas + estampas
  }
  
  // Se não especificou modelo, retorna todas as cores de todos os modelos
  if (catalogo.modelos && typeof catalogo.modelos === 'object') {
    const todasCores = new Set();
    Object.values(catalogo.modelos).forEach(modeloData => {
      (modeloData.cores || []).forEach(cor => todasCores.add(cor));
      (modeloData.estampas || []).forEach(est => todasCores.add(est));
    });
    return Array.from(todasCores).sort();
  }
  
  return [];
}

/**
 * Listar TODAS as cores disponíveis de um tipo de produto
 * (usado para perguntar ao cliente qual cor ele quer ver)
 */
export function listarCoresDoTipo(tipoProduto) {
  if (!tipoProduto || !CATALOGOS[tipoProduto]) return [];
  const catalogo = CATALOGOS[tipoProduto];
  
  const coresUnicas = new Set();
  
  // Percorre TODOS os produtos originais e coleta TODAS as cores
  if (catalogo.produtosOriginais && Array.isArray(catalogo.produtosOriginais)) {
    catalogo.produtosOriginais.forEach(produto => {
      // Adiciona cor do campo "cor" (se existir)
      if (produto.cor && produto.cor.trim() !== '') {
        coresUnicas.add(produto.cor.trim());
      }
      
      // Adiciona cores do campo "coresDisponiveis"
      if (produto.coresDisponiveis && Array.isArray(produto.coresDisponiveis)) {
        produto.coresDisponiveis.forEach(cor => {
          if (cor && cor.trim() !== '') {
            coresUnicas.add(cor.trim());
          }
        });
      }
    });
  }
  
  return Array.from(coresUnicas).sort();
}

/**
 * Match de confirmação (sim/não)
 */
export function matchConfirmacao(mensagem) {
  const textoNorm = normalizar(mensagem);
  const msgLower = mensagem.toLowerCase();
  
  // Detectar frustração/confirmação enfática PRIMEIRO ("ja disse que sim", "ja falei que quero")
  if (msgLower.match(/j[aá] (disse|falei|respondi) que (sim|quero|aceito|ok)/)) {
    console.log('✅ MATCH CONFIRMAÇÃO: SIM (frustração/ênfase - cliente repetindo)');
    return true;
  }
  
  // Detectar negações específicas
  if (msgLower.match(/n[aã]o (quero|escolhi|é isso|gostei|tenho|preciso)/)) {
    console.log('✅ MATCH CONFIRMAÇÃO: NÃO (negação específica)');
    return false;
  }
  
  // Palavras de confirmação (incluindo "quero" que significa "sim, quero")
  const positivos = ['sim', 'pode', 'confirmo', 'ok', 'yes', 'claro', 'certeza', 'isso', 'exato', 'vai', 'quero', 'aceito', 'beleza'];
  const negativos = ['nao', 'não', 'nunca', 'no'];
  
  for (const pos of positivos) {
    if (textoNorm.includes(pos)) {
      console.log(`✅ MATCH CONFIRMAÇÃO: SIM (palavra "${pos}" detectada)`);
      return true;
    }
  }
  
  for (const neg of negativos) {
    if (textoNorm.includes(neg)) {
      console.log('✅ MATCH CONFIRMAÇÃO: NÃO');
      return false;
    }
  }
  
  return null;
}

/**
 * Extrair nome de pessoa (heurística simples)
 */
export function extrairNome(mensagem, jaTemTipo, jaTemGenero, jaTemCor) {
  const textoNorm = mensagem.trim();
  const msgLower = textoNorm.toLowerCase();
  
  // ❌ NÃO extrair nome se mensagem contém palavras de produto/genero/cor
  const palavrasReservadas = [
    // Tipos
    'jaleco', 'scrub', 'gorro', 'gorros', 'dolma', 'avental', 'robe', 'macacao', 'infantil', 'texteis',
    // Gêneros
    'masculino', 'feminino', 'unissex', 'homem', 'mulher',
    // Cores
    'azul', 'branco', 'preto', 'verde', 'rosa', 'bege', 'cinza', 'vermelho', 'amarelo', 'roxo', 
    'chumbo', 'bordo', 'lilas', 'tangerina', 'areia', 'marinho', 'bebe', 'pink', 'claro', 'escuro',
    // Confirmações
    'sim', 'não', 'nao', 'quero', 'pode', 'aceito', 'ok', 'beleza'
  ];
  
  for (const reservada of palavrasReservadas) {
    if (msgLower.includes(reservada)) {
      console.log(`⚠️ NÃO extrai nome: mensagem contém "${reservada}"`);
      return null;
    }
  }
  
  // Se já tem tipo/genero/cor capturado, NÃO extrair nome de mensagem simples
  if (jaTemTipo || jaTemGenero || jaTemCor) {
    console.log(`⚠️ NÃO extrai nome: já tem dados capturados (tipo=${jaTemTipo}, genero=${jaTemGenero}, cor=${jaTemCor})`);
    return null;
  }
  
  // ✅ Detectar padrão "é NOME" e extrair só o NOME (sem "é")
  const nomeComE = msgLower.match(/^(?:é|e)\s+([a-záàâãéèêíïóôõöúçñ]+)$/i);
  if (nomeComE) {
    const nome = nomeComE[1].charAt(0).toUpperCase() + nomeComE[1].slice(1).toLowerCase();
    console.log(`✅ NOME EXTRAÍDO (removeu "é"): "${nome}"`);
    return nome;
  }
  
  // Se é só uma palavra e tem mais de 2 letras, provavelmente é nome
  const palavras = textoNorm.split(/\s+/);
  if (palavras.length === 1 && palavras[0].length > 2) {
    // Capitalizar primeira letra
    const nome = palavras[0].charAt(0).toUpperCase() + palavras[0].slice(1).toLowerCase();
    console.log(`✅ NOME EXTRAÍDO: "${nome}"`);
    return nome;
  }
  
  // Se tem 2 palavras, provavelmente é nome completo
  if (palavras.length === 2) {
    const nome = palavras.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    console.log(`✅ NOME EXTRAÍDO: "${nome}"`);
    return nome;
  }
  
  return null;
}

/**
 * BUSCA DIRETA NO CATÁLOGO (case-insensitive)
 * NOVA ESTRUTURA: usa produtosOriginais
 */
export function buscarProdutosDireto(tipoProduto, modelo, cor, genero) {
  console.log(`\n🔍 BUSCA DIRETA NO CATÁLOGO (NOVA ESTRUTURA):`);
  console.log(`   Tipo: ${tipoProduto}`);
  console.log(`   Modelo: ${modelo}`);
  console.log(`   Cor: ${cor || 'qualquer'}`);
  console.log(`   Gênero: ${genero}`);
  
  if (!tipoProduto || !CATALOGOS[tipoProduto]) {
    console.log('❌ Tipo de produto não encontrado');
    return [];
  }
  
  const catalogo = CATALOGOS[tipoProduto];
  let produtos = catalogo.produtosOriginais || [];
  
  console.log(`📚 Total de produtos no catálogo: ${produtos.length}`);
  
  // FILTRO 0: Separar "Dolma" vs "Avental" (tipo dolma-avental tem os 2 misturados)
  if (tipoProduto === 'dolma-avental') {
    // Se o modelo indica claramente qual subtipo é:
    // "Masculina/Feminina" = Dolma (produto de vestir)
    // "Linho/Vintage/Gabardine" = Avental (proteção)
    const modeloNorm = normalizar(modelo || '');
    
    if (modeloNorm === 'masculina' || modeloNorm === 'feminina') {
      // Cliente quer DOLMA
      produtos = produtos.filter(p => {
        const nomeNorm = normalizar(p.nome || '');
        return nomeNorm.includes('dolma') || nomeNorm.includes('dólmã');
      });
      console.log(`  🎯 Filtrado por DOLMA (não Avental): ${produtos.length} produtos`);
    } else if (modeloNorm === 'linho' || modeloNorm === 'vintage' || modeloNorm === 'gabardine') {
      // Cliente quer AVENTAL
      produtos = produtos.filter(p => {
        const nomeNorm = normalizar(p.nome || '');
        return nomeNorm.includes('avental');
      });
      console.log(`  🎯 Filtrado por AVENTAL (não Dolma): ${produtos.length} produtos`);
    }
  }
  
  // FILTRO 1: Gênero (case-insensitive)
  if (genero) {
    const generoNorm = normalizar(genero);
    const generoParaFiltro = generoNorm === 'masculino' ? 'masculino' : 
                             generoNorm === 'feminino' ? 'feminino' : 'unissex';
    
    produtos = produtos.filter(p => {
      const sexoNorm = normalizar(p.sexo || '');
      // Unissex serve para qualquer gênero
      if (sexoNorm === 'unissex') return true;
      // Match direto
      return sexoNorm === generoParaFiltro;
    });
    console.log(`  ✅ Após filtrar por gênero "${genero}": ${produtos.length} produtos`);
    
    if (produtos.length === 0) {
      console.log(`  ⚠️ NENHUM produto encontrado com gênero "${genero}"!`);
    }
  }
  
  // FILTRO 2: Modelo (case-insensitive, sem acentos)
  if (modelo) {
    const modeloNorm = normalizar(modelo);
    produtos = produtos.filter(p => {
      const nomeNorm = normalizar(p.nome || '');
      const modeloProdutoNorm = normalizar(p.modelo || '');
      return nomeNorm.includes(modeloNorm) || modeloProdutoNorm.includes(modeloNorm);
    });
    console.log(`  Após filtrar por modelo: ${produtos.length} produtos`);
  }
  
  // FILTRO 3: Cor (com tratamento especial para ESTAMPADOS)
  if (cor) {
    const corNorm = normalizar(cor);
    const buscandoEstampado = corNorm.includes('estampa') || corNorm.includes('estampado');
    
    produtos = produtos.filter(p => {
      const coresDisponiveis = p.coresDisponiveis || [];
      const nomeNorm = normalizar(p.nome || '');
      const corProdutoNorm = normalizar(p.cor || '');
      const semCor = !p.cor || p.cor.trim() === '';
      
      // Se cliente busca "estampado" → retornar produtos estampados
      if (buscandoEstampado) {
        // Produto é estampado se: coresDisponiveis tem "Estampado" OU nome tem "estampa"
        const temEstampadoDisponivel = coresDisponiveis.some(c => normalizar(c).includes('estampa'));
        if (temEstampadoDisponivel) return true;
        if (nomeNorm.includes('estampa')) return true;
        return false;
      }
      
      // Se cliente busca COR ESPECÍFICA (azul, branco, areia escura, etc):
      
      // 1. Match EXATO no campo cor (quando preenchido)
      if (!semCor && corProdutoNorm === corNorm) return true;
      
      // 2. Match parcial no campo cor para cores compostas - TODAS palavras devem estar
      const palavrasCor = corNorm.split(/\s+/);
      if (!semCor && palavrasCor.length > 1) {
        const corProdutoTemTodasPalavras = palavrasCor.every(palavra => corProdutoNorm.includes(palavra));
        if (corProdutoTemTodasPalavras) return true;
      }
      
      // 3. Match no NOME do produto (para produtos onde a cor está no nome, não no campo)
      // Exemplo: "Avental Linho Areia Escura Regulavel" tem cor="" mas cor está no nome
      const nomeTemTodasPalavras = palavrasCor.every(palavra => nomeNorm.includes(palavra));
      
      return nomeTemTodasPalavras;
    });
    
    if (buscandoEstampado) {
      console.log(`  ✅ Após filtrar por ESTAMPADOS: ${produtos.length} produtos`);
    } else {
      console.log(`  ✅ Após filtrar por cor "${cor}" (ignorando estampados): ${produtos.length} produtos`);
    }
    
    if (produtos.length === 0) {
      console.log(`  ⚠️ NENHUM produto encontrado com cor "${cor}"!`);
    }
  }
  
  console.log(`✅ Produtos finais encontrados: ${produtos.length}`);
  
  return produtos;
}
