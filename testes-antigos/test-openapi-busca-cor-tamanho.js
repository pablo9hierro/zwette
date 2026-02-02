import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';

// Config OpenAPI (BasicAuth via .env)
const MAGAZORD = {
  baseURL: process.env.MAGAZORD_URL,
  auth: {
    username: process.env.MAGAZORD_USER,
    password: process.env.MAGAZORD_PASSWORD,
  },
  headers: { 'Content-Type': 'application/json' },
};

// Caminho masculino.json
const CAMINHO_JSON = 'c:/Users/pablo/OneDrive/Documentos/scraper/output/masculino.json';

function carregarJSON() {
  const raw = fs.readFileSync(CAMINHO_JSON, 'utf8');
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [data];
}

function extrairCodigoPossivelDaImagem(url) {
  if (!url) return null;
  // Tenta extrair um possível ID/código do caminho: .../produto/1757/lancamento-1.png
  const m = url.match(/\/produto\/(\w+)[\/]/i);
  return m ? m[1] : null; // Pode ser um número (ID de mídia) e não SKU; usaremos como tentativa
}

async function listarProdutosPorNome(nome) {
  const resp = await axios.get(`/v2/site/produto?nome=${encodeURIComponent(nome)}&limit=20`, MAGAZORD);
  return resp.data?.data?.items || [];
}

async function consultarProdutoPorCodigo(codigoProduto) {
  const resp = await axios.get(`/v2/site/produto/${encodeURIComponent(codigoProduto)}`, MAGAZORD);
  return resp.data?.data || resp.data;
}

async function consultarDerivacao(codigoProduto, codigoDerivacao) {
  const resp = await axios.get(`/v2/site/produto/${encodeURIComponent(codigoProduto)}/derivacao/${encodeURIComponent(codigoDerivacao)}`, MAGAZORD);
  return resp.data?.data || resp.data;
}

function normalizarTexto(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function combinaCorTamanho(derivacaoDetalhe, alvoCor, alvoTamanho) {
  const corAlvo = normalizarTexto(alvoCor);
  const tamAlvo = normalizarTexto(alvoTamanho);
  const valores = (derivacaoDetalhe.derivacoes || []).map(d => normalizarTexto(d.valor));
  const temCor = corAlvo ? valores.some(v => v.includes(corAlvo)) : true;
  const temTam = tamAlvo ? valores.some(v => v.includes(tamAlvo)) : true;
  return temCor && temTam;
}

async function testarItem(item) {
  const nomeBusca = item.nomeCompleto ? item.nomeCompleto.split(' - ')[0] : (item.nome || '');
  const cor = item.cor || item.color || null;
  const tamanho = item.tamanho || item.size || null;
  const possivelCodigoImagem = extrairCodigoPossivelDaImagem(item.imagem);

  const resultado = {
    input: { nome: nomeBusca, cor, tamanho, imagemCodigo: possivelCodigoImagem },
    estrategia: [],
    encontrado: false,
    disponivel: false,
    matches: [],
  };

  // Estratégia A: Consultar por código do produto (SKU) se conseguirmos descobrir
  if (item.codigoProduto) {
    try {
      const produto = await consultarProdutoPorCodigo(item.codigoProduto);
      resultado.estrategia.push({ tipo: 'codigoProduto', codigo: item.codigoProduto, ok: true });
      resultado.encontrado = true;
      resultado.matches.push(produto);
    } catch (e) {
      resultado.estrategia.push({ tipo: 'codigoProduto', codigo: item.codigoProduto, ok: false, erro: e.message });
    }
  }

  // Estratégia B: Buscar por nome
  if (!resultado.encontrado && nomeBusca) {
    try {
      const produtos = await listarProdutosPorNome(nomeBusca);
      resultado.estrategia.push({ tipo: 'nome', termo: nomeBusca, resultados: produtos.length });
      if (produtos.length > 0) {
        resultado.encontrado = true;
        resultado.matches = produtos;
      }
    } catch (e) {
      resultado.estrategia.push({ tipo: 'nome', termo: nomeBusca, ok: false, erro: e.message });
    }
  }

  // Se encontrou, tenta filtrar por cor/tamanho nas derivações documentadas
  if (resultado.encontrado && resultado.matches.length > 0) {
    // Pega o primeiro match mais parecido
    const p = resultado.matches[0];
    const codigoPai = p.codigo; // SKU Pai
    const derivacoes = Array.isArray(p.derivacoes) ? p.derivacoes : [];

    let houveMatchDerivacao = false;
    for (const der of derivacoes) {
      try {
        const detalhe = await consultarDerivacao(codigoPai, der.codigo);
        const ok = combinaCorTamanho(detalhe, cor, tamanho);
        if (ok) {
          houveMatchDerivacao = true;
          // disponibilidade baseada em 'ativo' e presença em lojas
          const ativo = !!detalhe.ativo;
          const temLoja = Array.isArray(detalhe.lojas) ? detalhe.lojas.length > 0 : false;
          resultado.disponivel = ativo && temLoja; // espelho do site: ativo + relacionado a loja
          break;
        }
      } catch (e) {
        // ignora erros de derivação específica
      }
    }

    // Se não encontrou por cor/tamanho, considera disponível se produto ativo
    if (!houveMatchDerivacao) {
      resultado.disponivel = !!p.ativo;
    }
  }

  return resultado;
}

async function main() {
  const itens = carregarJSON().slice(0, 10); // limita para testes
  const resultados = [];
  for (const item of itens) {
    try {
      const r = await testarItem(item);
      resultados.push(r);
      await new Promise(res => setTimeout(res, 300));
    } catch (e) {
      resultados.push({ erro: e.message, input: { nome: item.nome } });
    }
  }

  // Relatório
  console.log('===== RELATÓRIO BUSCA POR COR/TAMANHO (OpenAPI) =====');
  for (const r of resultados) {
    console.log(`\nProduto: ${r.input?.nome}`);
    if (r.encontrado) {
      console.log(`  → Encontrado. Disponível: ${r.disponivel ? 'SIM' : 'NÃO'}`);
      console.log(`  → Estratégias:`, r.estrategia.map(e => e.tipo).join(', '));
    } else {
      console.log('  → Não encontrado.');
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
