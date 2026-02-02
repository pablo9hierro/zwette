/**
 * TESTE RÁPIDO: Fluxo tipo → gênero → cor
 */

import { processarBloco2 } from './atendimento/bloco2-filtro.js';

async function testar() {
  console.log('🧪 TESTE: Tipo → Gênero → Cor\n');
  
  // 1. Cliente escolhe tipo "robe"
  let contexto = {
    nomeCliente: 'Pablo',
    faseAtual: 'filtro',
    aguardandoResposta: 'tipo_produto',
    ultimaListaEnumerada: {
      tipo_lista: 'tipos_produto',
      itens: [
        { numero: 1, valor: 'robe' },
        { numero: 2, valor: 'jaleco' }
      ]
    },
    caracteristicasMencionadas: []
  };

  let resultado = await processarBloco2('robe', contexto, '5511999999999');
  
  console.log('1️⃣ Cliente diz: "robe"');
  console.log('   Tipo capturado:', resultado.contextoAtualizado.tipoProduto);
  console.log('   Aguardando:', resultado.contextoAtualizado.aguardandoResposta);
  console.log('   Lista enviada:', resultado.listaEnumerada?.tipo_lista);
  console.log('   Mensagem:', resultado.mensagem.substring(0, 100) + '...\n');
  
  // 2. Cliente escolhe gênero "feminino"
  contexto = {
    ...resultado.contextoAtualizado,
    ultimaListaEnumerada: resultado.listaEnumerada
  };
  
  resultado = await processarBloco2('feminino', contexto, '5511999999999');
  
  console.log('2️⃣ Cliente diz: "feminino"');
  console.log('   Gênero capturado:', resultado.contextoAtualizado.genero);
  console.log('   Aguardando:', resultado.contextoAtualizado.aguardandoResposta);
  console.log('   Lista enviada:', resultado.listaEnumerada?.tipo_lista);
  console.log('   Mensagem:', resultado.mensagem.substring(0, 100) + '...\n');
  
  if (resultado.contextoAtualizado.genero !== 'feminino') {
    console.log('❌ FALHA: Gênero não capturado!');
    process.exit(1);
  }
  
  if (resultado.listaEnumerada?.tipo_lista !== 'cores') {
    console.log('❌ FALHA: Lista de cores não enviada!');
    process.exit(1);
  }
  
  // 3. Cliente pede lista de cores
  contexto = {
    ...resultado.contextoAtualizado,
    ultimaListaEnumerada: resultado.listaEnumerada
  };
  
  resultado = await processarBloco2('quais cores tem?', contexto, '5511999999999');
  
  console.log('3️⃣ Cliente diz: "quais cores tem?"');
  console.log('   Lista enviada:', resultado.listaEnumerada?.tipo_lista);
  console.log('   Mensagem:', resultado.mensagem.substring(0, 100) + '...\n');
  
  console.log('✅ TESTE PASSOU!');
}

testar().catch(err => {
  console.error('❌ ERRO:', err.message);
  process.exit(1);
});
