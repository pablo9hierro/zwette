import 'dotenv/config';
import axios from 'axios';

/**
 * Análise completa da estrutura de dados retornada pela API
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

async function analisarEstruturaCompleta() {
    console.log('\n╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              ANÁLISE COMPLETA DA ESTRUTURA DA API MAGAZORD                   ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');
    
    try {
        // 1. Busca produtos com todos os campos possíveis
        console.log('📋 Buscando produtos com filtros de estoque disponível...\n');
        
        const response = await axios.get('/v2/site/produto?ativo=true&limit=10', MAGAZORD_CONFIG);
        const produtos = response.data?.data?.items || [];
        
        console.log(`✅ Retornados: ${produtos.length} produtos\n`);
        console.log('═'.repeat(80));
        
        // 2. Analisa estrutura completa de cada produto
        for (let i = 0; i < Math.min(3, produtos.length); i++) {
            const produto = produtos[i];
            
            console.log(`\n📦 PRODUTO ${i + 1}: ${produto.nome}`);
            console.log('─'.repeat(80));
            console.log('\n🔍 ESTRUTURA COMPLETA DO OBJETO:');
            console.log(JSON.stringify(produto, null, 2));
            
            console.log('\n📊 ANÁLISE DE CAMPOS:');
            console.log('─'.repeat(80));
            
            // Campos básicos
            console.log('\n🏷️  IDENTIFICAÇÃO:');
            console.log(`   ID: ${produto.id}`);
            console.log(`   Nome: ${produto.nome}`);
            console.log(`   Modelo: ${produto.modelo || 'N/A'}`);
            console.log(`   Código: ${produto.codigo || 'N/A'}`);
            console.log(`   Marca: ${produto.marca || 'N/A'}`);
            
            // Status
            console.log('\n✅ STATUS:');
            console.log(`   Ativo: ${produto.ativo}`);
            console.log(`   Disponível: ${produto.disponivel || 'N/A'}`);
            console.log(`   Visível: ${produto.visivel || 'N/A'}`);
            
            // Preço e estoque
            console.log('\n💰 PREÇO E ESTOQUE:');
            console.log(`   Preço: ${produto.preco || produto.price || 'N/A'}`);
            console.log(`   Preço Promocional: ${produto.precoPromocional || produto.preco_promocional || 'N/A'}`);
            console.log(`   Estoque: ${produto.estoque !== undefined ? produto.estoque : 'N/A'}`);
            console.log(`   Quantidade: ${produto.quantidade || 'N/A'}`);
            console.log(`   Disponibilidade: ${produto.disponibilidade || 'N/A'}`);
            
            // Descrição
            console.log('\n📝 DESCRIÇÃO:');
            console.log(`   Descrição: ${produto.descricao || 'N/A'}`);
            console.log(`   Descrição Curta: ${produto.descricaoCurta || 'N/A'}`);
            console.log(`   Palavras-chave: ${produto.palavraChave || 'N/A'}`);
            console.log(`   Acompanha: ${produto.acompanha || 'N/A'}`);
            
            // Categorias
            console.log('\n📂 CATEGORIAS:');
            if (produto.categorias && Array.isArray(produto.categorias)) {
                console.log(`   IDs: ${produto.categorias.join(', ')}`);
            } else {
                console.log(`   ${produto.categorias || 'N/A'}`);
            }
            
            // Derivações (variações/cores)
            console.log('\n🎨 DERIVAÇÕES/VARIAÇÕES:');
            if (produto.derivacoes && Array.isArray(produto.derivacoes)) {
                console.log(`   Total: ${produto.derivacoes.length}`);
                produto.derivacoes.forEach((der, idx) => {
                    console.log(`\n   ${idx + 1}. ${der.nome || 'Sem nome'}`);
                    console.log(`      ID: ${der.id}`);
                    console.log(`      Código: ${der.codigo || 'N/A'}`);
                    console.log(`      Ativo: ${der.ativo}`);
                    console.log(`      Cor: ${der.cor || 'N/A'}`);
                    console.log(`      Tamanho: ${der.tamanho || 'N/A'}`);
                    console.log(`      Estoque: ${der.estoque !== undefined ? der.estoque : 'N/A'}`);
                });
            } else {
                console.log(`   ${produto.derivacoes || 'Nenhuma'}`);
            }
            
            // Variações (se existir campo separado)
            if (produto.variacoes) {
                console.log('\n🔄 VARIAÇÕES:');
                if (Array.isArray(produto.variacoes)) {
                    produto.variacoes.forEach((v, idx) => {
                        console.log(`   ${idx + 1}. ${JSON.stringify(v)}`);
                    });
                } else {
                    console.log(`   ${produto.variacoes}`);
                }
            }
            
            // Cores
            if (produto.cores) {
                console.log('\n🎨 CORES:');
                console.log(`   ${JSON.stringify(produto.cores)}`);
            }
            
            // Tamanhos
            if (produto.tamanhos) {
                console.log('\n📏 TAMANHOS:');
                console.log(`   ${JSON.stringify(produto.tamanhos)}`);
            }
            
            // Dimensões
            console.log('\n📦 DIMENSÕES:');
            console.log(`   Peso: ${produto.peso || 'N/A'} kg`);
            console.log(`   Altura: ${produto.altura || 'N/A'} cm`);
            console.log(`   Largura: ${produto.largura || 'N/A'} cm`);
            console.log(`   Comprimento: ${produto.comprimento || 'N/A'} cm`);
            
            // Fiscal
            console.log('\n📋 DADOS FISCAIS:');
            console.log(`   NCM: ${produto.ncm || 'N/A'}`);
            console.log(`   CEST: ${produto.cest || 'N/A'}`);
            console.log(`   Origem Fiscal: ${produto.origemFiscal !== undefined ? produto.origemFiscal : 'N/A'}`);
            
            // Datas
            console.log('\n📅 DATAS:');
            console.log(`   Lançamento: ${produto.dataLancamento || 'N/A'}`);
            console.log(`   Atualização: ${produto.dataAtualizacao || 'N/A'}`);
            
            console.log('\n' + '═'.repeat(80));
        }
        
        // 3. Resumo dos campos encontrados
        console.log('\n\n📊 RESUMO: TODOS OS CAMPOS ENCONTRADOS NA API');
        console.log('═'.repeat(80));
        
        const todosCampos = new Set();
        produtos.forEach(prod => {
            Object.keys(prod).forEach(campo => todosCampos.add(campo));
        });
        
        console.log('\n✅ Campos disponíveis no retorno da API:');
        Array.from(todosCampos).sort().forEach(campo => {
            console.log(`   - ${campo}`);
        });
        
        // 4. Testa busca específica por nome
        console.log('\n\n═'.repeat(80));
        console.log('🎯 TESTE DE BUSCA POR NOME ESPECÍFICO');
        console.log('═'.repeat(80));
        
        const termoBusca = 'Jaleco Masculino';
        console.log(`\n🔍 Buscando: "${termoBusca}"`);
        
        const buscaResponse = await axios.get(
            `/v2/site/produto?nome=${encodeURIComponent(termoBusca)}&limit=5`,
            MAGAZORD_CONFIG
        );
        
        const resultados = buscaResponse.data?.data?.items || [];
        console.log(`\n✅ Encontrados: ${resultados.length} resultado(s)`);
        
        resultados.forEach((prod, idx) => {
            console.log(`\n${idx + 1}. ${prod.nome}`);
            console.log(`   ID: ${prod.id}`);
            console.log(`   Código: ${prod.codigo || 'N/A'}`);
            console.log(`   Ativo: ${prod.ativo ? '✅' : '❌'}`);
            
            if (prod.derivacoes && prod.derivacoes.length > 0) {
                console.log(`   Derivações: ${prod.derivacoes.length} disponíveis`);
                prod.derivacoes.slice(0, 3).forEach(der => {
                    console.log(`      - ${der.nome} (ID: ${der.id})`);
                });
            }
        });
        
    } catch (error) {
        console.error('\n❌ Erro:', error.response?.data || error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
    
    console.log('\n\n╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                            ANÁLISE CONCLUÍDA!                                 ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');
}

analisarEstruturaCompleta();
