// ============================================================
// 💙 VARAL DOS SONHOS — /api/index.js (versão completa final)
// ------------------------------------------------------------
// Rotas integradas:
//   • /api/health
//   • /api/eventos
//   • /api/cartinhas
//   • /api/pontosdecoleta
//   • /api/login
//   • /api/cadastro
// ============================================================

import Airtable from "airtable";
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
  // 🩺 /api/health
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
    return sendJson(res, 500, { erro: "⚠️ Variáveis Airtable ausentes." });
  }

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

  try {
    // ============================================================
    // 🗓️ /api/eventos
    // ============================================================
    if (pathname === "/api/eventos" && method === "GET") {
      const records = await base("eventos")
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
          firstImageUrl(r.fields, ["imagem_evento", "Imagem_evento", "imagem"]) ||
          "/imagens/evento-padrao.jpg",
      }));

      return sendJson(res, 200, eventos);
    }

    // ============================================================
    // 💌 /api/cartinhas
    // ============================================================
    if (pathname === "/api/cartinhas" && method === "GET") {
      const records = await base("cartinhas")
        .select({ sort: [{ field: "nome_crianca", direction: "asc" }] })
        .all();

      const cartinhas = records.map((r) => ({
        id: r.fields.id_cartinha || r.id,
        nome: r.fields.nome_crianca || r.fields.primeiro_nome || "Criança",
        idade: r.fields.idade || "",
        sexo: r.fields.sexo || "",
        sonho: r.fields.sonho || "",
        escola: r.fields.escola || "",
        cidade: r.fields.cidade || "",
        ponto_coleta: r.fields.ponto_coleta || "",
        imagem:
          firstImageUrl(r.fields, ["imagem_cartinha", "imagem", "foto"]) ||
          "/imagens/cartinha-padrao.png",
        status: r.fields.status || "disponível",
      }));

      return sendJson(res, 200, cartinhas);
    }

    // ============================================================
    // 📍 /api/pontosdecoleta
    // ============================================================
    if (pathname === "/api/pontosdecoleta" && method === "GET") {
      const records = await base("pontosdecoleta")
        .select({ sort: [{ field: "nome_local", direction: "asc" }] })
        .all();

      const pontos = records.map((r) => ({
        id: r.fields.id_ponto || r.id,
        nome: r.fields.nome_local || "Ponto de Coleta",
        endereco: r.fields.endereco || "",
        telefone: r.fields.telefone || "",
        email: r.fields.email || "",
        horario_funcionamento: r.fields.horario_funcionamento || "",
        responsavel: r.fields.responsavel || "",
      }));

      return sendJson(res, 200, pontos);
    }

    // ============================================================
    // 👤 /api/login — autenticação
    // ============================================================
    if (pathname === "/api/login" && method === "POST") {
      const { email, senha } = await getBody(req);

      if (!email || !senha)
        return sendJson(res, 400, { erro: "E-mail e senha obrigatórios." });

      const records = await base("usuario")
        .select({
          filterByFormula: `AND({email}='${email}', {senha}='${senha}', {status}='ativo')`,
          maxRecords: 1,
        })
        .all();

      if (records.length === 0)
        return sendJson(res, 401, { erro: "E-mail ou senha inválidos." });

      const user = records[0].fields;
      return sendJson(res, 200, {
        mensagem: "Login realizado com sucesso!",
        usuario: {
          id: records[0].id,
          nome: user.nome,
          tipo: user.tipo_usuario,
          email: user.email,
        },
      });
    }

    // ============================================================
    // 🆕 /api/cadastro — novo usuário
    // ============================================================
    if (pathname === "/api/cadastro" && method === "POST") {
      const dados = await getBody(req);
      const { nome, email, senha, tipo_usuario } = dados;

      if (!nome || !email || !senha)
        return sendJson(res, 400, { erro: "Campos obrigatórios ausentes." });

      await base("usuario").create([
        {
          fields: {
            nome,
            email,
            senha,
            tipo_usuario: tipo_usuario || "doador",
            status: "ativo",
            data_cadastro: new Date().toISOString().split("T")[0],
          },
        },
      ]);

      return sendJson(res, 201, { mensagem: "Usuário cadastrado com sucesso!" });
    }

    // ============================================================
    // 🚫 Rota não encontrada
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

// ============================================================
// 🧩 Função para ler body JSON (POST)
// ============================================================
async function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
  });
}
