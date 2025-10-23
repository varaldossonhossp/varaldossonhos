// ============================================================
// 💙 VARAL DOS SONHOS — js/pontosdecoleta.js
// ------------------------------------------------------------
// Tela "Pontos de Coleta":
//  - Busca dados no Airtable via /api/pontosdecoleta (ou /api/index?rota=pontosdecoleta)
//  - Renderiza cards em um "varal" com pregadores
//  - Abre Google Maps em modal ao clicar "Ver no mapa"
//  - Compatível com Vercel, Airtable e .NET MAUI WebView
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  await carregarPontos();
  prepararModalMapa();
  integrarCloudinho();
});

// ============================================================
// 🔗 Carrega pontos a partir da API unificada
//    Observação: Mantemos fallback por rota-querie para MAUI/Vercel
// ============================================================
async function carregarPontos() {
  const container = document.getElementById("cardsContainer");
  if (!container) return;

  // Mostra placeholder enquanto busca
  container.innerHTML = `<div class="placeholder">Carregando pontos…</div>`;

  try {
    // Base URL:
    // - Em produção (Vercel) → relativo ""
    // - Em cenários específicos (como um host local diferente) você pode trocar
    const baseURL = ""; // relativo à própria origem (compatível com Vercel e MAUI)

    // 1ª tentativa (rota direta)
    let resp = await fetch(`${baseURL}/api/pontosdecoleta`);

    // Fallback: caso seu setup exija a rota index com parâmetro
    if (!resp.ok) resp = await fetch(`${baseURL}/api/index?rota=pontosdecoleta`);

    if (!resp.ok) throw new Error("Falha ao carregar pontos de coleta");

    const pontos = await resp.json();
    renderizarCards(pontos);
  } catch (erro) {
    console.error("❌ Erro ao buscar pontos:", erro);
    container.innerHTML = `
      <div class="placeholder erro">
        Não foi possível carregar os pontos agora. Tente novamente mais tarde.
      </div>`;
  }
}

// ============================================================
// 🧩 Monta os cards no DOM (com botão "Ver no mapa")
// Campos esperados (Airtable): nome_local, endereco, telefone,
// email, horario_funcionamento, responsavel, status, data_cadastro
// ============================================================
function renderizarCards(pontos) {
  const container = document.getElementById("cardsContainer");
  if (!Array.isArray(pontos) || pontos.length === 0) {
    container.innerHTML = `<div class="placeholder">Nenhum ponto de coleta disponível.</div>`;
    return;
  }

  const frag = document.createDocumentFragment();

  pontos.forEach((p) => {
    const nome = p.nome_local || "Ponto de Coleta";
    const endereco = p.endereco || "Endereço não informado";
    const telefone = p.telefone || "Telefone não informado";
    const horario = p.horario_funcionamento || "Horário não informado";

    const card = document.createElement("article");
    card.className = "card-coleta";
    card.setAttribute("role", "region");
    card.setAttribute("aria-label", `Ponto: ${nome}`);

    card.innerHTML = `
      <h3 class="card-titulo" title="${nome}">${nome}</h3>
      <p class="card-linha"><strong>Endereço:</strong> ${endereco}</p>
      <p class="card-linha"><strong>Telefone:</strong> ${telefone}</p>
      <p class="card-linha"><strong>Horário:</strong> ${horario}</p>
      <div class="card-acoes">
        <button class="btn-mapa" data-endereco="${encodeURIComponent(endereco)}" aria-label="Ver ${nome} no mapa">
          Ver no mapa
        </button>
      </div>
    `;

    frag.appendChild(card);
  });

  container.innerHTML = "";
  container.appendChild(frag);

  // Liga os botões "Ver no mapa"
  container.querySelectorAll(".btn-mapa").forEach((btn) => {
    btn.addEventListener("click", () => {
      const endereco = decodeURIComponent(btn.getAttribute("data-endereco") || "");
      abrirMapa(endereco);
    });
  });
}

// ============================================================
// 🗺️ Modal de mapa (Google Maps Embed)
// - Usa parâmetro q=<endereco>&output=embed
// - Fecha por botão, clique fora e tecla ESC
// ============================================================
function prepararModalMapa() {
  const modal = document.getElementById("mapModal");
  const frame = document.getElementById("mapFrame");
  const fechar = document.getElementById("closeModal");

  if (!modal || !frame || !fechar) return;

  fechar.addEventListener("click", () => fecharModal());
  modal.addEventListener("click", (e) => {
    // fecha se clicar no backdrop
    if (e.target === modal) fecharModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("aberto")) {
      fecharModal();
    }
  });

  function fecharModal() {
    modal.classList.remove("aberto");
    modal.setAttribute("aria-hidden", "true");
    // Limpamos o src para encerrar o carregamento do mapa (economia de recursos)
    frame.src = "about:blank";
  }

  // Exponho uma função global para abrir o mapa (chamada pelos botões)
  window._abrirMapaModal = (url) => {
    frame.src = url;
    modal.classList.add("aberto");
    modal.setAttribute("aria-hidden", "false");
  };
}

function abrirMapa(endereco) {
  // URL do Google Maps Embed: sem key, somente consulta pública por endereço
  const url = `https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`;
  // Tenta abrir no modal (melhor UX dentro do app)
  if (window._abrirMapaModal) {
    window._abrirMapaModal(url);
  } else {
    // Fallback extremo (se modal não existir por algum motivo)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`, "_blank");
  }
}

// ============================================================
// ☁️ Integração: Cloudinho nessa página
// - Os IDs abaixo são opcionais. Se existirem no HTML, ligamos.
// - Mantém a mesma UX das outras páginas.
// ============================================================
function integrarCloudinho() {
  const btn = document.getElementById("cloudinhoBtn");
  const bubble = document.getElementById("cloudinhoBubble");
  const verPontos = document.getElementById("cloudVerPontos");
  const contato = document.getElementById("cloudContato");
  const text = document.getElementById("cloudinhoText");

  if (!btn || !bubble) return;

  // Mostra/esconde o balão (classe .show é a que usamos no CSS unificado)
  btn.addEventListener("click", () => {
    bubble.classList.toggle("show");
  });

  // Ajuda rápida: “Ver pontos” apenas foca a seção
  verPontos?.addEventListener("click", () => {
    text.textContent = "Aqui estão os pontos mais próximos! Clique em 'Ver no mapa' para abrir o Google Maps ☁️";
    document.getElementById("cardsContainer")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Contato por e-mail
  contato?.addEventListener("click", () => {
    window.open("mailto:contato@varaldossonhos.org", "_blank");
  });
}
