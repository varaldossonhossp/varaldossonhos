// ============================================================
// 💬 Notificador — Envio de mensagem via WhatsApp e EmailJS
// ============================================================

// Gera link do WhatsApp automaticamente
export function enviarWhatsApp(telefone, mensagem) {
  try {
    const numeroLimpo = telefone.replace(/\D/g, "");
    const link = `https://api.whatsapp.com/send?phone=55${numeroLimpo}&text=${encodeURIComponent(
      mensagem
    )}`;

    console.log("📱 Link gerado:", link);
    window.open(link, "_blank");
  } catch (erro) {
    console.error("❌ Erro ao gerar link do WhatsApp:", erro.message);
  }
}

// Envia e-mail via EmailJS
export async function enviarEmail(destinatario, assunto, mensagem) {
  try {
    // ⚠️ Substitua pelos seus dados do EmailJS
    const serviceID = "service_uffgnhx";
    const templateID = "template_4yfc899";
    const publicKey = "SUA_PUBLIC_KEY_AQUI";

    const params = {
      to_email: destinatario,
      subject: assunto,
      message: mensagem,
    };

    const resposta = await emailjs.send(serviceID, templateID, params, publicKey);
    console.log("✅ E-mail enviado com sucesso!", resposta.status);
  } catch (erro) {
    console.error("❌ Erro ao enviar e-mail via EmailJS:", erro.message);
  }
}
