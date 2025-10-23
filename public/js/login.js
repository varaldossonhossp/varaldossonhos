// ============================================================
// 💙 VARAL DOS SONHOS — js/login.js
// Valida login, consulta API e salva usuário localmente
// ============================================================

document.getElementById("btnLogin").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const mensagem = document.getElementById("mensagem");

  mensagem.textContent = "";

  if (!email || !senha) {
    mensagem.textContent = "⚠️ Por favor, preencha todos os campos.";
    mensagem.style.color = "red";
    return;
  }

  try {
    // Detecta ambiente (local ou Vercel)
    const baseURL = window.location.hostname.includes("vercel.app")
      ? ""
      : "https://varaldossonhos-sp.vercel.app";

    const resposta = await fetch(`${baseURL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });

    const dados = await resposta.json();

    if (resposta.ok && dados.usuario) {
      mensagem.textContent = "✅ Login realizado com sucesso!";
      mensagem.style.color = "green";

      // Salva usuário no localStorage
      localStorage.setItem("usuario", JSON.stringify(dados.usuario));

      // Redireciona para página inicial
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } else {
      mensagem.textContent = "❌ " + (dados.error || "Falha no login.");
      mensagem.style.color = "red";
    }

  } catch (erro) {
    console.error("Erro no login:", erro);
    mensagem.textContent = "⚠️ Erro de conexão. Tente novamente mais tarde.";
    mensagem.style.color = "red";
  }
});
