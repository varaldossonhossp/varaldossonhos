// ============================================================
// 💙 VARAL DOS SONHOS — /api/index.js
// VERSÃO OTIMIZADA PARA VERCEL PRO (NODE 20)
// ============================================================

import Airtable from "airtable";

// 🔧 Forçar execução como função Node.js (não Edge)
export const config = { runtime: "nodejs" };

// ============================================================
// ⚙️ Funções auxiliares
// ============================================================
function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data, null, 2));
}

async function parseJsonBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    return null;
  }
}

// ============================================================
// 🌈 HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  // ✅ Pré-flight CORS
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
  // 🩺 /api/health — Diagnóstico de ambiente
  // ============================================================
  if (pathname === "/api/health") {
    const envs = [
      "AIRTABLE_API_KEY",
      "AIRTABLE_BASE_ID",
      "EMAILJS_SERVICE_ID",
      "EMAILJS_TEMPLATE_ID",
      "EMAILJS_PUBLIC_KEY"
    ];
    const result = {};
    for (const e of envs) result[e] = !!process.env[e];
    return sendJson(res, 200, {
      ok: true,
      runtime: "nodejs",
      env: result
    });
  }

  // ============================================================
  // 🔑 Configuração do Airtable
  // ============================================================
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return sendJson(res, 500, { error: "⚠️ Variáveis Airtable ausentes no ambiente Vercel." });
  }

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

  try {
    // ============================================================
    // 🗓️ EVENTOS — Destaques (Home / Carrossel)
    // ============================================================
    if (pathname === "/api/eventos" && method === "GET") {
      const records = await base("eventos")
        .select({
          filterByFormula: "IF({destaque_home}=TRUE(), TRUE(), FALSE())",
          sort: [{ field: "data_inicio", direction: "asc" }]
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
          "/imagens/evento-padrao.jpg"
      }));

      return sendJson(res, 200, eventos);
    }

    // ============================================================
    // 📅 EVENTOS-TODOS — Lista completa
    // ============================================================
    if (pathname === "/api/eventos-todos" && method === "GET") {
      const records = await base("eventos").select({ sort: [{ field: "data_inicio", direction: "asc" }] }).all();

      const eventos = (records || []).map((r) => ({
        id: r.id,
        nome: r.fields.nome_evento || r.fields.nome || "Evento sem nome",
        data_inicio: r.fields.data_inicio || "",
        data_fim: r.fields.data_fim || "",
        descricao: r.fields.descricao || "",
        local: r.fields.local || r.fields.escola_local || "",
        status: r.fields.status || "",
        imagem:
          r.fields.imagem_evento?.[0]?.url ||
          r.fields.Imagem_evento?.[0]?.url ||
          "/imagens/evento-padrao.jpg"
      }));

      return sendJson(res, 200, eventos);
    }

    // ============================================================
    // 🚫 Rota não encontrada
    // ============================================================
    return sendJson(res, 404, { erro: "Rota não encontrada." });
  } catch (erro) {
    console.error("❌ Erro interno:", erro);
    return sendJson(res, 500, {
      erro: "Erro interno no servidor.",
      detalhe: erro.message || String(erro)
    });
  }
}
