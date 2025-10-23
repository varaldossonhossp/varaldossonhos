// ============================================================
// 🛒 VARAL DOS SONHOS — carrinho.js (versão final revisada 2025)
// ------------------------------------------------------------
// Exibe as cartinhas do carrinho, permite selecionar o ponto de coleta,
// confirmar a adoção e enviar via API + EmailJS.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const carrinhoLista = document.getElementById("carrinhoLista");
  const btnLimpar = document.getElementById("btnLimpar");
  const btnConfirmar = document.getElementById("btnConfirmar");
  const feedback = document.getElementById("feedback");
  const selectPontos = document.getElementById("selectPontos");

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) {
    alert("⚠️ Faça login antes de acessar o carrinho!");
    window.location.href = "login.html";
    return;
  }

  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  // ============================================================
  // Renderizar carrinho
  // ============================================================
  function renderCarrinho() {
    carrinhoLista.innerHTML = "";
    if (carrinho.length === 0) {
      carrinhoLista.innerHTML = "<p>Seu carrinho está vazio 😢</p>";
      btnConfirmar.disabled = true;
      return;
    }

    carrinho.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "carrinho-item";
      div.innerHTML = `
        <img src="${item.imagem}" alt="${item.nome}" class="cartinha-foto" />
        <div>
          <h3>${item.nome}</h3>
          <p>${item.sonho}</p>
        </div>
        <button class="remover" data-index="${index}">Remover</button>
      `;
      carrinhoLista.appendChild(div);
    });

    btnConfirmar.disabled = carrinho.length === 0;
  }

  // ============================================================
  // Remover item
  // ============================================================
  carrinhoLista.addEventListener("click", (e) => {
    if (e.target.classList.contains("remover")) {
      const idx = Number(e.target.dataset.index);
      carrinho.splice(idx, 1);
      localStorage.setItem("carrinho", JSON.stringify(carrinho));
      renderCarrinho();
    }
  });

  // ============================================================
  // Limpar carrinho
  // ============================================================
  btnLimpar.addEventListener("click", () => {
    if (confirm("Deseja realmente limpar o carrinho?")) {
      carrinho = [];
      localStorage.removeItem("carrinho");
      renderCarrinho();
    }
  });

  // ============================================================
  // Carregar pontos de coleta
  // ============================================================
  async function carregarPontos() {
    try {
      const resp = await fetch("/api/pontosdecoleta");
      const pontos = await resp.json();
      selectPontos.innerHTML = '<option value="">Selecione um ponto de coleta</option>';
      pontos.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.nome_local;
        opt.textContent = `${p.nome_local} — ${p.endereco}`;
        selectPontos.appendChild(opt);
      });
    } catch (err) {
      console.error("Erro ao carregar pontos:", err);
      alert("⚠️ Não foi possível carregar os pontos de coleta.");
    }
  }

  // ============================================================
  // Confirmar adoção (envia para Airtable + EmailJS)
  // ============================================================
  btnConfirmar.addEventListener("click", async () => {
    if (!selectPontos.value) {
      alert("Por favor, selecione um ponto de coleta.");
      return;
    }

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Enviando...";

    try {
      const baseURL = window.location.hostname.includes("vercel.app")
        ? ""
        : "https://varaldossonhos-sp.vercel.app";

      for (const carta of carrinho) {
        await fetch(`${baseURL}/api/adocoes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_cartinha: carta.id,
            nome_crianca: carta.nome,
            usuario: usuario.nome,
            email: usuario.email,
            ponto_coleta: selectPontos.value
          }),
        });
      }

      // Envia e-mail de confirmação
      if (window.emailjs) {
        emailjs.send("service_uffgnhx", "template_4yfc899", {
          to_name: usuario.nome,
          to_email: usuario.email,
          message: "💙 Sua adoção foi registrada com sucesso! Aguarde o contato da equipe do Varal dos Sonhos.",
        });
      }

      alert("💙 Adoção confirmada! Você receberá um e-mail com as instruções.");
      localStorage.removeItem("carrinho");
      window.location.href = "index.html";
    } catch (erro) {
      console.error("Erro ao confirmar adoção:", erro);
      alert("❌ Falha ao enviar adoção. Tente novamente mais tarde.");
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "✅ Confirmar Adoção";
    }
  });

  carregarPontos();
  renderCarrinho();
});
