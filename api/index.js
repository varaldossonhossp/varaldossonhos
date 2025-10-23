// ============================================================
// 💙 VARAL DOS SONHOS — /api/index.js
// ------------------------------------------------------------
// API única — compatível com o plano gratuito da Vercel
// ------------------------------------------------------------
// Rotas ativas:
//   • GET  /api/health
//   • GET  /api/eventos
//   • GET  /api/cartinhas
//   • GET  /api/pontosdecoleta
//   • POST /api/login
//   • POST /api/cadastro
//   • POST /api/adocoes  (com envio de e-mail)
//   • POST /api/cloudinho
// ============================================================

import Airtable from "airtable";
import enviarEmail from "./lib/enviarEmail.js";

export const config = { runtime: "nodejs" };

// ============================================================
// 🧰 Utilitário para resposta JSON
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

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID)
    return sendJson(res, 500, { erro: "⚠️ Variáveis do Airtable ausentes." });

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

  try {
    // 🩺 /api/health
    if (pathname === "/api/health") {
      return sendJson(res, 200, { ok: true, runtime: "nodejs" });
    }

    // 🗓️ /api/eventos
    if (pathname === "/api/eventos" && method === "GET") {
      const records = await base("eventos").select().all();
      const eventos = records.map((r) => ({
        id: r.id,
        nome: r.fields.nome_evento || r.fields.nome || "Evento sem nome",
        descricao: r.fields.descricao || "",
        data_inicio: r.fields.data_inicio || "",
        imagem: r.fields.imagem_evento?.[0]?.url || "/imagens/evento-padrao.jpg",
      }));
      return sendJson(res, 200, eventos);
    }

    // 💌 /api/cartinhas
    if (pathname === "/api/cartinhas" && method === "GET") {
      const records = await base("cartinhas").select().all();
      const cartinhas = records.map((r) => ({
        id: r.id,
        nome: r.fields.nome_crianca || "Criança",
        idade: r.fields.idade || "",
        sonho: r.fields.sonho || "",
        imagem: r.fields.imagem_cartinha?.[0]?.url || "/imagens/cartinha-padrao.png",
        status: r.fields.status || "disponível",
      }));
      return sendJson(res, 200, cartinhas);
    }

    // 📍 /api/pontosdecoleta
    if (pathname === "/api/pontosdecoleta" && method === "GET") {
      const records = await base("pontosdecoleta").select().all();
      const pontos = records.map((r) => ({
        id: r.id,
        nome_local: r.fields.nome_local,
        endereco: r.fields.endereco,
        telefone: r.fields.telefone,
        email: r.fields.email,
      }));
      return sendJson(res, 200, pontos);
    }

    // 🔑 /api/login
    if (pathname === "/api/login" && method === "POST") {
      const { email, senha } = await getBody(req);
      const records = await base("usuario")
        .select({
          filterByFormula: `AND({email}='${email}', {senha}='${senha}')`,
          maxRecords: 1,
        })
        .all();

      if (records.length === 0)
        return sendJson(res, 401, { erro: "Credenciais inválidas." });

      const u = records[0].fields;
      return sendJson(res, 200, {
        usuario: { nome: u.nome, email: u.email, tipo: u.tipo_usuario },
      });
    }

    // 🧾 /api/cadastro
    if (pathname === "/api/cadastro" && method === "POST") {
      const dados = await getBody(req);
      const novo = await base("usuario").create({
        nome: dados.nome,
        email: dados.email,
        senha: dados.senha,
        tipo_usuario: dados.tipo_usuario || "doador",
        status: "ativo",
        data_cadastro: new Date().toISOString().split("T")[0],
      });
      return sendJson(res, 201, { ok: true, id: novo.id });
    }

    // 💙 /api/adocoes — Registrar e enviar e-mail
    if (pathname === "/api/adocoes" && method === "POST") {
      const { id_cartinha, nome_crianca, usuario, email, ponto_coleta } =
        await getBody(req);

      if (!id_cartinha || !usuario || !email)
        return sendJson(res, 400, { erro: "Campos obrigatórios ausentes." });

      const dataHoje = new Date().toISOString().split("T")[0];
      const dataEntrega = new Date();
      dataEntrega.setDate(dataEntrega.getDate() + 10);

      const nova = await base("doacoes").create({
        doador: usuario,
        cartinha: id_cartinha,
        ponto_coleta: ponto_coleta || "Ponto Central",
        dados_doacao: dataHoje,
        status_doacao: "aguardando_entrega",
      });

      // atualiza status da cartinha
      await base("cartinhas").update([
        { id: id_cartinha, fields: { status: "adotada" } },
      ]);

      // Envio de e-mail via EmailJS
      const assunto = "💙 Adoção Confirmada | Varal dos Sonhos";
      const mensagem = `
Olá ${usuario},
Sua adoção foi confirmada com sucesso! 💌

👧 Criança: ${nome_crianca}
📦 Ponto de Coleta: ${ponto_coleta}
📅 Entregar até: ${dataEntrega.toLocaleDateString("pt-BR")}

Obrigado por espalhar amor e realizar sonhos!
`;

      await enviarEmail(email, assunto, mensagem, 10);

      return sendJson(res, 201, {
        ok: true,
        id: nova.id,
        mensagem: "Adoção registrada e e-mail enviado.",
      });
    }

    // ☁️ /api/cloudinho
    if (pathname === "/api/cloudinho" && method === "POST") {
      const { pergunta } = await getBody(req);
      const registros = await base("cloudinho_kb").select().all();
      const perguntaLower = pergunta.toLowerCase();

      for (const r of registros) {
        const palavras = (r.fields.palavras_chave || []).map((p) =>
          p.toLowerCase()
        );
        if (palavras.some((p) => perguntaLower.includes(p)))
          return sendJson(res, 200, { resposta: r.fields.resposta });
      }

      return sendJson(res, 200, {
        resposta: "Desculpe, ainda não sei responder isso 💭.",
      });
    }

    return sendJson(res, 404, { erro: "Rota não encontrada." });
  } catch (erro) {
    console.error("❌ Erro interno:", erro);
    return sendJson(res, 500, { erro: erro.message || String(erro) });
  }
}

// ============================================================
// 🔧 Função auxiliar para ler corpo JSON
// ============================================================
function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}
