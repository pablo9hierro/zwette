/**
 * Teste completo: Validar filtro de cor em múltiplos cenários
 */
import { buscarProdutosFiltrado } from './atendimento/bloco3-magazord.js';

async function testarFiltros() {
  console.log('='.repeat(70));
  console.log('✅ TESTE COMPLETO: Validação de Filtros de Cor');
  console.log('='.repeat(70));
  
  const testes = [
    { tipoProduto: 'scrub', genero: 'masculino', cor: 'Chumbo' },
    { tipoProduto: 'scrub', genero: 'masculino', cor: 'Azul' },
    { tipoProduto: 'scrub', genero: 'masculino', cor: 'Preto' },
    { tipoProduto: 'scrub', genero: 'feminino', cor: 'Rosa Pink' },
  ];
  
  for (const teste of testes) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`🔍 TESTE: ${teste.tipoProduto} ${teste.genero} ${teste.cor}`);
    console.log('─'.repeat(70));
    
    const resultado = await buscarProdutosFiltrado(teste);
    
    console.log(`Total: ${resultado.total} produtos\n`);
    
    let problemasEncontrados = 0;
    const coresConflitantes = ['azul', 'branco', 'branca', 'verde', 'rosa', 'preto', 'preta', 
      'roxo', 'roxa', 'amarelo', 'amarela', 'vermelho', 'vermelha', 'cinza', 'chumbo'];
    
    resultado.produtos.slice(0, 5).forEach((produto, index) => {
      const nome = (produto.nome || produto.nomeCompleto).toLowerCase();
      const corBuscada = teste.cor.toLowerCase();
      
      console.log(`${index + 1}. ${produto.nome || produto.nomeCompleto}`);
      
      // Verificar se menciona outra cor no formato "e calca [cor]"
      let mencionaOutraCor = false;
      for (const outraCor of coresConflitantes) {
        if (outraCor === corBuscada || corBuscada.includes(outraCor)) continue;
        if (nome.includes(`calca ${outraCor}`)) {
          console.log(`   ❌ Menciona "calca ${outraCor}"!`);
          mencionaOutraCor = true;
          problemasEncontrados++;
          break;
        }
      }
      
      if (!mencionaOutraCor) {
        console.log(`   ✅ OK`);
      }
    });
    
    if (resultado.total > 5) {
      console.log(`\n   ... e mais ${resultado.total - 5} produto(s)`);
    }
    
    if (problemasEncontrados > 0) {
      console.log(`\n⚠️  ${problemasEncontrados} problema(s) encontrado(s)`);
    }
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('🎉 TESTES CONCLUÍDOS');
  console.log('='.repeat(70));
}

testarFiltros().catch(console.error);
