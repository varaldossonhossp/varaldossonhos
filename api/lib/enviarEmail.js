// ============================================================
// 💙 VARAL DOS SONHOS — enviarEmail.js (versão segura para Vercel)
// ------------------------------------------------------------
// Envia e-mails via EmailJS (no browser) ou simula no ambiente serverless
// ============================================================

import emailjs from "@emailjs/browser";

// ============================================================
// 🔧 Função principal
// ============================================================
export default async function enviarEmail(destinatario, assunto, mensagem, diasPrazo = 7) {
  try {
    // Detecta se está rodando no navegador (cliente)
    const isBrowser = typeof window !== "undefined";

    // 🚫 Se estiver em ambiente serverless (ex: Vercel API), apenas loga
    if (!isBrowser) {
      console.log("📭 Ambiente serverless detectado — e-mail não será enviado.");
      console.log(`Simulação: Enviar para ${destinatario} | Assunto: ${assunto}`);
      console.log("Mensagem:", mensagem);
      return {
        ok: true,
        simulated: true,
        mensagem: "E-mail simulado (modo servidor).",
      };
    }

    // 📨 Se for navegador (teste local), usa EmailJS normalmente
    const serviceID = process.env.EMAILJS_SERVICE_ID || "service_uffgnhx";
    const templateID = process.env.EMAILJS_TEMPLATE_ID || "template_4yfc899";
    const publicKey = process.env.EMAILJS_PUBLIC_KEY || "dPZt5JBiJSLejLZgB";

    const templateParams = {
      to_email: destinatario,
      subject: assunto,
      message: mensagem,
      prazo: `${diasPrazo} dias`,
    };

    await emailjs.send(serviceID, templateID, templateParams, publicKey);

    console.log(`📨 E-mail enviado com sucesso para ${destinatario}!`);
    return { ok: true };
  } catch (erro) {
    console.error("❌ Erro no envio de e-mail:", erro.message);
    return { ok: false, erro: erro.message };
  }
}
