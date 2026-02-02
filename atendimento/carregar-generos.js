/**
 * Carrega gêneros disponíveis de um produto do catálogo
 */
import fs from 'fs/promises';
import path from 'path';

export async function carregarGenerosProduto(tipoProduto) {
  try {
    const catalogoPath = path.join(
      process.cwd(), 
      'catalogos', 
      'produtos', 
      `${tipoProduto.toLowerCase()}.json`
    );
    
    const conteudo = await fs.readFile(catalogoPath, 'utf-8');
    const catalogo = JSON.parse(conteudo);
    
    if (!catalogo.produtosOriginais || catalogo.produtosOriginais.length === 0) {
      // Fallback para gêneros padrão
      return ['Masculino', 'Feminino', 'Unissex'];
    }
    
    // Extrair gêneros únicos dos produtos
    const generos = [...new Set(
      catalogo.produtosOriginais
        .map(p => p.sexo)
        .filter(s => s && s !== 'null' && s !== '')
    )];
    
    // Ordenar: Feminino, Masculino, Unissex
    const ordem = { 'Feminino': 1, 'Masculino': 2, 'Unissex': 3 };
    return generos.sort((a, b) => (ordem[a] || 99) - (ordem[b] || 99));
    
  } catch (erro) {
    console.error(`Erro ao carregar gêneros de ${tipoProduto}:`, erro.message);
    // Fallback para gêneros padrão
    return ['Masculino', 'Feminino', 'Unissex'];
  }
}
