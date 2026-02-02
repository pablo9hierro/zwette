/**
 * =====================================================
 * TESTE: GÊNERO COM LISTA ENUMERADA
 * Validar que gênero é apresentado como lista enumerada
 * e que a seleção funciona corretamente
 * =====================================================
 */

import { processarBloco2 } from './atendimento/bloco2-filtro.js';

const numeroUsuario = '5511999999999';

async function testarFluxoGenero() {
  console.log('='.repeat(60));
  console.log('🧪 TESTE: Gênero com Lista Enumerada');
  console.log('='.repeat(60));
  console.log();

  // ====================================================================
  // CENÁRIO 1: Cliente escolhe tipo (sem modelos) → deve mostrar lista de gênero
  // ====================================================================
  console.log('📋 CENÁRIO 1: Seleção de tipo (sem modelos) → lista de gênero');
  console.log('-'.repeat(60));
  
  let contexto = {
    nomeCliente: 'Pablo',
    faseAtual: 'filtro',
    aguardandoResposta: 'tipo_produto',
    ultimaListaEnumerada: {
      tipo_lista: 'tipos_produto',
      itens: [
        { numero: 1, valor: 'gorro' },
        { numero: 2, valor: 'avental' }
      ]
    },
    caracteristicasMencionadas: [],
    modelosSolicitados: [],
    coresDisponiveis: []
  };

  let resultado = await processarBloco2('1', contexto, numeroUsuario);
  
  console.log('\n✉️  Resposta:', resultado.mensagem.substring(0, 200) + '...');
  console.log('📊 Lista Enumerada:', resultado.listaEnumerada ? 'SIM ✅' : 'NÃO ❌');
  console.log('🎯 Tipo Lista:', resultado.listaEnumerada?.tipo_lista);
  console.log('⏳ Aguardando:', resultado.contextoAtualizado.aguardandoResposta);
  
  if (resultado.listaEnumerada?.tipo_lista !== 'generos') {
    console.log('❌ FALHA: Deveria mostrar lista de gêneros!');
    return;
  }
  
  console.log('✅ Lista de gêneros apresentada corretamente\n');

  // ====================================================================
  // CENÁRIO 2: Cliente seleciona gênero da lista → deve processar e pedir cor
  // ====================================================================
  console.log('📋 CENÁRIO 2: Seleção de gênero (opção 2 = Feminino)');
  console.log('-'.repeat(60));
  
  contexto = {
    ...resultado.contextoAtualizado,
    ultimaListaEnumerada: resultado.listaEnumerada
  };

  resultado = await processarBloco2('2', contexto, numeroUsuario);
  
  console.log('\n✉️  Resposta:', resultado.mensagem.substring(0, 200) + '...');
  console.log('👤 Gênero Capturado:', resultado.contextoAtualizado.genero || 'NENHUM ❌');
  console.log('📊 Lista Enumerada:', resultado.listaEnumerada ? 'SIM ✅' : 'NÃO ❌');
  console.log('🎯 Tipo Lista:', resultado.listaEnumerada?.tipo_lista);
  console.log('⏳ Aguardando:', resultado.contextoAtualizado.aguardandoResposta);
  
  if (resultado.contextoAtualizado.genero !== 'feminino') {
    console.log('❌ FALHA: Gênero não foi capturado corretamente!');
    console.log('   Esperado: feminino');
    console.log('   Recebido:', resultado.contextoAtualizado.genero);
    return;
  }
  
  if (resultado.listaEnumerada?.tipo_lista !== 'cores') {
    console.log('❌ FALHA: Deveria mostrar lista de cores agora!');
    return;
  }
  
  console.log('✅ Gênero processado e lista de cores apresentada\n');

  // ====================================================================
  // CENÁRIO 3: Cliente responde com texto "feminino" → deve detectar
  // ====================================================================
  console.log('📋 CENÁRIO 3: Resposta por texto "feminino" (sem número)');
  console.log('-'.repeat(60));
  
  contexto = {
    nomeCliente: 'Pablo',
    faseAtual: 'filtro',
    tipoProduto: 'gorro',
    modelo: null,
    aguardandoResposta: 'genero',
    ultimaListaEnumerada: {
      tipo_lista: 'generos',
      itens: [
        { numero: 1, valor: 'Masculino' },
        { numero: 2, valor: 'Feminino' },
        { numero: 3, valor: 'Unissex' }
      ]
    },
    caracteristicasMencionadas: ['tipo'],
    modelosSolicitados: [],
    coresDisponiveis: []
  };

  resultado = await processarBloco2('feminino', contexto, numeroUsuario);
  
  console.log('\n✉️  Resposta:', resultado.mensagem.substring(0, 200) + '...');
  console.log('👤 Gênero Capturado:', resultado.contextoAtualizado.genero || 'NENHUM ❌');
  console.log('📊 Lista Enumerada:', resultado.listaEnumerada ? 'SIM ✅' : 'NÃO ❌');
  console.log('🎯 Tipo Lista:', resultado.listaEnumerada?.tipo_lista);
  
  if (resultado.contextoAtualizado.genero !== 'feminino') {
    console.log('❌ FALHA: Gênero não foi detectado por texto!');
    return;
  }
  
  console.log('✅ Gênero detectado por texto corretamente\n');

  // ====================================================================
  // CENÁRIO 4: Cliente com tipo e modelo → deve mostrar lista de gênero
  // ====================================================================
  console.log('📋 CENÁRIO 4: Com tipo e modelo → lista de gênero');
  console.log('-'.repeat(60));
  
  contexto = {
    nomeCliente: 'Pablo',
    faseAtual: 'filtro',
    tipoProduto: 'gorro',
    modelo: 'toca cirurgica',
    aguardandoResposta: 'modelo',
    ultimaListaEnumerada: {
      tipo_lista: 'modelos',
      itens: [
        { numero: 1, valor: 'toca cirurgica' }
      ]
    },
    caracteristicasMencionadas: ['tipo'],
    modelosSolicitados: [],
    coresDisponiveis: []
  };

  resultado = await processarBloco2('1', contexto, numeroUsuario);
  
  console.log('\n✉️  Resposta:', resultado.mensagem.substring(0, 200) + '...');
  console.log('📊 Lista Enumerada:', resultado.listaEnumerada ? 'SIM ✅' : 'NÃO ❌');
  console.log('🎯 Tipo Lista:', resultado.listaEnumerada?.tipo_lista);
  console.log('🏷️  Modelo Capturado:', resultado.contextoAtualizado.modelo || 'NENHUM ❌');
  
  if (resultado.listaEnumerada?.tipo_lista !== 'generos') {
    console.log('❌ FALHA: Deveria mostrar lista de gêneros após selecionar modelo!');
    return;
  }
  
  console.log('✅ Lista de gêneros após modelo correta\n');

  // ====================================================================
  // RESUMO FINAL
  // ====================================================================
  console.log('='.repeat(60));
  console.log('✅ TODOS OS CENÁRIOS PASSARAM!');
  console.log('='.repeat(60));
  console.log('Funcionalidades validadas:');
  console.log('  ✅ Lista de gêneros apresentada após tipo');
  console.log('  ✅ Seleção de gênero por número funciona');
  console.log('  ✅ Detecção de gênero por texto funciona');
  console.log('  ✅ Lista de gêneros apresentada após modelo');
  console.log('  ✅ Transição para lista de cores funciona');
  console.log();
}

testarFluxoGenero().catch(error => {
  console.error('❌ ERRO NO TESTE:', error);
  process.exit(1);
});
