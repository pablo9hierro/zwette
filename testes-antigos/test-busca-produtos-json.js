import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * Script para testar busca de produtos do masculino.json no Magazord
 * Este script lê produtos reais do JSON e tenta encontrá-los no estoque
 */

const MAGAZORD_CONFIG = {
    baseURL: process.env.MAGAZORD_URL,
    auth: {
        username: process.env.MAGAZORD_USER,
        password: process.env.MAGAZORD_PASSWORD
    },
    headers: {
        'Content-Type': 'application/json'
    }
};

/**
 * Carrega os produtos do masculino.json
 */
function carregarProdutosJSON(caminhoArquivo) {
    try {
        const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
        const produtos = JSON.parse(conteudo);
        console.log(`✅ Carregados ${produtos.length || Object.keys(produtos).length} produtos do JSON`);
        return Array.isArray(produtos) ? produtos : [produtos];
    } catch (error) {
        console.error('❌ Erro ao carregar masculino.json:', error.message);
        console.log('📝 Por favor, forneça o caminho correto para masculino.json');
        return null;
    }
}

/**
 * Extrai termos de busca do produto JSON
 */
function extrairTermosBusca(produto) {
    const termos = [];
    
    // Nome completo
    if (produto.nome) termos.push(produto.nome);
    if (produto.name) termos.push(produto.name);
    if (produto.title) termos.push(produto.title);
    if (produto.titulo) termos.push(produto.titulo);
    
    // Termos da descrição
    if (produto.descricao) termos.push(produto.descricao);
    if (produto.description) termos.push(produto.description);
    
    // Categoria/Tipo
    if (produto.categoria) termos.push(produto.categoria);
    if (produto.tipo) termos.push(produto.tipo);
    if (produto.category) termos.push(produto.category);
    
    return termos.filter(Boolean);
}

/**
 * Busca produto no Magazord usando diferentes estratégias
 */
async function buscarProdutoMagazord(produtoJSON) {
    const termos = extrairTermosBusca(produtoJSON);
    const resultados = {
        produtoOriginal: produtoJSON,
        encontrado: false,
        matches: [],
        tentativas: []
    };
    
    // Estratégia 1: Busca por nome exato
    if (termos[0]) {
        try {
            const response = await axios.get(
                `/v2/site/produto?nome=${encodeURIComponent(termos[0])}&limit=10`,
                MAGAZORD_CONFIG
            );
            const items = response.data?.data?.items || [];
            resultados.tentativas.push({
                estrategia: 'Nome Exato',
                termo: termos[0],
                resultados: items.length
            });
            
            if (items.length > 0) {
                resultados.encontrado = true;
                resultados.matches.push(...items);
            }
        } catch (error) {
            resultados.tentativas.push({
                estrategia: 'Nome Exato',
                termo: termos[0],
                erro: error.message
            });
        }
    }
    
    // Estratégia 2: Busca por palavras-chave (se não encontrou ainda)
    if (!resultados.encontrado && termos[0]) {
        const palavrasChave = termos[0]
            .split(' ')
            .filter(p => p.length > 3)
            .slice(0, 3) // Pega as 3 primeiras palavras significativas
            .join(' ');
        
        if (palavrasChave) {
            try {
                const response = await axios.get(
                    `/v2/site/produto?busca=${encodeURIComponent(palavrasChave)}&limit=10`,
                    MAGAZORD_CONFIG
                );
                const items = response.data?.data?.items || [];
                resultados.tentativas.push({
                    estrategia: 'Palavras-chave',
                    termo: palavrasChave,
                    resultados: items.length
                });
                
                if (items.length > 0) {
                    resultados.encontrado = true;
                    resultados.matches.push(...items);
                }
            } catch (error) {
                resultados.tentativas.push({
                    estrategia: 'Palavras-chave',
                    termo: palavrasChave,
                    erro: error.message
                });
            }
        }
    }
    
    // Estratégia 3: Busca por categoria/tipo
    if (!resultados.encontrado && produtoJSON.categoria) {
        try {
            const response = await axios.get(
                `/v2/site/produto?categoria=${encodeURIComponent(produtoJSON.categoria)}&limit=10`,
                MAGAZORD_CONFIG
            );
            const items = response.data?.data?.items || [];
            resultados.tentativas.push({
                estrategia: 'Categoria',
                termo: produtoJSON.categoria,
                resultados: items.length
            });
            
            if (items.length > 0) {
                resultados.encontrado = true;
                resultados.matches.push(...items);
            }
        } catch (error) {
            resultados.tentativas.push({
                estrategia: 'Categoria',
                termo: produtoJSON.categoria,
                erro: error.message
            });
        }
    }
    
    // Remove duplicatas
    const uniqueMatches = [];
    const ids = new Set();
    for (const match of resultados.matches) {
        if (!ids.has(match.id)) {
            ids.add(match.id);
            uniqueMatches.push(match);
        }
    }
    resultados.matches = uniqueMatches;
    
    return resultados;
}

/**
 * Verifica disponibilidade e cores de um produto
 */
function analisarDisponibilidade(produtoMagazord) {
    const info = {
        disponivel: false,
        estoque: 0,
        cores: [],
        tamanhos: [],
        variacoes: []
    };
    
    // Verifica disponibilidade geral
    info.disponivel = produtoMagazord.disponivel || produtoMagazord.estoque > 0 || false;
    info.estoque = produtoMagazord.estoque || 0;
    
    // Analisa variações (cores, tamanhos)
    if (produtoMagazord.variacoes && Array.isArray(produtoMagazord.variacoes)) {
        produtoMagazord.variacoes.forEach(variacao => {
            info.variacoes.push({
                cor: variacao.cor || variacao.color || null,
                tamanho: variacao.tamanho || variacao.size || null,
                estoque: variacao.estoque || 0,
                disponivel: variacao.disponivel || variacao.estoque > 0
            });
            
            if (variacao.cor) info.cores.push(variacao.cor);
            if (variacao.tamanho) info.tamanhos.push(variacao.tamanho);
        });
    }
    
    // Remove duplicatas
    info.cores = [...new Set(info.cores)];
    info.tamanhos = [...new Set(info.tamanhos)];
    
    return info;
}

/**
 * Exibe relatório detalhado de um resultado
 */
function exibirRelatorio(resultado, indice) {
    console.log('\n' + '═'.repeat(80));
    console.log(`PRODUTO ${indice + 1} DO JSON:`);
    console.log('═'.repeat(80));
    
    // Info do JSON
    const termos = extrairTermosBusca(resultado.produtoOriginal);
    console.log(`\n📦 Dados do JSON:`);
    console.log(`   Nome: ${termos[0] || 'N/A'}`);
    if (resultado.produtoOriginal.cor) console.log(`   Cor: ${resultado.produtoOriginal.cor}`);
    if (resultado.produtoOriginal.preco) console.log(`   Preço: ${resultado.produtoOriginal.preco}`);
    
    // Tentativas de busca
    console.log(`\n🔍 Tentativas de Busca:`);
    resultado.tentativas.forEach((tent, idx) => {
        console.log(`   ${idx + 1}. ${tent.estrategia}: "${tent.termo}"`);
        if (tent.erro) {
            console.log(`      ❌ Erro: ${tent.erro}`);
        } else {
            console.log(`      ✅ ${tent.resultados} resultado(s)`);
        }
    });
    
    // Resultados
    if (resultado.encontrado && resultado.matches.length > 0) {
        console.log(`\n✅ ENCONTRADO! ${resultado.matches.length} match(es) no Magazord:`);
        
        resultado.matches.slice(0, 3).forEach((prod, idx) => {
            console.log(`\n   Match ${idx + 1}:`);
            console.log(`   ├─ Nome: ${prod.nome || prod.title || 'N/A'}`);
            console.log(`   ├─ ID: ${prod.id}`);
            console.log(`   ├─ SKU: ${prod.sku || 'N/A'}`);
            console.log(`   ├─ Preço: R$ ${prod.preco || prod.price || 'N/A'}`);
            
            const disponibilidade = analisarDisponibilidade(prod);
            console.log(`   ├─ Disponível: ${disponibilidade.disponivel ? '✅ SIM' : '❌ NÃO'}`);
            console.log(`   ├─ Estoque: ${disponibilidade.estoque} unid.`);
            
            if (disponibilidade.cores.length > 0) {
                console.log(`   ├─ Cores Disponíveis: ${disponibilidade.cores.join(', ')}`);
            }
            
            if (disponibilidade.tamanhos.length > 0) {
                console.log(`   ├─ Tamanhos: ${disponibilidade.tamanhos.join(', ')}`);
            }
            
            if (disponibilidade.variacoes.length > 0) {
                console.log(`   └─ Variações:`);
                disponibilidade.variacoes.slice(0, 5).forEach(v => {
                    const label = [v.cor, v.tamanho].filter(Boolean).join(' - ');
                    const status = v.disponivel ? '✅' : '❌';
                    console.log(`      ${status} ${label}: ${v.estoque} unid.`);
                });
            }
        });
    } else {
        console.log(`\n❌ NÃO ENCONTRADO no Magazord`);
    }
}

/**
 * Função principal
 */
async function executarTestes() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║            TESTE: BUSCA DE PRODUTOS DO masculino.json NO MAGAZORD            ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    
    // Tenta carregar masculino.json de locais comuns
    const caminhosPossiveis = [
        'c:\\Users\\pablo\\OneDrive\\Documentos\\scraper\\output\\masculino.json',
        './masculino.json',
        '../scraper/output/masculino.json',
        './scraper/output/masculino.json',
    ];
    
    let produtos = null;
    let caminhoUsado = null;
    
    for (const caminho of caminhosPossiveis) {
        if (fs.existsSync(caminho)) {
            produtos = carregarProdutosJSON(caminho);
            caminhoUsado = caminho;
            if (produtos) break;
        }
    }
    
    if (!produtos) {
        console.log('\n❌ Não foi possível encontrar masculino.json');
        console.log('\n📝 Crie o arquivo ou forneça o caminho correto.');
        console.log('\n💡 Caminhos testados:');
        caminhosPossiveis.forEach(c => console.log(`   - ${c}`));
        
        // Testa com dados de exemplo
        console.log('\n\n🧪 Executando teste com dados de EXEMPLO:');
        produtos = [
            { nome: "Jaleco Masculino Branco", cor: "Branco", categoria: "Jaleco" },
            { nome: "Scrub Cirúrgico Azul", cor: "Azul", categoria: "Scrub" },
            { nome: "Conjunto Médico Premium", cor: "Verde", categoria: "Conjunto" }
        ];
    } else {
        console.log(`\n✅ Usando arquivo: ${caminhoUsado}\n`);
    }
    
    // Limita a 5 produtos para teste
    const produtosParaTestar = Array.isArray(produtos) ? produtos.slice(0, 5) : [produtos];
    
    console.log(`\n🎯 Testando ${produtosParaTestar.length} produto(s)...\n`);
    
    const resultados = [];
    
    for (let i = 0; i < produtosParaTestar.length; i++) {
        const produto = produtosParaTestar[i];
        console.log(`\n⏳ Buscando produto ${i + 1}/${produtosParaTestar.length}...`);
        
        const resultado = await buscarProdutoMagazord(produto);
        resultados.push(resultado);
        
        // Aguarda um pouco entre requisições para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Exibe relatório completo
    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                              RELATÓRIO FINAL                                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    
    resultados.forEach((resultado, idx) => {
        exibirRelatorio(resultado, idx);
    });
    
    // Sumário
    const encontrados = resultados.filter(r => r.encontrado).length;
    const naoEncontrados = resultados.length - encontrados;
    
    console.log('\n\n');
    console.log('═'.repeat(80));
    console.log('📊 SUMÁRIO:');
    console.log('═'.repeat(80));
    console.log(`   Total de produtos testados: ${resultados.length}`);
    console.log(`   ✅ Encontrados no Magazord: ${encontrados} (${(encontrados/resultados.length*100).toFixed(1)}%)`);
    console.log(`   ❌ Não encontrados: ${naoEncontrados} (${(naoEncontrados/resultados.length*100).toFixed(1)}%)`);
    console.log('═'.repeat(80));
    
    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                            TESTES CONCLUÍDOS!                                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n');
}

// Executar
executarTestes().catch(console.error);
