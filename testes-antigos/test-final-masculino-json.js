import 'dotenv/config';
import axios from 'axios';

/**
 * TESTE FINAL: Simulação de busca de produtos do masculino.json no Magazord
 * Este teste mostra como a IA pode buscar produtos específicos
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

// Simula produtos do masculino.json
const produtosExemplo = [
    {
        nome: "Jaleco Masculino Branco Manga Longa",
        categoria: "Jaleco",
        cor: "Branco",
        descricao: "Jaleco profissional masculino"
    },
    {
        nome: "Scrub Cirúrgico Masculino Azul",
        categoria: "Scrub",
        cor: "Azul Marinho",
        descricao: "Conjunto cirúrgico"
    },
    {
        nome: "Calça Masculina Preta",
        categoria: "Calça",
        cor: "Preta",
        descricao: "Calça profissional"
    },
    {
        nome: "Camisa Polo Médica Branca",
        categoria: "Camisa",
        cor: "Branca",
        descricao: "Camisa polo para profissionais"
    },
    {
        nome: "Gorro Cirúrgico Azul",
        categoria: "Acessórios",
        cor: "Azul",
        descricao: "Gorro descartável"
    }
];

/**
 * Função para buscar produto no Magazord
 */
async function buscarProdutoNoMagazord(produtoJSON) {
    const resultado = {
        produtoOriginal: produtoJSON.nome,
        estrategias: [],
        encontrado: false,
        produtosMagazord: [],
        recomendacao: ''
    };
    
    // ESTRATÉGIA 1: Busca por nome completo
    try {
        console.log(`\n🔍 Estratégia 1: Busca por nome completo "${produtoJSON.nome}"`);
        const response = await axios.get(
            `/v2/site/produto?nome=${encodeURIComponent(produtoJSON.nome)}&ativo=true&limit=5`,
            MAGAZORD_CONFIG
        );
        
        const items = response.data?.data?.items || [];
        resultado.estrategias.push({
            nome: 'Nome Completo',
            termo: produtoJSON.nome,
            resultados: items.length
        });
        
        if (items.length > 0) {
            resultado.encontrado = true;
            resultado.produtosMagazord = items;
            console.log(`   ✅ Sucesso! Encontrou ${items.length} produto(s)`);
            return resultado;
        } else {
            console.log(`   ❌ Nenhum resultado`);
        }
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        resultado.estrategias.push({
            nome: 'Nome Completo',
            termo: produtoJSON.nome,
            erro: error.message
        });
    }
    
    // ESTRATÉGIA 2: Busca por palavras-chave principais
    const palavrasChave = produtoJSON.nome
        .split(' ')
        .filter(p => p.length > 3)
        .slice(0, 2)
        .join(' ');
    
    if (palavrasChave) {
        try {
            console.log(`\n🔍 Estratégia 2: Busca por palavras-chave "${palavrasChave}"`);
            const response = await axios.get(
                `/v2/site/produto?busca=${encodeURIComponent(palavrasChave)}&ativo=true&limit=10`,
                MAGAZORD_CONFIG
            );
            
            const items = response.data?.data?.items || [];
            resultado.estrategias.push({
                nome: 'Palavras-chave',
                termo: palavrasChave,
                resultados: items.length
            });
            
            if (items.length > 0) {
                resultado.encontrado = true;
                resultado.produtosMagazord = items;
                console.log(`   ✅ Sucesso! Encontrou ${items.length} produto(s)`);
                return resultado;
            } else {
                console.log(`   ❌ Nenhum resultado`);
            }
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            resultado.estrategias.push({
                nome: 'Palavras-chave',
                termo: palavrasChave,
                erro: error.message
            });
        }
    }
    
    // ESTRATÉGIA 3: Busca por categoria/modelo
    if (produtoJSON.categoria) {
        try {
            console.log(`\n🔍 Estratégia 3: Busca por categoria "${produtoJSON.categoria}"`);
            const response = await axios.get(
                `/v2/site/produto?busca=${encodeURIComponent(produtoJSON.categoria)}&ativo=true&limit=10`,
                MAGAZORD_CONFIG
            );
            
            const items = response.data?.data?.items || [];
            resultado.estrategias.push({
                nome: 'Categoria',
                termo: produtoJSON.categoria,
                resultados: items.length
            });
            
            if (items.length > 0) {
                resultado.encontrado = true;
                resultado.produtosMagazord = items;
                console.log(`   ✅ Sucesso! Encontrou ${items.length} produto(s)`);
                return resultado;
            } else {
                console.log(`   ❌ Nenhum resultado`);
            }
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
        }
    }
    
    if (!resultado.encontrado) {
        resultado.recomendacao = 'Produto não encontrado no Magazord. Pode não estar cadastrado ou ter nome diferente.';
    }
    
    return resultado;
}

/**
 * Analisa e exibe relatório do produto encontrado
 */
function exibirRelatorio(resultado, indice) {
    console.log('\n' + '═'.repeat(100));
    console.log(`PRODUTO ${indice + 1}: ${resultado.produtoOriginal}`);
    console.log('═'.repeat(100));
    
    // Estratégias tentadas
    console.log('\n📋 Estratégias de busca:');
    resultado.estrategias.forEach((est, idx) => {
        console.log(`   ${idx + 1}. ${est.nome}: "${est.termo}"`);
        if (est.erro) {
            console.log(`      ❌ Erro: ${est.erro}`);
        } else {
            console.log(`      ${est.resultados > 0 ? '✅' : '❌'} ${est.resultados} resultado(s)`);
        }
    });
    
    // Resultados
    if (resultado.encontrado && resultado.produtosMagazord.length > 0) {
        console.log(`\n✅ ENCONTRADO! ${resultado.produtosMagazord.length} produto(s) similar(es) no Magazord:`);
        
        resultado.produtosMagazord.slice(0, 3).forEach((prod, idx) => {
            console.log(`\n   ${idx + 1}. ${prod.nome}`);
            console.log(`      ├─ ID: ${prod.id}`);
            console.log(`      ├─ Código: ${prod.codigo || 'N/A'}`);
            console.log(`      ├─ Modelo: ${prod.modelo || 'N/A'}`);
            console.log(`      ├─ Ativo: ${prod.ativo ? '✅ Sim' : '❌ Não'}`);
            console.log(`      ├─ Categorias: ${prod.categorias?.join(', ') || 'N/A'}`);
            
            if (prod.derivacoes && prod.derivacoes.length > 0) {
                console.log(`      └─ Variações: ${prod.derivacoes.length} disponíveis`);
                prod.derivacoes.slice(0, 3).forEach((der, i) => {
                    console.log(`         ${i + 1}. ${der.nome} (ID: ${der.id})`);
                });
                if (prod.derivacoes.length > 3) {
                    console.log(`         ... e mais ${prod.derivacoes.length - 3} variações`);
                }
            } else {
                console.log(`      └─ Variações: Nenhuma`);
            }
        });
        
        if (resultado.produtosMagazord.length > 3) {
            console.log(`\n   ... e mais ${resultado.produtosMagazord.length - 3} produto(s)`);
        }
        
        // Aviso sobre limitações
        console.log('\n⚠️  ATENÇÃO:');
        console.log('   - A API NÃO retorna informações de estoque');
        console.log('   - A API NÃO retorna preços dos produtos');
        console.log('   - As cores disponíveis em estoque NÃO são informadas');
        console.log('   - Apenas confirma que o produto existe no catálogo');
        
    } else {
        console.log(`\n❌ NÃO ENCONTRADO no catálogo Magazord`);
        console.log(`\n💡 ${resultado.recomendacao}`);
    }
}

/**
 * Executa todos os testes
 */
async function executarTestesCompletos() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                  TESTE FINAL: BUSCA DE PRODUTOS DO masculino.json NO MAGAZORD                 ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n📦 Testando com produtos de EXEMPLO simulando o masculino.json\n');
    
    const resultados = [];
    
    for (let i = 0; i < produtosExemplo.length; i++) {
        const produto = produtosExemplo[i];
        console.log(`\n⏳ [${i + 1}/${produtosExemplo.length}] Buscando: "${produto.nome}"...`);
        console.log('─'.repeat(100));
        
        const resultado = await buscarProdutoNoMagazord(produto);
        resultados.push(resultado);
        
        // Aguarda entre requisições
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Exibe relatório completo
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                    RELATÓRIO FINAL                                             ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════════════════════════╝');
    
    resultados.forEach((resultado, idx) => {
        exibirRelatorio(resultado, idx);
    });
    
    // Estatísticas finais
    const encontrados = resultados.filter(r => r.encontrado).length;
    const naoEncontrados = resultados.length - encontrados;
    const totalDerivacoes = resultados
        .filter(r => r.encontrado)
        .reduce((sum, r) => {
            return sum + r.produtosMagazord.reduce((s, p) => s + (p.derivacoes?.length || 0), 0);
        }, 0);
    
    console.log('\n\n');
    console.log('═'.repeat(100));
    console.log('📊 ESTATÍSTICAS FINAIS');
    console.log('═'.repeat(100));
    console.log(`\n   📦 Total de produtos testados: ${resultados.length}`);
    console.log(`   ✅ Encontrados no Magazord: ${encontrados} (${(encontrados/resultados.length*100).toFixed(1)}%)`);
    console.log(`   ❌ Não encontrados: ${naoEncontrados} (${(naoEncontrados/resultados.length*100).toFixed(1)}%)`);
    console.log(`   🎨 Total de variações encontradas: ${totalDerivacoes}`);
    
    console.log('\n\n   📋 RESUMO POR PRODUTO:\n');
    resultados.forEach((r, idx) => {
        const status = r.encontrado ? '✅' : '❌';
        const count = r.encontrado ? r.produtosMagazord.length : 0;
        console.log(`   ${status} ${idx + 1}. ${r.produtoOriginal}`);
        console.log(`      → ${count} produto(s) encontrado(s)`);
    });
    
    console.log('\n' + '═'.repeat(100));
    
    // Conclusão
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                      CONCLUSÃO                                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n✅ A IA CONSEGUE:');
    console.log('   1. Ler o nome do produto do masculino.json');
    console.log('   2. Buscar o produto específico no Magazord usando o nome');
    console.log('   3. Confirmar se o produto existe no catálogo');
    console.log('   4. Listar variações disponíveis (derivações)');
    console.log('   5. Informar dados básicos (ID, código, modelo, categorias)');
    
    console.log('\n❌ A IA NÃO CONSEGUE (Limitação da API):');
    console.log('   1. Verificar quantidade em estoque');
    console.log('   2. Ver preços dos produtos');
    console.log('   3. Saber quais cores estão disponíveis em estoque');
    console.log('   4. Informar disponibilidade real para venda');
    
    console.log('\n💡 RECOMENDAÇÃO:');
    console.log('   Para obter informações de estoque e disponibilidade, será necessário:');
    console.log('   - Usar um endpoint administrativo da API (se disponível)');
    console.log('   - Integrar com sistema de gestão de estoque do Magazord');
    console.log('   - Consultar diretamente o painel administrativo');
    
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                  TESTES CONCLUÍDOS!                                            ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n');
}

// Executar
executarTestesCompletos().catch(error => {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
});
