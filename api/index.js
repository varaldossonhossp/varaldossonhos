// ============================================================
// 💙 VARAL DOS SONHOS — /api/index.js (versão consolidada final)
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
//   • POST /api/adocoes  (com atualização de status e e-mail opcional)
//   • POST /api/cloudinho
// ============================================================

import Airtable from "airtable";
import enviarEmail from "./lib/enviarEmail.js";

export const config = { runtime: "nodejs" };

// ============================================================
// 🧰 Função utilitária para resposta JSON
// ============================================================
function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body, null, 2));
}

// ============================================================
// 🔧 Configuração do Airtable
// ============================================================
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

// ============================================================
// 📦 Utilitário para ler o corpo de requisições POST
// ============================================================
async function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (err) {
        reject(err);
      }
    });
  });
}

// ============================================================
// 🚦 Manipulador principal
// ============================================================
export default async function handler(req, res) {
  const { url, method } = req;
  const pathname = new URL(url, `http://${req.headers.host}`).pathname;

  // ============================================================
  // 🩺 HEALTH CHECK
  // ============================================================
  if (pathname === "/api/health") {
    return sendJson(res, 200, { status: "ok", projeto: "Varal dos Sonhos" });
  }

  // ============================================================
  // 🎉 EVENTOS — carrossel da página inicial
  // ============================================================
  if (pathname === "/api/eventos" && method === "GET") {
    try {
      const registros = await base(process.env.AIRTABLE_EVENTOS_TABLE)
        .select({ view: "Grid view" })
        .firstPage();
      const eventos = registros.map(r => r.fields);
      return sendJson(res, 200, eventos);
    } catch (erro) {
      console.error("Erro ao buscar eventos:", erro);
      return sendJson(res, 500, { erro: erro.message });
    }
  }

  // ============================================================
  // 💌 CARTINHAS — lista de cartinhas disponíveis
  // ============================================================
  if (pathname === "/api/cartinhas" && method === "GET") {
    try {
      const registros = await base("cartinhas")
        .select({
          filterByFormula: "LOWER({status})='disponível'",
          view: "Grid view",
        })
        .firstPage();
      const cartinhas = registros.map(r => r.fields);
      return sendJson(res, 200, cartinhas);
    } catch (erro) {
      console.error("Erro ao buscar cartinhas:", erro);
      return sendJson(res, 500, { erro: erro.message });
    }
  }

  // ============================================================
  // 📍 PONTOS DE COLETA — locais disponíveis
  // ============================================================
  if (pathname === "/api/pontosdecoleta" && method === "GET") {
    try {
      const registros = await base("pontosdecoleta")
        .select({ view: "Grid view" })
        .firstPage();
      const pontos = registros.map(r => r.fields);
      return sendJson(res, 200, pontos);
    } catch (erro) {
      console.error("Erro ao buscar pontos de coleta:", erro);
      return sendJson(res, 500, { erro: erro.message });
    }
  }

  // ============================================================
  // 👤 CADASTRO — cria novo usuário
  // ============================================================
  if (pathname === "/api/cadastro" && method === "POST") {
    try {
      const { nome, email, senha } = await getBody(req);
      const novo = await base(process.env.AIRTABLE_TABLE_NAME).create([
        { fields: { nome, email, senha, tipo: "usuario" } },
      ]);
      return sendJson(res, 201, { ok: true, id: novo[0].id });
    } catch (erro) {
      console.error("Erro ao cadastrar:", erro);
      return sendJson(res, 500, { erro: erro.message });
    }
  }

  // ============================================================
  // 🔐 LOGIN — autenticação simples
  // ============================================================
  if (pathname === "/api/login" && method === "POST") {
    try {
      const { email, senha } = await getBody(req);
      const registros = await base(process.env.AIRTABLE_TABLE_NAME)
        .select({
          filterByFormula: `AND({email}='${email}', {senha}='${senha}')`,
          maxRecords: 1,
        })
        .firstPage();
      if (registros.length === 0)
        return sendJson(res, 401, { erro: "Credenciais inválidas" });

      const usuario = registros[0].fields;
      return sendJson(res, 200, { ok: true, usuario });
    } catch (erro) {
      console.error("Erro no login:", erro);
      return sendJson(res, 500, { erro: erro.message });
    }
  }

  // ============================================================
  // 💌 ADOÇÕES — registrar adoção + atualizar cartinha + e-mail
  // ============================================================
  if (pathname === "/api/adocoes" && method === "POST") {
    try {
      const { doador, email, cartinha, ponto_coleta } = await getBody(req);

      if (!doador || !cartinha || !ponto_coleta)
        return sendJson(res, 400, { erro: "Campos obrigatórios ausentes." });

      const dataAtual = new Date().toLocaleDateString("pt-BR");

      // Cria registro de doação
      const novoRegistro = await base("doacoes").create([
        {
          fields: {
            doador: String(doador),
            cartinha: String(cartinha),
            ponto_coleta: String(ponto_coleta),
            data_doacao: dataAtual,
            status_doacao: "confirmada",
            mensagem_confirmacao: `💙 Adoção confirmada em ${dataAtual}`,
          },
        },
      ]);

      // Atualiza status da cartinha correspondente
      try {
        const cartinhaRecord = await base("cartinhas")
          .select({
            filterByFormula: `LOWER(TRIM({id_cartinha}))='${cartinha
              .trim()
              .toLowerCase()}'`,
            maxRecords: 1,
          })
          .firstPage();

        if (cartinhaRecord.length > 0) {
          const registroId = cartinhaRecord[0].id;
          await base("cartinhas").update([
            { id: registroId, fields: { status: "adotada" } },
          ]);
          console.log(`✅ Cartinha ${cartinha} atualizada para "adotada".`);
        } else {
          console.warn(
            `⚠️ Nenhuma cartinha encontrada com id_cartinha='${cartinha}'.`
          );
        }
      } catch (erro) {
        console.error("❌ Erro ao atualizar status da cartinha:", erro);
      }

      // Envio de e-mail protegido (não trava o fluxo)
      try {
        const assunto = "💙 Adoção Confirmada | Varal dos Sonhos";
        const mensagem = `
Olá ${doador},
Sua adoção foi confirmada com sucesso! 💌

🎁 Cartinha: ${cartinha}
📍 Ponto de Coleta: ${ponto_coleta}
📅 Entregar até: ${new Date(
          Date.now() + 10 * 86400000
        ).toLocaleDateString("pt-BR")}

Obrigado por espalhar amor e realizar sonhos! 💙
        `;

        await enviarEmail(email, assunto, mensagem, 10);
        console.log("📨 E-mail enviado com sucesso!");
      } catch (emailErro) {
        console.warn(
          "⚠️ Falha ao enviar e-mail, mas a adoção foi salva:",
          emailErro.message
        );
      }

      return sendJson(res, 201, {
        ok: true,
        id: novoRegistro[0].id,
        mensagem: "Adoção registrada com sucesso (mesmo sem e-mail).",
      });
    } catch (erro) {
      console.error("❌ Erro ao registrar adoção:", erro);
      return sendJson(res, 500, { erro: erro.message });
    }
  }

  // ============================================================
  // ☁️ CLOUDINHO — assistente virtual (placeholder)
  // ============================================================
  if (pathname === "/api/cloudinho" && method === "POST") {
    try {
      const { pergunta } = await getBody(req);
      return sendJson(res, 200, {
        resposta: `Oi! Eu sou o Cloudinho ☁️. Você perguntou: "${pergunta}"`,
      });
    } catch {
      return sendJson(res, 400, { erro: "Pergunta inválida." });
    }
  }

  // ============================================================
  // 🚫 ROTA INVÁLIDA
  // ============================================================
  return sendJson(res, 404, { erro: "Rota não encontrada." });
}
