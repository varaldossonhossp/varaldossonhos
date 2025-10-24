// ============================================================
// 💙 VARAL DOS SONHOS — /api/index.js (versão final revisada 2025)
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
// 🧰 Função utilitária para resposta JSON
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
// 🌈 Função principal (handler)
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
    // ============================================================
    // 🩺 /api/health — teste de vida
    // ============================================================
    if (pathname === "/api/health") {
      return sendJson(res, 200, { ok: true, runtime: "nodejs" });
    }

    // ============================================================
    // 🗓️ /api/eventos — lista de eventos
    // ============================================================
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

    // ============================================================
    // 💌 /api/cartinhas — lista de cartinhas
    // ============================================================
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

    // ============================================================
    // 📍 /api/pontosdecoleta — locais de entrega
    // ============================================================
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

    // ============================================================
    // 🔑 /api/login — autenticação
    // ============================================================
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

    // ============================================================
    // 🧾 /api/cadastro — novo usuário
    // ============================================================
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

    // ============================================================
    // 💌 /api/adocoes — registrar adoção (versão final funcional)
    // ============================================================
    if (pathname === "/api/adocoes" && method === "POST") {
      try {
        const { doador, email, cartinha, ponto_coleta } = await getBody(req);

        if (!doador || !cartinha || !ponto_coleta) {
          return sendJson(res, 400, { erro: "Campos obrigatórios ausentes." });
        }

        const dataAtual = new Date();
        const dataFormatada = dataAtual.toLocaleDateString("pt-BR");

        // 🧩 Gera automaticamente o ID de doação sequencial (ex: d001, d002...)
        const registrosExistentes = await base("doacoes").select().all();
        const novoNumero = registrosExistentes.length + 1;
        const id_doacao = `d${String(novoNumero).padStart(3, "0")}`;

        // ✅ Cria novo registro de doação
        const novoRegistro = await base("doacoes").create([
          {
            fields: {
              id_doacao: id_doacao,
              doador: String(doador),
              cartinha: String(cartinha),
              ponto_coleta: String(ponto_coleta),
              data_doacao: dataFormatada,
              status_doacao: "confirmada",
              mensagem_confirmacao: `💙 Adoção confirmada em ${dataFormatada}`,
            },
          },
        ]);

  // ✅ Atualiza status da cartinha correspondente (debug detalhado)
  try {
    console.log(`🔎 Tentando atualizar cartinha: ${cartinha}`);

    const cartinhaRecord = await base("cartinhas")
      .select({
        filterByFormula: `TRIM({id_cartinha})='${cartinha.trim()}'`,
        maxRecords: 1,
      })
      .firstPage();

    console.log(`📦 Registros encontrados: ${cartinhaRecord.length}`);

    if (cartinhaRecord.length > 0) {
      const registroId = cartinhaRecord[0].id;
      console.log(`🆔 ID interno Airtable: ${registroId}`);

      const resultadoUpdate = await base("cartinhas").update([
        {
          id: registroId,
          fields: {
            status: "adotada", // 👈 testamos string simples primeiro
          },
        },
      ]);

      console.log("✅ Resultado do update:", resultadoUpdate[0].fields.status);
    } else {
      console.warn(`⚠️ Nenhuma cartinha encontrada com id_cartinha='${cartinha}'.`);
    }
  } catch (erro) {
    console.error("❌ Erro ao atualizar status da cartinha:", erro);
  }


        // ✅ Envio do e-mail de confirmação
        const assunto = "💙 Adoção Confirmada | Varal dos Sonhos";
        const mensagem = `
Olá ${doador},
Sua adoção foi confirmada com sucesso! 💌

🎁 Cartinha: ${cartinha}
📍 Ponto de Coleta: ${ponto_coleta}
📅 Entregar até: ${new Date(Date.now() + 10 * 86400000).toLocaleDateString("pt-BR")}

Obrigado por espalhar amor e realizar sonhos! 💙
        `;

        await enviarEmail(email, assunto, mensagem, 10);

        return sendJson(res, 201, {
          ok: true,
          id_doacao,
          mensagem: "Adoção registrada e e-mail enviado com sucesso.",
        });
      } catch (erro) {
        console.error("❌ Erro ao registrar adoção:", erro);
        return sendJson(res, 500, { erro: erro.message });
      }
    }

    // ============================================================
    // ☁️ /api/cloudinho — base de conhecimento
    // ============================================================
    if (pathname === "/api/cloudinho" && method === "POST") {
      const { pergunta } = await getBody(req);
      const registros = await base("cloudinho_kb").select().all();
      const perguntaLower = pergunta.toLowerCase();

      for (const r of registros) {
        const palavras = (r.fields.palavras_chave || []).map((p) =>
          p.toLowerCase()
        );
        if (palavras.some((p) => perguntaLower.includes(p))) {
          return sendJson(res, 200, { resposta: r.fields.resposta });
        }
      }

      return sendJson(res, 200, {
        resposta: "Desculpe, ainda não sei responder isso 💭.",
      });
    }

    // ============================================================
    // Rota não encontrada
    // ============================================================
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
