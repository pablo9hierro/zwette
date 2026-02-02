import { executarBuscarProduto } from './tools/buscar-produto/executar-buscar-produto.js';

async function testar() {
    console.log('=== TESTANDO JALECOS ===');
    let requisicao = {
        acao: 'buscar_produto',
        parametros: {
            nome: 'manuela',
            limit: 1
        }
    };
    
    let resultado = await executarBuscarProduto(requisicao);
    resultado.data.items.forEach(p => {
        console.log(`\n${p.nome}`);
        console.log(`Link: ${p.link}`);
    });
    
    console.log('\n\n=== TESTANDO GORROS ===');
    requisicao = {
        acao: 'buscar_produto',
        parametros: {
            nome: 'gorro',
            limit: 2
        }
    };
    
    resultado = await executarBuscarProduto(requisicao);
    resultado.data.items.forEach(p => {
        console.log(`\n${p.nome}`);
        console.log(`Link: ${p.link}`);
    });
}

testar();
