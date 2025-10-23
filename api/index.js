// ============================================================
// 💙 VARAL DOS SONHOS — /api/index.js
// ------------------------------------------------------------
// API única — compatível com o plano gratuito da Vercel
// ------------------------------------------------------------
// Rotas internas:
//   • GET  /api/health
//   • GET  /api/eventos
//   • GET  /api/cartinhas
//   • GET  /api/pontosdecoleta
//   • POST /api/login
//   • POST /api/cadastro
// ============================================================

import Airtable from "airtable";

// 🔧 Força execução no runtime Node.js
export const config = { runtime: "nodejs" };

// ============================================================
// 🧰 Função utilitária para enviar respostas JSON
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
// 🌈 Handler principal
// ============================================================
export default async function handler(req, res) {
  // ✅ Suporte a CORS (pré-flight)
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
  // 🔐 Conexão com o Airtable
  // ============================================================
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return sendJson(res, 500, { erro: "⚠️ Variáveis do Airtable ausentes no ambiente." });
  }
  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

  try {
    // ============================================================
    // 🩺 /api/health
    // ============================================================
    if (pathname === "/api/health") {
      const envs = ["AIRTABLE_API_KEY", "AIRTABLE_BASE_ID"];
      const result = {};
      for (const e of envs) result[e] = !!process.env[e];
      return sendJson(res, 200, { ok: true, runtime: "nodejs", env: result });
    }

    // ============================================================
    // 🗓️ /api/eventos
    // ============================================================
    if (pathname === "/api/eventos" && method === "GET") {
      const records = await base("eventos")
        .select({ sort: [{ field: "data_inicio", direction: "asc" }] })
        .all();

      const eventos = records.map((r) => ({
        id: r.id,
        nome: r.fields.nome_evento || r.fields.nome || "Evento sem nome",
        descricao: r.fields.descricao || "",
        data_inicio: r.fields.data_inicio || "",
        imagem: r.fields.imagem_evento?.[0]?.url || "/imagens/evento-padrao.jpg",
      }));
      return sendJson(res, 200, eventos);
    }

    // ============================================================
    // 💌 /api/cartinhas
    // ============================================================
    if (pathname === "/api/cartinhas" && method === "GET") {
      const records = await base("cartinhas").select({
        sort: [{ field: "nome_crianca", direction: "asc" }],
      }).all();

      const cartinhas = records.map((r) => ({
        id: r.id,
        nome: r.fields.nome_crianca || r.fields.primeiro_nome || "Criança",
        idade: r.fields.idade || "",
        sonho: r.fields.sonho || "",
        imagem: r.fields.imagem_cartinha?.[0]?.url || "/imagens/cartinha-padrao.png",
      }));

      return sendJson(res, 200, cartinhas);
    }

    // ============================================================
    // 📍 /api/pontosdecoleta
    // ============================================================
    if (pathname === "/api/pontosdecoleta" && method === "GET") {
      const records = await base("pontosdecoleta").select({
        sort: [{ field: "nome_local", direction: "asc" }],
      }).all();

      const pontos = records.map((r) => ({
        id: r.id,
        nome: r.fields.nome_local,
        endereco: r.fields.endereco,
        telefone: r.fields.telefone,
        email: r.fields.email,
        horario_funcionamento: r.fields.horario_funcionamento,
        responsavel: r.fields.responsavel,
      }));

      return sendJson(res, 200, pontos);
    }

    // ============================================================
    // 🔑 /api/login — autenticação de usuário
    // ============================================================
    if (pathname === "/api/login" && method === "POST") {
      const { email, senha } = await getBody(req);
      if (!email || !senha)
        return sendJson(res, 400, { erro: "E-mail e senha obrigatórios." });

      const records = await base("usuario").select({
        filterByFormula: `AND({email}='${email}', {senha}='${senha}', {status}='ativo')`,
        maxRecords: 1,
      }).all();

      if (records.length === 0)
        return sendJson(res, 401, { erro: "Credenciais inválidas ou usuário inativo." });

      const u = records[0].fields;
      return sendJson(res, 200, {
        usuario: {
          nome: u.nome,
          email: u.email,
          tipo: u.tipo_usuario,
          status: u.status,
        },
      });
    }

    // ============================================================
    // 🧾 /api/cadastro — novo usuário
    // ============================================================
    if (pathname === "/api/cadastro" && method === "POST") {
      const dados = await getBody(req);
      const { nome, email, senha, tipo_usuario } = dados;

      if (!nome || !email || !senha)
        return sendJson(res, 400, { erro: "Preencha todos os campos obrigatórios." });

      const novo = await base("usuario").create({
        nome,
        email,
        senha,
        tipo_usuario: tipo_usuario || "doador",
        status: "ativo",
        data_cadastro: new Date().toISOString().split("T")[0],
      });

      return sendJson(res, 201, { ok: true, id: novo.id });
    }

    // ============================================================
    // 🚫 Rota não encontrada
    // ============================================================
    return sendJson(res, 404, { erro: "Rota não encontrada." });

  } catch (erro) {
    console.error("❌ Erro interno:", erro);
    return sendJson(res, 500, { erro: erro.message || String(erro) });
  }
}

// ============================================================
// 📦 Função auxiliar para ler o corpo da requisição
// ============================================================
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (err) {
        reject(err);
      }
    });
  });
}
