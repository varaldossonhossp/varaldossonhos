// ====================================================
// ☁️ Cloudinho - Envio automático de e-mail via EmailJS
// ====================================================

// Inicializa a API do EmailJS com sua chave pública
// ⚠️ Substitua "SUA_PUBLIC_KEY_AQUI" pela sua chave real do EmailJS (Public Key)
emailjs.init("SUA_PUBLIC_KEY_AQUI");

// Captura o botão do Cloudinho
const botao = document.getElementById("cloudinhoBtn");

// Garante que o botão foi encontrado
if (botao) {
  console.log("✅ Cloudinho encontrado!");

  botao.addEventListener("click", () => {
    console.log("☁️ Clique detectado!");

    // Dados que serão enviados para o template do EmailJS
    const params = {
      to_name: "Carina Mendes",
      crianca: "João Pereira",
      presente: "Bola de Futebol",
      data_entrega: "15/12/2025",
      codigo_cartinha: "CART123",
      ponto_coleta: "Ponto Central - Av. Paulista, 1000",
      endereco: "São Paulo - SP",
      telefone: "(11) 91234-5678"
    };

    // Envia o e-mail
    emailjs.send("service_uffgnhx", "template_4yfc899", params)
      .then(() => {
        console.log("✅ E-mail enviado com sucesso!");
        mostrarMensagemSucesso();
      })
      .catch((error) => {
        console.error("❌ Erro ao enviar e-mail:", error);
        alert("Erro ao enviar o e-mail 😢");
      });
  });
} else {
  console.log("❌ Cloudinho não encontrado no DOM!");
}

// ====================================================
// 🎉 Animação de sucesso
// ====================================================
function mostrarMensagemSucesso() {
  const aviso = document.createElement("div");
  aviso.className = "cloudinho-sucesso";
  aviso.innerHTML = `
    <img src="./imagens/cloudinho.png" width="80" alt="Cloudinho">
    <p>☁️ E-mail de confirmação enviado!<br>Obrigado por espalhar sonhos 💙</p>
  `;
  document.body.appendChild(aviso);

  aviso.style.animation = "fadeInUp 0.6s ease";
  setTimeout(() => aviso.remove(), 5000);
}
