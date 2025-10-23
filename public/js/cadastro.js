// js/cadastro.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCadastro");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome")?.value.trim();
    const cep = document.getElementById("cep")?.value.trim();
    const endereco = document.getElementById("endereco")?.value.trim();
    const cidade = document.getElementById("cidade")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const telefone = document.getElementById("telefone")?.value.trim();
    const tipo_usuario = document.getElementById("tipo_usuario")?.value;
    const senha = document.getElementById("senha")?.value.trim();

    // Validação simples
    if (!nome || !cep || !endereco || !cidade || !email || !telefone || !tipo_usuario || !senha) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const payload = {
      nome,
      cep,
      endereco,
      cidade,
      email,
      telefone,
      tipo_usuario,
      senha
    };

    try {
      console.log("Enviando para /api/cadastro:", payload);

      const resp = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (!resp.ok) {
        console.error("Erro da API:", data);
        alert(data.error || data.message || "Erro ao cadastrar usuário.");
        return;
      }

      alert("🎉Cadastro realizado com sucesso!🎉");
      form.reset();
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    } catch (err) {
      console.error("Erro de rede:", err);
      alert("Erro de conexão. Tente novamente mais tarde.");
    }
  });
});
