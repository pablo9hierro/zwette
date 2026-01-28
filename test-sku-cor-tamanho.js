import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';

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

const CAMINHO_JSON = 'c:/Users/pablo/OneDrive/Documentos/scraper/output/masculino.json';

/**
 * Extrai a cor do nome do produto
 * Exemplos: "Jaleco Masculino Manoel Bege" -> "Bege"
 *           "Scrub Masculino Manga Curta Azul Marinho" -> "Azul Marinho"
 */
function extrairCorDoNome(nome) {
    if (!nome) return null;
    
    const cores = [
        'Branco', 'Preto', 'Azul Marinho', 'Azul', 'Verde', 'Vermelho',
        'Amarelo', 'Rosa', 'Cinza', 'Bege', 'Marrom', 'Roxo', 'Laranja',
        'Verde Claro', 'Azul Claro', 'Rosa Pink', 'Chumbo', 'Bordo'
    ];
    
    const nomeUpper = nome.toUpperCase();
    
    for (const cor of cores) {
        if (nomeUpper.includes(cor.toUpperCase())) {
            return cor;
        }
    }
    
    return null;
}

/**
 * Carrega produtos do JSON
 */
function carregarProdutos() {
    const raw = fs.readFileSync(CAMINHO_JSON, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [data];
}

/**
 * Busca produto no Magazord por código SKU
 */
async function buscarProdutoPorCodigo(codigoSKU) {
    try {
        // Estratégia 1: Buscar por código exato
        const response1 = await axios.get(
            `/v2/site/produto?codigo=${encodeURIComponent(codigoSKU)}&limit=5`,
            MAGAZORD_CONFIG
        );
        return {
            estrategia: 'codigo',
            sucesso: true,
            produtos: response1.data?.data?.items || []
        };
    } catch (error1) {
        try {
            // Estratégia 2: Buscar diretamente pelo endpoint de produto específico
            const response2 = await axios.get(
                `/v2/site/produto/${encodeURIComponent(codigoSKU)}`,
                MAGAZORD_CONFIG
            );
            return {
                estrategia: 'endpoint_direto',
                sucesso: true,
                produto: response2.data?.data || response2.data
            };
        } catch (error2) {
            return {
                estrategia: 'ambas',
                sucesso: false,
                erro: `Código: ${error1.response?.status || 'N/A'} | Direto: ${error2.response?.status || 'N/A'}`
            };
        }
    }
}

/**
 * Verifica se derivação tem a cor/tamanho especificado
 */
function verificarCorTamanho(derivacao, corBuscada, tamanhoBuscado) {
    const derivacoes = derivacao.derivacoes || [];
    const valores = derivacoes.map(d => (d.valor || '').toLowerCase().trim());
    
    let temCor = true;
    let temTamanho = true;
    
    if (corBuscada) {
        const cor = corBuscada.toLowerCase().trim();
        temCor = valores.some(v => v.includes(cor) || cor.includes(v));
    }
    
    if (tamanhoBuscado) {
        const tam = tamanhoBuscado.toLowerCase().trim();
        temTamanho = valores.some(v => v === tam || v.includes(tam));
    }
    
    return temCor && temTamanho;
}

/**
 * Busca e filtra derivações por cor/tamanho
 */
async function buscarComFiltroCorTamanho(codigoProdutoPai, cor, tamanho) {
    try {
        // Primeiro busca o produto pai para pegar as derivações
        const response = await axios.get(
            `/v2/site/produto/${encodeURIComponent(codigoProdutoPai)}`,
            MAGAZORD_CONFIG
        );
        
        const produto = response.data?.data || response.data;
        const derivacoes = produto.derivacoes || [];
        
        console.log(`   📦 Produto Pai encontrado: ${produto.nome}`);
        console.log(`   🔢 Total de derivações: ${derivacoes.length}`);
        
        if (derivacoes.length === 0) {
            return {
                sucesso: true,
                produto: produto,
                derivacoesEncontradas: [],
                mensagem: 'Produto sem derivações'
            };
        }
        
        // Busca detalhes de cada derivação e filtra por cor/tamanho
        const derivacoesEncontradas = [];
        
        for (const der of derivacoes.slice(0, 10)) { // Limita a 10 para não sobrecarregar
            try {
                const detResponse = await axios.get(
                    `/v2/site/produto/${encodeURIComponent(codigoProdutoPai)}/derivacao/${encodeURIComponent(der.codigo)}`,
                    MAGAZORD_CONFIG
                );
                
                const detalhe = detResponse.data?.data || detResponse.data;
                
                // Verifica se tem a cor/tamanho
                const match = verificarCorTamanho(detalhe, cor, tamanho);
                
                if (match) {
                    derivacoesEncontradas.push({
                        codigo: detalhe.codigo,
                        nome: detalhe.nome,
                        ativo: detalhe.ativo,
                        lojas: detalhe.lojas?.length || 0,
                        derivacoes: detalhe.derivacoes || []
                    });
                }
                
                await new Promise(resolve => setTimeout(resolve, 200)); // Pequeno delay
            } catch (err) {
                // Ignora erros de derivação específica
            }
        }
        
        return {
            sucesso: true,
            produto: produto,
            derivacoesEncontradas: derivacoesEncontradas
        };
        
    } catch (error) {
        return {
            sucesso: false,
            erro: error.response?.status || error.message
        };
    }
}

/**
 * Testa um produto do JSON
 */
async function testarProduto(item, indice) {
    console.log('\n' + '═'.repeat(100));
    console.log(`TESTE ${indice + 1}`);
    console.log('═'.repeat(100));
    
    // Usa o SKU e codigoProduto do JSON
    const sku = item.sku || item.codigoProduto;
    const cor = extrairCorDoNome(item.nome);
    const tamanhos = item.tamanhos || [];
    const tamanho = tamanhos.length > 0 ? tamanhos[0] : null; // Testa com o primeiro tamanho
    
    console.log(`\n📦 Produto do JSON:`);
    console.log(`   Nome: ${item.nome || item.nomeCompleto}`);
    console.log(`   Link: ${item.link}`);
    console.log(`   Código Produto: ${item.codigoProduto || 'N/A'}`);
    console.log(`   SKU: ${sku || 'N/A'}`);
    console.log(`   Cor extraída: ${cor || 'N/A'}`);
    console.log(`   Tamanhos disponíveis: ${tamanhos.join(', ') || 'N/A'}`);
    console.log(`   Tamanho testado: ${tamanho || 'N/A'}`);
    
    if (!sku) {
        console.log('\n   ❌ Não foi possível obter SKU do produto');
        return;
    }
    
    console.log(`\n🔍 Buscando no Magazord por código: "${sku}"`);
    
    // Busca por código
    const resultado = await buscarProdutoPorCodigo(sku);
    
    if (!resultado.sucesso) {
        console.log(`   ❌ Produto NÃO encontrado no Magazord`);
        console.log(`   Erro: ${resultado.erro}`);
        return;
    }
    
    console.log(`   ✅ Produto encontrado! Estratégia: ${resultado.estrategia}`);
    
    // Pega o código do produto para buscar derivações
    let codigoProduto = null;
    let produtoInfo = null;
    
    if (resultado.estrategia === 'codigo' && resultado.produtos.length > 0) {
        const prod = resultado.produtos[0];
        produtoInfo = prod;
        codigoProduto = prod.codigo;
        console.log(`   📋 Código do produto Pai: ${codigoProduto}`);
        console.log(`   📝 Nome no Magazord: ${prod.nome}`);
        console.log(`   ✅ Ativo: ${prod.ativo ? 'Sim' : 'Não'}`);
        console.log(`   🎨 Derivações disponíveis: ${prod.derivacoes?.length || 0}`);
        
        // Log debug das derivações
        if (prod.derivacoes && prod.derivacoes.length > 0) {
            console.log(`   📦 Códigos das derivações:`, prod.derivacoes.map(d => d.codigo).join(', '));
        }
    } else if (resultado.estrategia === 'endpoint_direto') {
        produtoInfo = resultado.produto;
        codigoProduto = resultado.produto.codigo;
        console.log(`   📋 Código do produto Pai: ${codigoProduto}`);
        console.log(`   📝 Nome no Magazord: ${resultado.produto.nome}`);
        console.log(`   ✅ Ativo: ${resultado.produto.ativo ? 'Sim' : 'Não'}`);
        console.log(`   🎨 Derivações disponíveis: ${resultado.produto.derivacoes?.length || 0}`);
        
        // Log debug das derivações
        if (resultado.produto.derivacoes && resultado.produto.derivacoes.length > 0) {
            console.log(`   📦 Códigos das derivações:`, resultado.produto.derivacoes.map(d => d.codigo).join(', '));
        }
    }
    
    // Se tem cor ou tamanho para filtrar, busca derivações
    if ((cor || tamanho) && codigoProduto) {
        console.log(`\n🎨 Filtrando derivações por:`);
        if (cor) console.log(`   Cor: ${cor}`);
        if (tamanho) console.log(`   Tamanho: ${tamanho}`);
        
        const filtroResult = await buscarComFiltroCorTamanho(codigoProduto, cor, tamanho);
        
        if (filtroResult.sucesso) {
            const derivacoes = filtroResult.derivacoesEncontradas || [];
            
            if (derivacoes.length > 0) {
                console.log(`\n   ✅ Encontradas ${derivacoes.length} derivação(ões) com essa cor/tamanho:`);
                derivacoes.forEach((der, idx) => {
                    console.log(`\n   ${idx + 1}. ${der.nome}`);
                    console.log(`      Código: ${der.codigo}`);
                    console.log(`      Ativo: ${der.ativo ? '✅ Sim' : '❌ Não'}`);
                    console.log(`      Lojas vinculadas: ${der.lojas}`);
                    console.log(`      Disponível: ${der.ativo && der.lojas > 0 ? '✅ SIM' : '❌ NÃO'}`);
                    if (der.derivacoes.length > 0) {
                        console.log(`      Características:`, der.derivacoes.map(d => d.valor).join(', '));
                    }
                });
            } else {
                console.log(`\n   ⚠️  Nenhuma derivação encontrada com essa cor/tamanho`);
                console.log(`   Produto existe, mas não nessa combinação específica`);
            }
        } else {
            console.log(`\n   ❌ Erro ao buscar derivações: ${filtroResult.erro}`);
        }
    } else if (codigoProduto) {
        console.log(`\n   ℹ️  Produto encontrado mas sem filtros específicos aplicados`);
        console.log(`   Status: ${produtoInfo?.ativo ? '✅ ATIVO' : '❌ INATIVO'} no Magazord`);
    }
}

/**
 * Executa os testes
 */
async function executarTestes() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              TESTE: BUSCA POR CÓDIGO SKU + FILTRO COR/TAMANHO                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════════════════════════╝');
    
    const produtos = carregarProdutos();
    
    console.log(`\n📊 Total de produtos no JSON: ${produtos.length}`);
    console.log(`\n🎯 Testando os primeiros 5 produtos...\n`);
    
    // Testa os primeiros 5
    for (let i = 0; i < Math.min(5, produtos.length); i++) {
        try {
            await testarProduto(produtos[i], i);
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay entre produtos
        } catch (error) {
            console.log(`\n❌ Erro ao testar produto ${i + 1}:`, error.message);
        }
    }
    
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                      CONCLUSÃO                                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n📝 ANÁLISE:');
    console.log('   1. O código SKU extraído do link DO SITE funciona para buscar no Magazord?');
    console.log('   2. É possível filtrar por cor e tamanho usando as derivações?');
    console.log('   3. A informação de "disponível" é confiável (ativo + lojas > 0)?');
    console.log('\n');
}

executarTestes().catch(error => {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
});
