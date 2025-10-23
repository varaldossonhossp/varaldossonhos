// ============================================================
// 🛒 VARAL DOS SONHOS — carrinho.js (versão estável e revisada)
// ------------------------------------------------------------
// ✅ Exibe cartinhas do carrinho
// ✅ Carrega pontos de coleta (API /api/pontosdecoleta)
// ✅ Habilita botão ao selecionar ponto
// ✅ Envia adoção (API + EmailJS)
// ✅ Cloudinho animado 💙
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 carrinho.js carregado com sucesso!");

  const carrinhoLista = document.getElementById("carrinhoLista");
  const btnLimpar = document.getElementById("btnLimpar");
  const btnConfirmar = document.getElementById("btnConfirmar");
  const btnVoltar = document.getElementById("btnVoltar");
  const selectPontos = document.getElementById("selectPontos");
  const pontosPlaceholder = document.getElementById("pontosPlaceholder");
  const verNoMapa = document.getElementById("verNoMapa");

  // 🔹 Usuário logado
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) {
    alert("⚠️ Faça login antes de acessar o carrinho!");
    window.location.href = "login.html";
    return;
  }

  // 🔹 Carrinho salvo
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  // ============================================================
  // 🧩 Renderizar cartinhas
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

    verificarBotaoConfirmar();
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
    pontosPlaceholder.textContent = "Carregando pontos de coleta...";

    try {
      const baseURL = window.location.hostname.includes("vercel.app")
        ? ""
        : "https://varaldossonhos.vercel.app";

      const resp = await fetch(`${baseURL}/api/pontosdecoleta`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const pontos = await resp.json();
      console.log("📦 Pontos recebidos:", pontos);

      preencherSelect(pontos);
    } catch (err) {
      console.error("❌ Erro ao buscar pontos de coleta:", err);
      pontosPlaceholder.textContent = "Erro ao carregar pontos.";
    }
  }

  // ============================================================
  // 🔧 Preenche o select de pontos
  // ============================================================
  function preencherSelect(pontos) {
    selectPontos.innerHTML =
      '<option value="">-- Selecione um ponto de coleta --</option>';

    pontos.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = JSON.stringify({
        nome: p.nome_local || p.nome,
        endereco: p.endereco || "",
        telefone: p.telefone || "",
        email: p.email || "",
      });
      opt.textContent = `${p.nome_local || p.nome} — ${p.endereco || ""}`;
      selectPontos.appendChild(opt);
    });

    pontosPlaceholder.textContent = "";
    document.getElementById("pontosControls").classList.remove("hidden");
    verificarBotaoConfirmar();
  }

  // ============================================================
  // 🧩 Habilita o botão Confirmar quando possível
  // ============================================================
  function verificarBotaoConfirmar() {
    const temPonto = !!selectPontos.value;
    const temCartinha = carrinho.length > 0;

    console.log("🧩 Verificando:", { temPonto, temCartinha, valor: selectPontos.value });

    if (temPonto && temCartinha) {
      btnConfirmar.disabled = false;
      btnConfirmar.style.opacity = "1";
      btnConfirmar.style.cursor = "pointer";
      console.log("✅ Botão habilitado!");
    } else {
      btnConfirmar.disabled = true;
      btnConfirmar.style.opacity = "0.6";
      btnConfirmar.style.cursor = "not-allowed";
    }
  }

  selectPontos.addEventListener("change", () => {
    console.log("📍 Mudou ponto:", selectPontos.value);
    verificarBotaoConfirmar();
  });

  // ============================================================
  // 🗺️ Ver ponto no mapa
  // ============================================================
  verNoMapa.addEventListener("click", () => {
    const val = selectPontos.value;
    if (!val) return alert("Selecione um ponto de coleta primeiro.");
    const ponto = JSON.parse(val);
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(ponto.endereco)}`,
      "_blank"
    );
  });

  // ============================================================
  // 💌 Confirmar adoção (envia API + e-mail)
  // ============================================================
  btnConfirmar.addEventListener("click", async () => {
    const pontoSelecionado = selectPontos.value
      ? JSON.parse(selectPontos.value)
      : null;

    if (!pontoSelecionado) {
      alert("Por favor, selecione um ponto de coleta.");
      return;
    }

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Enviando...";

    try {
      const baseURL = window.location.hostname.includes("vercel.app")
        ? ""
        : "https://varaldossonhos.vercel.app";

      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 10);
      const prazo = dataLimite.toLocaleDateString("pt-BR");

      for (const carta of carrinho) {
        console.log("📨 Enviando adoção:", carta.nome);

        // 📨 Envia para API (Airtable)
        const resposta = await fetch(`${baseURL}/api/adocoes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_cartinha: carta.id,
            nome_crianca: carta.nome,
            usuario: usuario.nome,
            email: usuario.email,
            ponto_coleta: pontoSelecionado.nome,
          }),
        });

        const resultado = await resposta.json();
        console.log("📬 Retorno da API:", resultado);

        if (!resposta.ok)
          throw new Error(resultado.erro || "Erro ao registrar adoção.");

        // 💙 Envia e-mail via EmailJS
        await emailjs.send("service_uffgnhx", "template_4yfc899", {
          to_name: usuario.nome,
          to_email: usuario.email,
          child_name: carta.nome,
          child_gift: carta.sonho,
          deadline: prazo,
          pickup_name: pontoSelecionado.nome,
          pickup_address: pontoSelecionado.endereco,
          pickup_phone: pontoSelecionado.telefone || "(11) 99999-9999",
        });
      }

      mostrarMensagemSucesso();
      alert("💙 Adoção confirmada! Você receberá um e-mail de confirmação.");
      localStorage.removeItem("carrinho");
      setTimeout(() => (window.location.href = "index.html"), 4000);
    } catch (erro) {
      console.error("❌ Erro ao confirmar adoção:", erro);
      alert("Erro ao confirmar adoção. Verifique o console.");
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "✅ Confirmar Adoção";
    }
  });

  // ============================================================
  // ☁️ Cloudinho animado
  // ============================================================
  function mostrarMensagemSucesso() {
    const popup = document.createElement("div");
    popup.className = "cloudinho-popup";
    popup.innerHTML = `
      <div class="cloudinho-popup-inner">
        <img src="/public/imagens/cloudinho.png" alt="Cloudinho" class="cloudinho-popup-img">
        <div>
          <h3>💙 Adoção Confirmada!</h3>
          <p>Obrigado por espalhar amor e realizar sonhos!</p>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add("show"), 100);
    setTimeout(() => popup.classList.remove("show"), 3500);
    setTimeout(() => popup.remove(), 4500);
  }

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
  carregarPontos().then(() => verificarBotaoConfirmar());
});
