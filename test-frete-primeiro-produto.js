/**
 * ================================================================
 * TESTE: Cálculo de Frete do Primeiro Produto
 * Testa o fluxo completo: busca → pega primeiro produto → calcula frete
 * ================================================================
 */

import { buscarProdutos } from './atendimento/pesquisar_catalogo.js';
import { calcularFrete } from './atendimento/calcular-frete.js';
import * as dotenv from 'dotenv';
dotenv.config();

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║   🧪 TESTE: FRETE DO PRIMEIRO PRODUTO ENCONTRADO  ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

async function testarFreteCompleto() {
  try {
    // ═══════════════════════════════════════════════════════════
    // 1️⃣ BUSCAR PRODUTOS (scrub masculino bordo)
    // ═══════════════════════════════════════════════════════════
    console.log('1️⃣ BUSCANDO PRODUTOS...\n');
    
    const filtros = {
      tipoProduto: 'scrub',
      genero: 'masculino',
      cor: 'Bordo'
    };
    
    console.log('🔍 Filtros aplicados:', filtros);
    const produtos = await buscarProdutos(filtros);
    
    console.log(`\n✅ Produtos encontrados: ${produtos.length}`);
    
    if (produtos.length === 0) {
      console.log('❌ FALHA: Nenhum produto encontrado!');
      return;
    }
    
    // ═══════════════════════════════════════════════════════════
    // 2️⃣ PEGAR PRIMEIRO PRODUTO
    // ═══════════════════════════════════════════════════════════
    console.log('\n2️⃣ PEGANDO PRIMEIRO PRODUTO...\n');
    
    const primeiroProduto = produtos[0];
    console.log('📦 Primeiro Produto:');
    console.log(`   Nome: ${primeiroProduto.nome}`);
    console.log(`   SKU: ${primeiroProduto.codigo}`);
    console.log(`   Cor: ${primeiroProduto.cor}`);
    console.log(`   Gênero: ${primeiroProduto.genero}`);
    console.log(`   Link: ${primeiroProduto.link}`);
    
    // ═══════════════════════════════════════════════════════════
    // 3️⃣ CALCULAR FRETE
    // ═══════════════════════════════════════════════════════════
    console.log('\n3️⃣ CALCULANDO FRETE...\n');
    
    const cepTeste = '58073493'; // CEP de João Pessoa - PB
    console.log(`📍 CEP de teste: ${cepTeste}`);
    
    const resultadoFrete = await calcularFrete(cepTeste, primeiroProduto);
    
    // ═══════════════════════════════════════════════════════════
    // 4️⃣ VALIDAR RESULTADO
    // ═══════════════════════════════════════════════════════════
    console.log('\n4️⃣ VALIDANDO RESULTADO...\n');
    
    if (!resultadoFrete.sucesso) {
      console.log('❌ FALHA NO CÁLCULO DE FRETE!');
      console.log('Erro:', resultadoFrete.erro);
      console.log('Detalhes:', JSON.stringify(resultadoFrete.detalhes, null, 2));
      return;
    }
    
    console.log('✅ Frete calculado com sucesso!\n');
    console.log('📊 RESULTADO:');
    console.log(`   CEP: ${resultadoFrete.cep}`);
    console.log(`   Cidade: ${resultadoFrete.cidade}`);
    console.log(`   Estado: ${resultadoFrete.estado}`);
    console.log(`   Produto: ${resultadoFrete.produto || primeiroProduto.nome}`);
    console.log(`   Opções de frete: ${resultadoFrete.opcoes?.length || 0}`);
    
    if (resultadoFrete.opcoes && resultadoFrete.opcoes.length > 0) {
      console.log('\n📦 OPÇÕES DE ENTREGA:');
      resultadoFrete.opcoes.forEach((opcao, index) => {
        console.log(`   ${index + 1}. ${opcao.tipo}`);
        console.log(`      💰 Valor: R$ ${opcao.valor.toFixed(2)}`);
        console.log(`      📅 Prazo: ${opcao.prazoDescricao}`);
      });
      
      // Encontrar mais barato e mais rápido
      const maisBarato = resultadoFrete.opcoes.reduce((min, op) => 
        op.valor < min.valor ? op : min
      );
      const maisRapido = resultadoFrete.opcoes.reduce((min, op) => 
        op.prazo < min.prazo ? op : min
      );
      
      console.log('\n💡 RECOMENDAÇÕES:');
      console.log(`   💰 Mais barato: ${maisBarato.tipo} - R$ ${maisBarato.valor.toFixed(2)}`);
      console.log(`   ⚡ Mais rápido: ${maisRapido.tipo} - ${maisRapido.prazoDescricao}`);
    } else {
      console.log('⚠️ Nenhuma opção de frete disponível');
    }
    
    // ═══════════════════════════════════════════════════════════
    // 5️⃣ TESTES DE VALIDAÇÃO
    // ═══════════════════════════════════════════════════════════
    console.log('\n5️⃣ EXECUTANDO VALIDAÇÕES...\n');
    
    let testesPassados = 0;
    let testesFalhados = 0;
    
    // Teste 1: Produto encontrado
    if (produtos.length > 0) {
      console.log('✅ Teste 1: Produtos encontrados na busca');
      testesPassados++;
    } else {
      console.log('❌ Teste 1: FALHOU - Nenhum produto encontrado');
      testesFalhados++;
    }
    
    // Teste 2: Primeiro produto tem SKU
    if (primeiroProduto.codigo) {
      console.log(`✅ Teste 2: Primeiro produto tem SKU (${primeiroProduto.codigo})`);
      testesPassados++;
    } else {
      console.log('❌ Teste 2: FALHOU - Produto sem SKU');
      testesFalhados++;
    }
    
    // Teste 3: Frete calculado com sucesso
    if (resultadoFrete.sucesso) {
      console.log('✅ Teste 3: Frete calculado com sucesso');
      testesPassados++;
    } else {
      console.log('❌ Teste 3: FALHOU - Erro no cálculo de frete');
      testesFalhados++;
    }
    
    // Teste 4: Retornou opções de frete
    if (resultadoFrete.opcoes && resultadoFrete.opcoes.length > 0) {
      console.log(`✅ Teste 4: Retornou ${resultadoFrete.opcoes.length} opções de frete`);
      testesPassados++;
    } else {
      console.log('❌ Teste 4: FALHOU - Nenhuma opção de frete retornada');
      testesFalhados++;
    }
    
    // Teste 5: Opções têm valor e prazo
    if (resultadoFrete.opcoes && resultadoFrete.opcoes.length > 0) {
      const primeiraOpcao = resultadoFrete.opcoes[0];
      if (primeiraOpcao.valor > 0 && primeiraOpcao.prazo > 0) {
        console.log('✅ Teste 5: Opções de frete têm valor e prazo válidos');
        testesPassados++;
      } else {
        console.log('❌ Teste 5: FALHOU - Valores inválidos nas opções');
        testesFalhados++;
      }
    }
    
    // Teste 6: Cidade e Estado retornados
    if (resultadoFrete.cidade && resultadoFrete.estado) {
      console.log(`✅ Teste 6: Cidade/Estado retornados (${resultadoFrete.cidade}/${resultadoFrete.estado})`);
      testesPassados++;
    } else {
      console.log('❌ Teste 6: FALHOU - Cidade/Estado não retornados');
      testesFalhados++;
    }
    
    // ═══════════════════════════════════════════════════════════
    // 6️⃣ RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║              📊 RESULTADO DOS TESTES               ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    
    console.log(`✅ Testes Passados: ${testesPassados}`);
    console.log(`❌ Testes Falhados: ${testesFalhados}`);
    console.log(`📊 Taxa de Sucesso: ${((testesPassados / (testesPassados + testesFalhados)) * 100).toFixed(1)}%`);
    
    if (testesFalhados === 0) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM! 🎉');
      console.log('✅ O cálculo de frete do primeiro produto está funcionando!');
    } else {
      console.log('\n⚠️ ALGUNS TESTES FALHARAM!');
      console.log('❌ Verifique os erros acima e corrija o código.');
    }
    
  } catch (erro) {
    console.error('\n❌ ERRO DURANTE O TESTE:');
    console.error(erro.message);
    console.error('\n📋 Stack trace:');
    console.error(erro.stack);
  }
}

// Executar teste
testarFreteCompleto();
