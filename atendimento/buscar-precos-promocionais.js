/**
 * ================================================================
 * MÓDULO: Buscar Preços Promocionais
 * Consulta preços atualizados na API Magazord e identifica promoções
 * ================================================================
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const MAGAZORD_URL = process.env.MAGAZORD_URL || 'https://urlmagazord.com.br/api';
const MAGAZORD_USER = process.env.MAGAZORD_USER;
const MAGAZORD_PASSWORD = process.env.MAGAZORD_PASSWORD;

/**
 * Busca preços e promoções de múltiplos produtos
 * @param {Array} produtos - Array de produtos com SKU
 * @returns {Array} Produtos com preços e informações de promoção
 */
export async function buscarPrecosPromocionais(produtos) {
  console.log(`\n🏷️ Buscando preços promocionais de ${produtos.length} produtos...`);
  
  const produtosComPreco = [];
  
  for (const produto of produtos) {
    try {
      // Buscar informações detalhadas do produto na API
      const response = await axios.get(
        `${MAGAZORD_URL}/v2/site/produto/${produto.codigo}`,
        {
          auth: {
            username: MAGAZORD_USER,
            password: MAGAZORD_PASSWORD
          },
          timeout: 5000
        }
      );
      
      if (response.data?.status === 'success' && response.data?.data) {
        const produtoAPI = response.data.data;
        
        // Verificar se tem preço promocional
        const precoNormal = produtoAPI.preco || null;
        const precoPromocional = produtoAPI.precoPromocional || null;
        const emPromocao = precoPromocional && precoPromocional < precoNormal;
        
        let economia = 0;
        let percentualDesconto = 0;
        
        if (emPromocao) {
          economia = precoNormal - precoPromocional;
          percentualDesconto = Math.round((economia / precoNormal) * 100);
          console.log(`   ✅ ${produto.nome}: R$ ${precoPromocional.toFixed(2)} (era R$ ${precoNormal.toFixed(2)} - ${percentualDesconto}% OFF)`);
        }
        
        produtosComPreco.push({
          ...produto,
          precoNormal,
          precoPromocional,
          emPromocao,
          economia,
          percentualDesconto
        });
        
      } else {
        // Se API não retornar dados, manter produto sem informação de preço
        produtosComPreco.push({
          ...produto,
          precoNormal: null,
          precoPromocional: null,
          emPromocao: false,
          economia: 0,
          percentualDesconto: 0
        });
      }
      
    } catch (erro) {
      // Erro na API: silenciar 404 (produto não cadastrado) e manter sem preço
      if (erro.response?.status !== 404) {
        console.log(`   ⚠️ Erro ao buscar preço de ${produto.nome}: ${erro.message}`);
      }
      produtosComPreco.push({
        ...produto,
        precoNormal: null,
        precoPromocional: null,
        emPromocao: false,
        economia: 0,
        percentualDesconto: 0
      });
    }
  }
  
  console.log(`✅ Preços consultados: ${produtosComPreco.filter(p => p.emPromocao).length} em promoção`);
  
  return produtosComPreco;
}

/**
 * Ordena produtos: promocionais primeiro, depois normais
 * @param {Array} produtos - Produtos com informação de promoção
 * @returns {Array} Produtos ordenados
 */
export function ordenarPorPromocao(produtos) {
  return produtos.sort((a, b) => {
    // Produtos em promoção vêm primeiro
    if (a.emPromocao && !b.emPromocao) return -1;
    if (!a.emPromocao && b.emPromocao) return 1;
    
    // Se ambos em promoção, ordenar por maior desconto
    if (a.emPromocao && b.emPromocao) {
      return b.percentualDesconto - a.percentualDesconto;
    }
    
    // Se nenhum em promoção, manter ordem original
    return 0;
  });
}

/**
 * Formata lista de produtos com informações de promoção
 * @param {Array} produtos - Produtos com preços
 * @returns {String} Lista formatada para WhatsApp
 */
export function formatarListaComPromocoes(produtos) {
  let mensagem = '';
  
  produtos.forEach((produto, index) => {
    const numero = index + 1;
    
    if (produto.emPromocao) {
      // Produto em promoção: mostrar preço e economia
      mensagem += `${numero}. 🎁 *${produto.nome}*\n`;
      mensagem += `   💰 R$ ${produto.precoPromocional.toFixed(2)} `;
      mensagem += `~~R$ ${produto.precoNormal.toFixed(2)}~~\n`;
      mensagem += `   💚 Economize R$ ${produto.economia.toFixed(2)} (${produto.percentualDesconto}% OFF!)\n`;
      mensagem += `   🔗 ${produto.link}\n\n`;
    } else {
      // Produto normal: apenas nome e link
      mensagem += `${numero}. *${produto.nome}*\n`;
      mensagem += `   🔗 ${produto.link}\n\n`;
    }
  });
  
  return mensagem;
}
