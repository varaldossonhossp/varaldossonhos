// ============================================================
// 💙 VARAL DOS SONHOS — carrinho.js (versão final revisada 2025)
// ------------------------------------------------------------
// Responsável por:
//   • Exibir cartinhas adicionadas ao carrinho (localStorage)
//   • Permitir escolher ponto de coleta
//   • Confirmar adoção via API (/api/adocoes)
//   • Enviar e-mail e atualizar status da cartinha
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  montarCarrinho();
  carregarPontosDeColeta();
});

// ============================================================
// 🧺 Monta o carrinho a partir do localStorage
// ============================================================
function montarCarrinho() {
  const container = document.querySelector("#listaCarrinho");
  if (!container) return;

  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  container.innerHTML = "";

  if (carrinho.length === 0) {
    container.innerHTML = `
      <p>Seu carrinho está vazio 💌</p>
      <a href="cartinhas.html" class="btn-voltar">Voltar ao Varal</a>
    `;
    return;
  }

  carrinho.forEach((item, index) => {
    const card = document.createElement("div");
    card.classList.add("cartinha-carrinho");

    card.innerHTML = `
      <img src="${item.imagem}" alt="Cartinha de ${item.nome}">
      <div class="cartinha-info">
        <h3>${item.nome}</h3>
        <p>${item.sonho}</p>
        <button class="btn-remover" data-index="${index}">Remover</button>
      </div>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll(".btn-remover").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = e.target.dataset.index;
      removerDoCarrinho(index);
    });
  });
}

// ============================================================
// ❌ Remover item do carrinho
// ============================================================
function removerDoCarrinho(index) {
  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  carrinho.splice(index, 1);
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  montarCarrinho();
}

// ============================================================
// 📍 Carrega pontos de coleta do Airtable via API
// ============================================================
async function carregarPontosDeColeta() {
  const select = document.querySelector("#pontoColeta");
  if (!select) return;

  try {
    const baseURL = window.location.hostname.includes("vercel.app")
      ? ""
      : "https://varaldossonhos-sp.vercel.app";

    console.log("📡 Buscando pontos em:", `${baseURL}/api/pontosdecoleta`);

    const resposta = await fetch(`${baseURL}/api/pontosdecoleta`);
    if (!resposta.ok) throw new Error("Erro ao buscar pontos de coleta");

    const pontos = await resposta.json();
    console.log("📍 Pontos recebidos:", pontos);

    select.innerHTML = `<option value="">Escolha o ponto de coleta</option>`;

    pontos.forEach((ponto) => {
      const option = document.createElement("option");
      option.value = ponto.nome_local || ponto.endereco;
      option.textContent = `${ponto.nome_local} — ${ponto.endereco}`;
      select.appendChild(option);
    });
  } catch (erro) {
    console.error("❌ Erro ao carregar pontos de coleta:", erro);
    const select = document.querySelector("#pontoColeta");
    if (select) {
      select.innerHTML = `<option value="">Erro ao carregar pontos ❌</option>`;
    }
  }
}

// ============================================================
// ✅ Confirmar Adoção — Envia dados à API /api/adocoes
// ============================================================
document
  .getElementById("btnConfirmarAdocao")
  ?.addEventListener("click", async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) {
      alert("⚠️ Faça login para confirmar a adoção!");
      window.location.href = "login.html";
      return;
    }

    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio 💌");
      return;
    }

    const select = document.querySelector("#pontoColeta");
    const ponto_coleta = select?.value?.trim();
    if (!ponto_coleta) {
      alert("⚠️ É obrigatório selecionar um ponto de coleta para finalizar!");
      return;
    }

    // 🔹 Usa a primeira cartinha do carrinho (1 adoção por vez)
    const cartinhaSelecionada = carrinho[0];
    const cartinha = cartinhaSelecionada?.id || cartinhaSelecionada?.nome || "";

    if (!cartinha) {
      alert("⚠️ Erro interno: cartinha não encontrada no carrinho!");
      return;
    }

    const payload = {
      doador: usuario.nome || usuario.email || "doador_anônimo",
      email: usuario.email || "sem_email@varaldossonhos.com",
      cartinha,
      ponto_coleta,
    };

    console.log("📦 Enviando adoção:", payload);

    try {
      const resposta = await fetch("/api/adocoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const dados = await resposta.json();
      console.log("📨 Retorno da API:", dados);

      if (resposta.ok && dados.ok) {
        alert("💙 Adoção confirmada com sucesso!");
        localStorage.removeItem("carrinho");
        window.location.href = "cartinhas.html";
      } else {
        throw new Error(dados.erro || "Erro desconhecido ao confirmar adoção.");
      }
    } catch (erro) {
      console.error("❌ Erro ao confirmar adoção:", erro);
      alert(
        "❌ Falha ao confirmar adoção. Verifique a conexão e tente novamente."
      );
    }
  });

// ============================================================
// 🔄 Limpar carrinho
// ============================================================
document.getElementById("btnLimparCarrinho")?.addEventListener("click", () => {
  if (confirm("Tem certeza que deseja limpar o carrinho?")) {
    localStorage.removeItem("carrinho");
    montarCarrinho();
  }
});

// ============================================================
// ➕ Adotar outra cartinha (voltar ao varal)
// ============================================================
document.getElementById("btnAdotarOutra")?.addEventListener("click", () => {
  window.location.href = "cartinhas.html";
});
