import 'dotenv/config';
import axios from 'axios';
import { buscarProdutosFiltrado } from './atendimento/bloco3-magazord.js';
import { filtrarProdutosDisponiveis } from './tools/magazord-api.js';

const MAGAZORD_CONFIG = {
    baseURL: process.env.MAGAZORD_URL,
    auth: {
        username: process.env.MAGAZORD_USER,
        password: process.env.MAGAZORD_PASSWORD
    }
};

console.log('🧪 TESTE DETALHADO - Verificação de SKU no Magazord');
console.log('='.repeat(70));

async function testarVerificacaoSKU() {
    try {
        // ETAPA 1: Buscar produtos no catálogo local
        console.log('\n📂 ETAPA 1: Buscar produtos no catálogo local');
        console.log('-'.repeat(70));
        
        const contexto = {
            tipoProduto: 'jaleco',
            genero: 'masculino',
            cor: 'Verde'
        };
        
        console.log('Filtros:', contexto);
        
        const { produtos } = await buscarProdutosFiltrado(contexto);
        
        console.log(`✅ Encontrados ${produtos.length} produtos no catálogo local\n`);
        
        if (produtos.length === 0) {
            console.log('❌ Nenhum produto encontrado. Tente outros filtros.');
            return;
        }
        
        // Mostrar primeiros 5 produtos
        console.log('📦 Primeiros produtos encontrados:');
        produtos.slice(0, 5).forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.nome}`);
            console.log(`      SKU: ${p.sku}`);
        });
        
        // ETAPA 2: Testar consulta individual por SKU
        console.log('\n\n🔍 ETAPA 2: Verificar disponibilidade de SKUs específicos');
        console.log('-'.repeat(70));
        
        const skusTeste = produtos.slice(0, 5).map(p => p.sku);
        
        for (const sku of skusTeste) {
            console.log(`\n📍 Consultando SKU: ${sku}`);
            
            try {
                const response = await axios.get('/v2/site/produto', {
                    ...MAGAZORD_CONFIG,
                    params: {
                        codigo: sku,
                        ativo: true,
                        limit: 1
                    }
                });
                
                const produtosMagazord = response.data?.data?.items || [];
                
                if (produtosMagazord.length === 0) {
                    console.log(`   ❌ Não encontrado na API`);
                    continue;
                }
                
                const produto = produtosMagazord[0];
                
                console.log(`   ✅ Encontrado!`);
                console.log(`      Nome: ${produto.nome}`);
                console.log(`      Ativo: ${produto.ativo ? 'Sim' : 'Não'}`);
                console.log(`      Estoque: ${produto.estoque || produto.estoqueDisponivel || 0}`);
                
                // Verificar disponibilidade
                const temEstoque = (produto.estoque > 0) || (produto.estoqueDisponivel > 0);
                if (temEstoque) {
                    console.log(`   ✅ DISPONÍVEL (estoque: ${produto.estoque || produto.estoqueDisponivel})`);
                } else {
                    console.log(`   ❌ SEM ESTOQUE`);
                }
                
            } catch (erro) {
                console.log(`   ❌ Erro ao consultar: ${erro.response?.status || erro.message}`);
            }
        }
        
        // ETAPA 3: Usar a função de filtro completa
        console.log('\n\n🎯 ETAPA 3: Testar filtro automático completo');
        console.log('-'.repeat(70));
        console.log('Aplicando filtrarProdutosDisponiveis()...\n');
        
        const produtosDisponiveis = await filtrarProdutosDisponiveis(produtos);
        
        console.log('\n' + '='.repeat(70));
        console.log('📊 RESULTADO FINAL:');
        console.log('='.repeat(70));
        console.log(`   Total no catálogo: ${produtos.length}`);
        console.log(`   Disponíveis no Magazord: ${produtosDisponiveis.length}`);
        console.log(`   Removidos (sem estoque): ${produtos.length - produtosDisponiveis.length}`);
        
        if (produtosDisponiveis.length > 0) {
            console.log('\n✅ Produtos que serão mostrados ao cliente:');
            produtosDisponiveis.slice(0, 5).forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.nome}`);
                console.log(`      Link: ${p.link}`);
            });
        } else {
            console.log('\n❌ Nenhum produto disponível - Cliente verá mensagem de "não encontrado"');
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('✅ TESTE CONCLUÍDO!');
        console.log('='.repeat(70));
        
    } catch (erro) {
        console.error('\n❌ ERRO:', erro.message);
        console.error(erro.stack);
    }
}

testarVerificacaoSKU();
