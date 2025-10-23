// ============================================================
// 💙 VARAL DOS SONHOS — componentes.js
// ------------------------------------------------------------
// Responsável por carregar automaticamente:
//   - Header (menu de navegação)
//   - Footer (rodapé)
//   - Cloudinho (mascote interativo)
// Também sincroniza o estado de login/logout entre as páginas.
//
// 🔗 Compatível com: .NET MAUI WebView, Vercel, Airtable, EmailJS
// ------------------------------------------------------------
// Observação importante:
//   O antigo /api/cloudinho.js foi removido —
//   Cloudinho agora é injetado dinamicamente via js/cloudinho.js
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  await carregarComponentes();
  atualizarLogin();
});

// ============================================================
// 🔹 Carregar Header, Footer e Cloudinho (componentes HTML)
// ------------------------------------------------------------
// Compatível com hospedagem local e deploy Vercel.
// Adapta caminhos relativos automaticamente, mesmo dentro do MAUI.
// ============================================================
async function carregarComponentes() {
  try {
    // Detecta se está rodando em Vercel ou local
    const baseURL = window.location.hostname.includes("vercel.app")
      ? "" // em produção, caminhos relativos funcionam
      : "."; // em localhost, mantém o caminho relativo direto

    // ------------------------------------------------------------
    // Cabeçalho (Menu de navegação)
    // ------------------------------------------------------------
    const header = document.getElementById("header");
    if (header) {
      const resp = await fetch(`${baseURL}/componentes/header.html`);
      if (resp.ok) {
        header.innerHTML = await resp.text();
      } else {
        header.innerHTML = "<p>⚠️ Header não encontrado</p>";
      }

      // 🔁 Corrige os links de navegação do cabeçalho
      corrigirLinksRelativos(header);
    }

    // ------------------------------------------------------------
    // Rodapé
    // ------------------------------------------------------------
    const footer = document.getElementById("footer");
    if (footer) {
      const resp = await fetch(`${baseURL}/componentes/footer.html`);
      footer.innerHTML = resp.ok ? await resp.text() : "<p>⚠️ Footer não encontrado</p>";
    }

    // ------------------------------------------------------------
    // Cloudinho (mascote flutuante)
    // ------------------------------------------------------------
    const cloudinho = document.getElementById("cloudinho");
    if (cloudinho) {
      // 🔹 Antes era importado de componentes/cloudinho.html
      // 🔹 Agora o conteúdo é injetado dinamicamente via js/cloudinho.js
      // Portanto, só deixamos o container vazio pronto.
      cloudinho.innerHTML = "";
    }

    // Reaplica o login/logout após carregar o header
    atualizarLogin();
  } catch (erro) {
    console.error("❌ Erro ao carregar componentes:", erro);
  }
}

// ============================================================
// 🧭 Corrige os caminhos dos links do menu (para MAUI e Vercel)
// ------------------------------------------------------------
// Alguns ambientes (como .NET MAUI WebView) exigem caminhos absolutos.
// Esta função garante que todos os <a href> funcionem corretamente.
// ============================================================
function corrigirLinksRelativos(container) {
  try {
    const links = container.querySelectorAll("a[href]");
    const basePath = window.location.pathname.split("/").slice(0, -1).join("/");
    links.forEach((a) => {
      const href = a.getAttribute("href");
      // Ignora âncoras e links externos
      if (href.startsWith("http") || href.startsWith("#")) return;
      // Corrige links relativos quebrados no MAUI
      if (!href.startsWith("/") && !href.startsWith("componentes/")) {
        a.setAttribute("href", `${basePath}/${href}`);
      }
    });
  } catch (e) {
    console.warn("⚠️ Erro ao corrigir links:", e);
  }
}

// ============================================================
// 👤 Atualiza status do login e botão “Sair”
// ------------------------------------------------------------
// - Sincroniza o estado de login entre todas as páginas
// - Exibe saudação “Olá, [nome]”
// - Mostra/oculta botão de logout
// ============================================================
function atualizarLogin() {
  const usuarioData = localStorage.getItem("usuario");
  const loginLink = document.getElementById("loginLink");
  const usuarioNome = document.getElementById("usuarioNome");
  const btnLogout = document.getElementById("btnLogout");

  if (!loginLink || !usuarioNome || !btnLogout) return;

  if (usuarioData) {
    const usuario = JSON.parse(usuarioData);
    usuarioNome.textContent = `Olá, ${usuario.nome.split(" ")[0]}!`;
    usuarioNome.style.display = "inline-block";
    loginLink.style.display = "none";
    btnLogout.style.display = "inline-block";

    // 🟦 Botão Sair — limpa o localStorage e volta à Home
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("usuario");
      alert("Você saiu com sucesso 💙");
      window.location.href = "index.html";
    });
  } else {
    usuarioNome.style.display = "none";
    loginLink.style.display = "inline-block";
    btnLogout.style.display = "none";
  }
}
