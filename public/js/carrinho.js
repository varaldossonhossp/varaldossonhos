// ============================================================
// 🛒 VARAL DOS SONHOS — carrinho.js (versão final)
// ------------------------------------------------------------
// - Exibe cartinhas do carrinho (localStorage)
// - Carrega pontos de coleta da API
// - Envia confirmação de adoção (API + EmailJS)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const carrinhoLista = document.getElementById("carrinhoLista");
  const btnLimpar = document.getElementById("btnLimpar");
  const btnConfirmar = document.getElementById("btnConfirmar");
  const btnVoltar = document.getElementById("btnVoltar");
  const selectPontos = document.getElementById("selectPontos");
  const pontosPlaceholder = document.getElementById("pontosPlaceholder");
  const pontosControls = document.getElementById("pontosControls");
  const verNoMapa = document.getElementById("verNoMapa");

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) {
    alert("⚠️ Faça login antes de acessar o carrinho!");
    window.location.href = "login.html";
    return;
  }

  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  // ============================================================
  // 🧩 Renderizar carrinho
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
        <div class="carrinho-info">
          <h3>${item.nome}</h3>
          <p>${item.sonho}</p>
        </div>
        <button class="remover" data-index="${index}">Remover</button>
      `;
      carrinhoLista.appendChild(div);
    });

    btnConfirmar.disabled = carrinho.length === 0 || !selectPontos.value;
  }

  // ============================================================
  // 🗑️ Remover item do carrinho
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
  // 🧹 Limpar carrinho inteiro
  // ============================================================
  btnLimpar.addEventListener("click", () => {
    if (confirm("Deseja realmente limpar o carrinho?")) {
      carrinho = [];
      localStorage.removeItem("carrinho");
      renderCarrinho();
    }
  });

  // ============================================================
  // 📍 Carregar pontos de coleta (com feedback)
  // ============================================================
  async function carregarPontos() {
    pontosPlaceholder.classList.remove("hidden");
    pontosControls.classList.add("hidden");

    try {
      const baseURL = window.location.hostname.includes("vercel.app")
        ? ""
        : "https://varaldossonhos-sp.vercel.app";

      const resp = await fetch(`${baseURL}/api/pontosdecoleta`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const pontos = await resp.json();

      if (!Array.isArray(pontos) || pontos.length === 0) {
        pontosPlaceholder.textContent = "Nenhum ponto de coleta cadastrado.";
        return;
      }

      selectPontos.innerHTML = '<option value="">-- Selecione um ponto de coleta --</option>';
      pontos.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.nome_local || p.nome || "Ponto";
        opt.textContent = `${p.nome_local || p.nome} — ${p.endereco || ""}`;
        selectPontos.appendChild(opt);
      });

      pontosPlaceholder.classList.add("hidden");
      pontosControls.classList.remove("hidden");

    } catch (err) {
      console.error("❌ Erro ao buscar pontos de coleta:", err);
      pontosPlaceholder.textContent = "Erro ao carregar pontos. Tente novamente mais tarde.";
    }
  }

  // ============================================================
  // 🗺️ Ver ponto no mapa
  // ============================================================
  verNoMapa.addEventListener("click", () => {
    const ponto = selectPontos.value;
    if (!ponto) return alert("Selecione um ponto de coleta.");
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(ponto)}`, "_blank");
  });

  // ============================================================
  // 💌 Confirmar adoção
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
            ponto_coleta: selectPontos.value,
          }),
        });
      }

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
      console.error("❌ Erro ao confirmar adoção:", erro);
      alert("Erro ao confirmar adoção. Tente novamente mais tarde.");
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "✅ Confirmar Adoção";
    }
  });

  // ============================================================
  // ↩️ Voltar para cartinhas
  // ============================================================
  btnVoltar.addEventListener("click", () => {
    window.location.href = "cartinhas.html";
  });

  // ============================================================
  // 🚀 Inicialização
  // ============================================================
  renderCarrinho();
  carregarPontos();
});
