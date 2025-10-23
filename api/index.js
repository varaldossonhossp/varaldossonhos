// ============================================================
// 💙 VARAL DOS SONHOS — /api/index.js (versão 2025)
// ------------------------------------------------------------
// API única compatível com plano gratuito Vercel
// Rotas incluídas:
//   • /api/health
//   • /api/eventos
//   • /api/cartinhas
//   • /api/pontosdecoleta
// ============================================================

import Airtable from "airtable";
export const config = { runtime: "nodejs" };

// ============================================================
// 🧰 Funções auxiliares
// ============================================================
function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data, null, 2));
}

async function tableExists(base, name) {
  try {
    await base(name).select({ maxRecords: 1 }).firstPage();
    return true;
  } catch {
    return false;
  }
}

async function findTable(base, candidates) {
  for (const t of candidates) {
    if (await tableExists(base, t)) return t;
  }
  return null;
}

function firstImageUrl(fields, keys) {
  for (const k of keys) {
    const v = fields?.[k];
    if (Array.isArray(v) && v[0]?.url) return v[0].url;
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  return null;
}

// ============================================================
// 🌈 HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.end();
    return;
  }

  const { method, url, headers } = req;
  const baseUrl = new URL(url, `http://${headers.host}`);
  const pathname = baseUrl.pathname;

  // ============================================================
  // 🩺 /api/health — Diagnóstico
  // ============================================================
  if (pathname === "/api/health") {
    const envs = ["AIRTABLE_API_KEY", "AIRTABLE_BASE_ID"];
    const result = {};
    for (const e of envs) result[e] = !!process.env[e];
    return sendJson(res, 200, { ok: true, runtime: "nodejs", env: result });
  }

  // ============================================================
  // 🔑 Conexão com Airtable
  // ============================================================
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return sendJson(res, 500, {
      erro: "⚠️ Variáveis Airtable ausentes no ambiente.",
    });
  }

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

  try {
    // ============================================================
    // 🗓️ /api/eventos — eventos em destaque
    // ============================================================
    if (pathname === "/api/eventos" && method === "GET") {
      const tabelaEventos =
        (await findTable(base, ["eventos", "Eventos", "EVENTOS"])) || "eventos";

      const records = await base(tabelaEventos)
        .select({
          filterByFormula: "IF({destaque_home}=TRUE(), TRUE(), FALSE())",
          sort: [{ field: "data_inicio", direction: "asc" }],
        })
        .all();

      const eventos = records.map((r) => ({
        id: r.id,
        nome: r.fields.nome_evento || r.fields.nome || "Evento sem nome",
        data_inicio: r.fields.data_inicio || "",
        descricao: r.fields.descricao || "",
        imagem:
          firstImageUrl(r.fields, [
            "imagem_evento",
            "Imagem_evento",
            "imagem",
          ]) || "/imagens/evento-padrao.jpg",
      }));

      return sendJson(res, 200, eventos);
    }

    // ============================================================
    // 💌 /api/cartinhas — lista de cartinhas
    // ============================================================
    if (pathname === "/api/cartinhas" && method === "GET") {
      const tabelaCartinhas =
        (await findTable(base, [
          "cartinhas",
          "Cartinhas",
          "Cartas",
          "Varal",
          "Varal Virtual",
          "varal",
        ])) || null;

      if (!tabelaCartinhas) {
        return sendJson(res, 500, {
          erro: "Tabela de cartinhas não encontrada no Airtable.",
        });
      }

      const records = await base(tabelaCartinhas)
        .select({ sort: [{ field: "nome", direction: "asc" }], maxRecords: 100 })
        .all();

      const cartinhas = records.map((r) => ({
        id: r.id,
        nome: r.fields.nome || r.fields.crianca || "Criança",
        idade: r.fields.idade || "",
        carta: r.fields.carta || r.fields.mensagem || r.fields.texto || "",
        imagem:
          firstImageUrl(r.fields, [
            "imagem",
            "foto",
            "anexo",
            "imagem_carta",
            "scan",
          ]) || "/imagens/cartinha-padrao.png",
      }));

      return sendJson(res, 200, cartinhas);
    }

    // ============================================================
    // 📍 /api/pontosdecoleta — locais de coleta
    // ============================================================
    if (pathname === "/api/pontosdecoleta" && method === "GET") {
      const tabelaPontos =
        (await findTable(base, [
          "pontosdecoleta",
          "Pontos de Coleta",
          "pontos",
          "Locais de Coleta",
        ])) || null;

      if (!tabelaPontos) {
        return sendJson(res, 500, {
          erro: "Tabela de pontos de coleta não encontrada no Airtable.",
        });
      }

      const records = await base(tabelaPontos)
        .select({ sort: [{ field: "nome", direction: "asc" }] })
        .all();

      const pontos = records.map((r) => ({
        id: r.id,
        nome: r.fields.nome || r.fields.local || "Ponto de Coleta",
        endereco: r.fields.endereco || "",
        cidade: r.fields.cidade || "",
        estado: r.fields.estado || "",
        contato: r.fields.contato || "",
        imagem:
          firstImageUrl(r.fields, [
            "imagem",
            "foto",
            "anexo",
            "imagem_ponto",
          ]) || "/imagens/ponto-padrao.jpg",
      }));

      return sendJson(res, 200, pontos);
    }

    // ============================================================
    // 🚫 Rota inexistente
    // ============================================================
    return sendJson(res, 404, { erro: "Rota não encontrada." });
  } catch (erro) {
    console.error("❌ Erro interno:", erro);
    return sendJson(res, 500, {
      erro: "Erro interno no servidor.",
      detalhe: erro.message || String(erro),
    });
  }
}
