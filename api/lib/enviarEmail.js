// ============================================================
// 💌 VARAL DOS SONHOS — /api/lib/enviarEmail.js
// ------------------------------------------------------------
// Integração com EmailJS (real ou simulada)
// ------------------------------------------------------------
// Variáveis de ambiente (na Vercel):
//   EMAILJS_SERVICE_ID=service_uffgnhx
//   EMAILJS_TEMPLATE_ID=template_4yfc899
//   EMAILJS_USER_ID=dPZt5JBiJSLejLZgB
// ============================================================

import fetch from "node-fetch";

export default async function enviarEmail(destinatario, assunto, mensagem, pontuacao = 0) {
  const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "service_uffgnhx";
  const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "template_4yfc899";
  const USER_ID = process.env.EMAILJS_USER_ID || "dPZt5JBiJSLejLZgB";

  if (!SERVICE_ID || !TEMPLATE_ID || !USER_ID) {
    console.warn("⚠️ EmailJS não configurado. Envio será simulado.");
    console.log("📧 SIMULAÇÃO DE E-MAIL:");
    console.log("Destinatário:", destinatario);
    console.log("Assunto:", assunto);
    console.log("Mensagem:", mensagem);
    if (pontuacao > 0) console.log(`✨ Pontuação: +${pontuacao} pontos`);
    return { status: "simulado", mensagem: "Envio simulado (modo teste)." };
  }

  let mensagemFinal = mensagem;
  if (pontuacao > 0) {
    mensagemFinal += `\n\n🏅 Você ganhou ${pontuacao} ponto${
      pontuacao > 1 ? "s" : ""
    } por esta adoção! 💙 Continue espalhando sonhos!`;
  }

  const payload = {
    service_id: SERVICE_ID,
    template_id: TEMPLATE_ID,
    user_id: USER_ID,
    template_params: {
      to_email: destinatario,
      subject: assunto,
      message: mensagemFinal,
    },
  };

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Falha ao enviar e-mail:", errText);
      throw new Error(errText);
    }

    console.log(`✅ E-mail enviado com sucesso para ${destinatario}`);
    return { status: "ok", mensagem: "E-mail enviado com sucesso via EmailJS." };
  } catch (erro) {
    console.error("❌ Erro no envio de e-mail:", erro);
    return { status: "erro", mensagem: "Falha ao enviar e-mail: " + erro.message };
  }
}
