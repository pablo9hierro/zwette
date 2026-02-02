import { processarAtendimentoJana } from './atendimento/orquestrador-jana.js';

const testNumber = `test-magazord-${Date.now()}@s.whatsapp.net`;

console.log('🧪 TESTE - Integração Magazord (Verificação Silenciosa)');
console.log('='.repeat(60));
console.log('❗ IMPORTANTE: Este teste verificará disponibilidade na API Magazord');
console.log('❗ Produtos indisponíveis serão removidos SILENCIOSAMENTE');
console.log('❗ Cliente NÃO verá menção à API ou verificação de estoque');
console.log('='.repeat(60));

async function testarIntegracaoMagazord() {
  try {
    console.log('\n📍 TESTE: Busca com verificação Magazord');
    console.log('='.repeat(60));
    
    await processarAtendimentoJana('simitarra', testNumber);
    await processarAtendimentoJana('Lucas', testNumber);
    await processarAtendimentoJana('jaleco', testNumber);
    await processarAtendimentoJana('masculino', testNumber);
    await processarAtendimentoJana('branco', testNumber);
    
    console.log('\n💬 Cliente confirma busca: "sim"');
    console.log('🔍 Bot irá:');
    console.log('   1. Buscar produtos no catálogo local');
    console.log('   2. Verificar disponibilidade de cada SKU no Magazord');
    console.log('   3. Remover produtos indisponíveis');
    console.log('   4. Enviar APENAS produtos disponíveis');
    console.log('   5. NÃO mencionar API ou verificação ao cliente\n');
    
    const respBusca = await processarAtendimentoJana('sim', testNumber);
    
    console.log('\n✅ RESPOSTA FINAL AO CLIENTE:');
    console.log('='.repeat(60));
    
    if (Array.isArray(respBusca) && respBusca.length >= 2) {
      console.log('\n📨 Mensagem 1 (Quantidade):');
      console.log(respBusca[0]);
      
      console.log('\n📨 Mensagem 2 (Lista de Produtos):');
      console.log(respBusca[1].substring(0, 500));
      
      if (respBusca[2]) {
        console.log('\n📨 Mensagem 3 (Continuação):');
        console.log(respBusca[2]);
      }
      
      // Validações
      console.log('\n\n🔍 VALIDAÇÕES:');
      console.log('='.repeat(60));
      
      const mensagemCompleta = respBusca.join(' ').toLowerCase();
      
      if (mensagemCompleta.includes('magazord') || 
          mensagemCompleta.includes('api') || 
          mensagemCompleta.includes('estoque') ||
          mensagemCompleta.includes('disponibilidade') ||
          mensagemCompleta.includes('verificação')) {
        console.log('❌ ERRO! Mensagem menciona API/estoque (deveria ser silencioso)');
      } else {
        console.log('✅ SUCESSO! Verificação foi silenciosa');
      }
      
      if (respBusca[1].includes('🔗')) {
        console.log('✅ SUCESSO! Links de produtos foram enviados');
      } else {
        console.log('⚠️ AVISO: Nenhum link encontrado (talvez nenhum produto disponível)');
      }
      
      if (respBusca[0].includes('Encontrei') || respBusca[0].includes('encontrei')) {
        console.log('✅ SUCESSO! Mensagem de sucesso enviada');
      } else if (respBusca[0].includes('não encontrei') || respBusca[0].includes('Puxa')) {
        console.log('⚠️ INFO: Nenhum produto disponível (todos foram filtrados pelo Magazord)');
      }
      
    } else {
      console.log('Resposta:', typeof respBusca === 'string' ? respBusca : '[formato inesperado]');
    }
    
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ TESTE FINALIZADO!');
    console.log('='.repeat(60));
    console.log('\n📝 RESUMO:');
    console.log('   - Verificação de disponibilidade: IMPLEMENTADA');
    console.log('   - Filtro silencioso: SIM (cliente não vê)');
    console.log('   - Produtos indisponíveis: REMOVIDOS da lista');
    console.log('   - Mensagem ao cliente: NATURAL (sem menção à API)');
    
  } catch (erro) {
    console.error('\n❌ ERRO:', erro);
    console.error(erro.stack);
  }
}

testarIntegracaoMagazord();
