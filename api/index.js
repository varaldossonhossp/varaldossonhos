// ============================================================
// 💙 VARAL DOS SONHOS — /api/index.js
// ------------------------------------------------------------
// Reúne todas as rotas da aplicação:
//   • /api/eventos
//   • /api/cartinhas
//   • /api/health
// ============================================================

import Airtable from "airtable";

// 🔧 Forçar execução no runtime Node.js
export const config = { runtime: "nodejs" };

// ============================================================
// 🧰 Funções utilitárias
// ============================================================
function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data, null, 2));
}

// ============================================================
// 🌈 HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  // ⚙️ Suporte a CORS pré-flight
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
  // 🔑 Conexão com o Airtable
  // ============================================================
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return sendJson(res, 500, { erro: "⚠️ Variáveis Airtable ausentes no ambiente." });
  }

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

  try {
    // ============================================================
    // 🗓️ /api/eventos — eventos em destaque
    // ============================================================
    if (pathname === "/api/eventos" && method === "GET") {
      const records = await base("eventos")
        .select({
          filterByFormula: "IF({destaque_home}=TRUE(), TRUE(), FALSE())",
          sort: [{ field: "data_inicio", direction: "asc" }],
        })
        .all();

      const eventos = (records || []).map((r) => ({
        id: r.id,
        nome: r.fields.nome_evento || r.fields.nome || "Evento sem nome",
        data_inicio: r.fields.data_inicio || "",
        descricao: r.fields.descricao || "",
        imagem:
          r.fields.imagem_evento?.[0]?.url ||
          r.fields.Imagem_evento?.[0]?.url ||
          "/imagens/evento-padrao.jpg",
      }));

      return sendJson(res, 200, eventos);
    }

    // ============================================================
    // 💌 /api/cartinhas — lista de cartinhas disponíveis
    // ============================================================
    if (pathname === "/api/cartinhas" && method === "GET") {
      const records = await base("cartinhas")
        .select({
          sort: [{ field: "nome", direction: "asc" }],
        })
        .all();

      const cartinhas = (records || []).map((r) => ({
        id: r.id,
        nome: r.fields.nome || "Criança",
        idade: r.fields.idade || "",
        carta: r.fields.carta || r.fields.mensagem || "",
        imagem: r.fields.imagem?.[0]?.url || "/imagens/cartinha-padrao.png",
      }));

      return sendJson(res, 200, cartinhas);
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
