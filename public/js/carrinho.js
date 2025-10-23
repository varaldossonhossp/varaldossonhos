// js/carrinho.js
document.addEventListener("DOMContentLoaded", () => {
  const carrinhoLista = document.getElementById("carrinhoLista");
  const btnLimpar = document.getElementById("btnLimpar");
  const btnConfirmar = document.getElementById("btnConfirmar");
  const feedback = document.getElementById("feedback");

  const pontosPlaceholder = document.getElementById("pontosPlaceholder");
  const pontosControls = document.getElementById("pontosControls");
  const selectPontos = document.getElementById("selectPontos");
  const verNoMapa = document.getElementById("verNoMapa");

  // modal mapa
  const mapModal = document.getElementById("mapModal");
  const mapFrame = document.getElementById("mapFrame");
  const closeMap = document.getElementById("closeMap");
  const mapBackdrop = document.getElementById("mapBackdrop");
  const mapCaption = document.getElementById("mapCaption");

  // Usuário (exige login)
  const usuario = JSON.parse(localStorage.getItem("usuario")) || JSON.parse(localStorage.getItem("nomeUsuario") ? JSON.stringify({ nome: localStorage.getItem("nomeUsuario"), email: localStorage.getItem("usuarioEmail") || "" }) : null);
  if (!usuario || !usuario.email) {
    alert("Você precisa estar logado para acessar o carrinho.");
    window.location.href = "login.html";
    return;
  }

  // Carrega carrinho
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  function renderCarrinho() {
    carrinhoLista.innerHTML = "";
    if (!Array.isArray(carrinho) || carrinho.length === 0) {
      carrinhoLista.innerHTML = "<p>Seu carrinho está vazio 😢</p>";
      return;
    }

    carrinho.forEach((item, index) => {
      const nome = item.nome || item.primeiro_nome || "Criança";
      const imagem = item.imagem || item.imagem_cartinha || "imagens/sem-imagem.jpg";
      const idade = item.idade || item.age || "";
      const sexo = item.sexo || item.gender || "";

      const div = document.createElement("div");
      div.className = "carrinho-item";
      div.innerHTML = `
        <img src="${imagem}" alt="${nome}" class="cartinha-foto" />
        <h3>${nome}</h3>
        <p>${idade ? `<strong>Idade:</strong> ${idade} anos` : ""} ${sexo ? `<strong>Sexo:</strong> ${sexo}` : ""}</p>
        <p class="mini">${item.sonho ? `<strong>Sonho:</strong> ${item.sonho}` : ""}</p>
        <button class="remover" data-index="${index}">Remover</button>
      `;
      carrinhoLista.appendChild(div);
    });
  }

  renderCarrinho();

  // remover item
  carrinhoLista.addEventListener("click", (e) => {
    if (e.target.classList.contains("remover")) {
      const idx = Number(e.target.dataset.index);
      carrinho.splice(idx, 1);
      localStorage.setItem("carrinho", JSON.stringify(carrinho));
      renderCarrinho();
      checkConfirmEnabled();
    }
  });

  // limpar carrinho
  btnLimpar.addEventListener("click", () => {
    if (confirm("Tem certeza que deseja limpar o carrinho?")) {
      carrinho = [];
      localStorage.removeItem("carrinho");
      renderCarrinho();
      checkConfirmEnabled();
    }
  });

  // carregar pontos do servidor (API)
  async function carregarPontos() {
    pontosPlaceholder.classList.remove("hidden");
    pontosControls.classList.add("hidden");
    try {
      const resp = await fetch("/api/pontosdecoleta");
      if (!resp.ok) throw new Error("Erro ao buscar pontos");
      const pontos = await resp.json();
      popularSelectPontos(pontos);
    } catch (err) {
      console.error("Erro pontos:", err);
      pontosPlaceholder.textContent = "Não foi possível carregar os pontos. Tente novamente mais tarde.";
    }
  }

  function popularSelectPontos(pontos = []) {
    if (!Array.isArray(pontos) || pontos.length === 0) {
      pontosPlaceholder.textContent = "Nenhum ponto de coleta disponível.";
      return;
    }

    // limpa select preservando primeiro option
    selectPontos.innerHTML = '<option value="">-- Selecione um ponto de coleta --</option>';
    pontos.forEach((p, i) => {
      const opt = document.createElement("option");
      // guardamos o endereço e id no value (json string)
      const payload = {
        id: p.id || p.nome_local || i,
        nome: p.nome_local || p.nome || "Ponto",
        endereco: p.endereco || "",
      };
      opt.value = JSON.stringify(payload);
      opt.textContent = `${payload.nome} — ${payload.endereco}`;
      selectPontos.appendChild(opt);
    });

    pontosPlaceholder.classList.add("hidden");
    pontosControls.classList.remove("hidden");
  }

  // ver no mapa
  verNoMapa.addEventListener("click", () => {
    const val = selectPontos.value;
    if (!val) return;
    const payload = JSON.parse(val);
    abrirMapa(payload.endereco, payload.nome);
  });

  // abrir mapa (modal)
  function abrirMapa(endereco, nome = "") {
    const url = `https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`;
    mapFrame.src = url;
    mapCaption.textContent = nome || endereco;
    mapModal.classList.add("aberto");
    mapModal.setAttribute("aria-hidden", "false");
  }

  // fechar modal mapa
  function fecharMapa() {
    mapModal.classList.remove("aberto");
    mapModal.setAttribute("aria-hidden", "true");
    mapFrame.src = "about:blank";
  }

  closeMap.addEventListener("click", fecharMapa);
  mapBackdrop.addEventListener("click", fecharMapa);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mapModal.classList.contains("aberto")) fecharMapa();
  });

  // habilitar/desabilitar ver no mapa e confirmar
  selectPontos.addEventListener("change", () => {
    verNoMapa.disabled = !selectPontos.value;
    checkConfirmEnabled();
  });

  function checkConfirmEnabled() {
    // Confirmar habilitado apenas se 1) carrinho tem itens e 2) ponto selecionado
    const pontoSelecionado = !!selectPontos.value;
    btnConfirmar.disabled = !(carrinho.length > 0 && pontoSelecionado);
  }

  // confirmar adoção
  btnConfirmar.addEventListener("click", async () => {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }
    if (!selectPontos.value) {
      alert("Por favor, selecione um ponto de coleta para continuar.");
      return;
    }

    // pega os dados do ponto
    const ponto = JSON.parse(selectPontos.value);

    // montar payload — conforme sua API /api/adocoes espera
    const payload = {
      usuarioEmail: usuario.email,
      cartinhas: carrinho.map(c => {
        // manter compatibilidade com estruturas diferentes
        return {
          id: c.id || c.id_cartinha || Math.random().toString(36).substring(2,8),
          nome: c.nome || c.primeiro_nome || "Anônimo",
          sonho: c.sonho || c.descricao || "",
          imagem: c.imagem || c.imagem_cartinha || ""
        };
      }),
      ponto_coleta: ponto.nome || ponto.endereco || ""
    };

    // UX: feedback e desabilitar botões
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Enviando...";
    feedback.classList.add("hidden");

    try {
      const resp = await fetch("/api/adocoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioEmail: payload.usuarioEmail,
          cartinhas: payload.cartinhas
        })
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        // calcular pontuação (exemplo local): 10 pts por cartinha
        const pontosGanhos = (payload.cartinhas.length || 0) * 10;
        // gravar local (ex.: localStorage) — substitua por endpoint server-side quando pronto
        const pontuacaoAtual = Number(localStorage.getItem("cloudinho_pontos") || 0);
        const novaPontuacao = pontuacaoAtual + pontosGanhos;
        localStorage.setItem("cloudinho_pontos", String(novaPontuacao));

        // mostrar confirmação
        alert(`💙 Adoção confirmada! Você ganhou ${pontosGanhos} pts de gamificação (total: ${novaPontuacao} pts).`);
        // limpar carrinho
        localStorage.removeItem("carrinho");
        // opcional: mostrar cloudinho success (se existir notificacao.js)
        if (window.mostrarMensagemSucesso) {
          try { window.mostrarMensagemSucesso(); } catch {}
        }
        // redirecionar (ou atualizar a página)
        window.location.href = "index.html";
      } else {
        console.error("Erro na API adocoes:", data);
        alert("⚠️ Erro ao registrar adoção: " + (data.error || JSON.stringify(data)));
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "✅ Confirmar Adoção";
      }
    } catch (err) {
      console.error("Erro ao confirmar adoção:", err);
      alert("❌ Erro na conexão. Tente novamente mais tarde.");
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "✅ Confirmar Adoção";
    }
  });

  // iniciar
  carregarPontos();
  checkConfirmEnabled();
});
