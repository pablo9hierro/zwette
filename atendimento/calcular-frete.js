/**
 * ================================================================
 * MÓDULO: Calcular Frete
 * Calcula frete na API Magazord para CADA produto individualmente
 * Retorna o range (mínimo e máximo) de frete dos produtos
 * ================================================================
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const MAGAZORD_URL = process.env.MAGAZORD_URL || 'https://urlmagazord.com.br/api';
const MAGAZORD_USER = process.env.MAGAZORD_USER;
const MAGAZORD_PASSWORD = process.env.MAGAZORD_PASSWORD;

/**
 * Calcula frete para UM produto
 * @param {String} cep - CEP do cliente (apenas números)
 * @param {Object} produto - Produto com SKU/codigo e preco
 * @returns {Object} Opções de frete
 */
export async function calcularFrete(cep, produto) {
  console.log(`\n📦 Calculando frete para CEP ${cep}...`);
  console.log(`   📦 Produto: ${produto.nome || 'N/A'}`);
  
  try {
    // Validar CEP
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      throw new Error('CEP inválido. Digite apenas os 8 números do CEP.');
    }
    
    // Validar se tem produto
    if (!produto) {
      throw new Error('Nenhum produto encontrado para calcular frete');
    }
    
    // Extrair SKU e preço do produto
    let skuProduto = produto.codigo || produto.sku;
    const precoProduto = produto.preco || produto.valor || 80; // Valor padrão se não tiver
    
    // 🎯 REMOVER SUFIXO DE TAMANHO DO SKU PARA API DE FRETE
    // Magazord usa SKU sem sufixo de tamanho
    // Exemplos: 
    //   "070-SD-002-002-M5" → "070-SD-002-002-M"
    //   "700-SD-080-000-FFa" → "700-SD-080-000-F"
    //   "371-SD-015-000-M5" → "371-SD-015-000-M"
    if (skuProduto && skuProduto.includes('-')) {
      // Pega até o último hífen + a primeira letra após ele
      const partes = skuProduto.split('-');
      if (partes.length > 0) {
        const ultimaParte = partes[partes.length - 1];
        // Se a última parte terminar com dígitos ou múltiplas letras (M5, FFa, etc)
        if (ultimaParte.length > 1) {
          // Mantém apenas a primeira letra
          partes[partes.length - 1] = ultimaParte.charAt(0);
          const skuSemSufixo = partes.join('-');
          console.log(`   🔄 Convertendo SKU: ${skuProduto} → ${skuSemSufixo}`);
          skuProduto = skuSemSufixo;
        }
      }
    }
    
    console.log(`   ✅ SKU para frete: ${skuProduto}`);
    console.log(`   💰 Valor do produto: R$ ${precoProduto}`);
    
    // 🎯 CALCULAR FRETE DO PRODUTO
    console.log('   📡 Consultando API Magazord...');
    
    const response = await axios.post(
      `${MAGAZORD_URL}/v2/site/transporte/simulacao`,
      {
        cep: cepLimpo,
        loja: 1,
        consideraRegraFrete: true,
        produtos: [{
          sku: skuProduto,
          quantidade: 1,
          valor: precoProduto
        }]
      },
      {
        auth: {
          username: MAGAZORD_USER,
          password: MAGAZORD_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    if (response.data?.status === 'success' && response.data?.data) {
      const dadosFrete = response.data.data;
      
      // Extrair cidade/estado
      const partes = dadosFrete.cidade ? dadosFrete.cidade.split('/') : [];
      const cidadeEstado = {
        cidade: partes[0] || 'N/A',
        estado: partes[1] || 'N/A'
      };
      
      // Extrair opções de frete
      const opcoesFrete = [];
      if (dadosFrete.entrega && dadosFrete.entrega[0] && dadosFrete.entrega[0].agencias) {
        dadosFrete.entrega[0].agencias.forEach(agencia => {
          if (agencia.servico && Array.isArray(agencia.servico)) {
            agencia.servico.forEach(servico => {
              opcoesFrete.push({
                tipo: servico.nome || servico.nomeTransportadora,
                valor: parseFloat(servico.valor || 0),
                prazo: parseInt(servico.prazoFinal || servico.prazoInicial || 0),
                prazoDescricao: `${servico.prazoFinal || servico.prazoInicial || 0} dias úteis`
              });
            });
          }
        });
      }
      
      // Ordenar por valor (mais barato primeiro)
      opcoesFrete.sort((a, b) => a.valor - b.valor);
      
      console.log(`✅ Frete calculado: ${opcoesFrete.length} opções disponíveis`);
      
      return {
        sucesso: true,
        cep: cepLimpo,
        cidade: cidadeEstado.cidade,
        estado: cidadeEstado.estado,
        opcoes: opcoesFrete,
        produto: produto.nome || 'Produto'
      };
    } else {
      throw new Error('API não retornou dados de frete');
    }
    
  } catch (erro) {
    console.error(`❌ Erro ao calcular frete: ${erro.message}`);
    
    // Log detalhado do erro
    if (erro.response) {
      console.error(`   📊 Status: ${erro.response.status}`);
      console.error(`   📊 Dados:`, JSON.stringify(erro.response.data, null, 2));
    }
    
    return {
      sucesso: false,
      erro: erro.message,
      detalhes: erro.response?.data || null,
      mensagemUsuario: 'Não foi possível calcular o frete. Verifique o CEP e tente novamente.'
    };
  }
}

/**
 * Formata resultado do frete para mensagem WhatsApp
 * Mostra RANGE de preços (min-max) quando houver variação
 * @param {Object} resultadoFrete - Resultado do cálculo de frete
 * @returns {String} Mensagem formatada
 */
export function formatarMensagemFrete(resultadoFrete) {
  if (!resultadoFrete.sucesso) {
    return `❌ ${resultadoFrete.mensagemUsuario}`;
  }
  
  let mensagem = `📦 *Frete para ${resultadoFrete.cidade} - ${resultadoFrete.estado}*\n`;
  mensagem += `📍 CEP: ${resultadoFrete.cep}\n`;
  if (resultadoFrete.produto) {
    mensagem += `📦 Produto: ${resultadoFrete.produto}\n`;
  }
  mensagem += `\n`;
  
  if (resultadoFrete.opcoes && resultadoFrete.opcoes.length > 0) {
    mensagem += `*Opções de entrega:*\n\n`;
    
    resultadoFrete.opcoes.forEach((opcao, index) => {
      const emoji = opcao.tipo.toLowerCase().includes('sedex') ? '✈️' : '🚚';
      mensagem += `${emoji} *${opcao.tipo}*\n`;
      mensagem += `   💰 R$ ${opcao.valor.toFixed(2)}\n`;
      mensagem += `   📅 ${opcao.prazoDescricao}\n\n`;
    });
    
    // Encontrar opção mais barata e mais rápida
    const maisBarato = resultadoFrete.opcoes.reduce((min, op) => 
      op.valor < min.valor ? op : min
    );
    const maisRapido = resultadoFrete.opcoes.reduce((min, op) => 
      op.prazo < min.prazo ? op : min
    );
    
    if (resultadoFrete.opcoes.length > 1) {
      mensagem += `💡 *Dica:*\n`;
      mensagem += `   • Mais econômico: ${maisBarato.tipo} - R$ ${maisBarato.valor.toFixed(2)}\n`;
      mensagem += `   • Mais rápido: ${maisRapido.tipo} - ${maisRapido.prazoDescricao}\n`;
    }
  } else {
    mensagem += `⚠️ Nenhuma opção de frete disponível para este CEP.`;
  }
  
  return mensagem;
}

/**
 * Valida formato de CEP
 * @param {String} cep - CEP fornecido pelo usuário
 * @returns {Boolean} True se válido
 */
export function validarCEP(cep) {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.length === 8;
}
