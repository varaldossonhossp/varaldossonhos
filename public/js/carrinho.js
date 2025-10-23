// ============================================================
// 🛒 VARAL DOS SONHOS — carrinho.js (versão final com Cloudinho 2025)
// ------------------------------------------------------------
// - Exibe cartinhas do carrinho (localStorage)
// - Escolha de ponto de coleta (API /api/pontosdecoleta)
// - Confirma adoção via /api/adocoes + EmailJS
// - Animação de sucesso com Cloudinho 💙
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
  // 🗑️ Remover item
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
  // 🧹 Limpar carrinho
  // ============================================================
  btnLimpar.addEventListener("click", () => {
    if (confirm("Deseja realmente limpar o carrinho?")) {
      carrinho = [];
      localStorage.removeItem("carrinho");
      renderCarrinho();
    }
  });

  // ============================================================
  // 📍 Carregar pontos de coleta
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
        opt.value = JSON.stringify({
          nome: p.nome_local || p.nome,
          endereco: p.endereco || "",
          telefone: p.telefone || ""
        });
        opt.textContent = `${p.nome_local || p.nome} — ${p.endereco || ""}`;
        selectPontos.appendChild(opt);
      });

      pontosPlaceholder.classList.add("hidden");
      pontosControls.classList.remove("hidden");
    } catch (err) {
      console.error("❌ Erro ao buscar pontos de coleta:", err);
      pontosPlaceholder.textContent = "Erro ao carregar pontos.";
    }
  }

  // ============================================================
  // 🗺️ Ver no mapa
  // ============================================================
  verNoMapa.addEventListener("click", () => {
    const val = selectPontos.value;
    if (!val) return alert("Selecione um ponto de coleta primeiro.");
    const ponto = JSON.parse(val);
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(ponto.endereco)}`, "_blank");
  });

  // ============================================================
  // 💌 Confirmar adoção + e-mail + Cloudinho animado
  // ============================================================
  btnConfirmar.addEventListener("click", async () => {
    if (!selectPontos.value) {
      alert("Por favor, selecione um ponto de coleta.");
      return;
    }

    const ponto = JSON.parse(selectPontos.value);
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 10);
    const prazoFormatado = dataLimite.toLocaleDateString("pt-BR");

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
            ponto_coleta: ponto.nome
          }),
        });

        // 💙 Envio de e-mail de confirmação via EmailJS
        await emailjs.send("service_uffgnhx", "template_4yfc899", {
          to_name: usuario.nome,
          to_email: usuario.email,
          child_name: carta.nome,
          child_gift: carta.sonho,
          deadline: prazoFormatado,
          order_id: carta.id,
          pickup_name: ponto.nome,
          pickup_address: ponto.endereco,
          pickup_phone: ponto.telefone || "(11) 99999-9999"
        });
      }

      // 🩵 Animação Cloudinho de sucesso
      mostrarMensagemSucesso();

      setTimeout(() => {
        localStorage.removeItem("carrinho");
        window.location.href = "index.html";
      }, 5000);
    } catch (erro) {
      console.error("❌ Erro ao confirmar adoção:", erro);
      alert("Erro ao confirmar adoção. Tente novamente mais tarde.");
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "✅ Confirmar Adoção";
    }
  });

  // ============================================================
  // ☁️ Função de popup Cloudinho de sucesso
  // ============================================================
  window.mostrarMensagemSucesso = function () {
    let popup = document.createElement("div");
    popup.className = "cloudinho-popup";
    popup.innerHTML = `
      <div class="cloudinho-popup-inner">
        <img src="imagens/cloudinho.png" alt="Cloudinho" class="cloudinho-popup-img">
        <div>
          <h3>💙 Adoção Confirmada!</h3>
          <p>Obrigado por espalhar amor e realizar sonhos!</p>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    // animação de entrada e saída
    setTimeout(() => popup.classList.add("show"), 100);
    setTimeout(() => popup.classList.remove("show"), 4000);
    setTimeout(() => popup.remove(), 5000);
  };

  // ============================================================
  // ↩️ Adotar outra cartinha
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
