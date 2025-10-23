// ============================================================
// ☁️ CLOUDINHO — Widget Profissional Auto-Curativo (2025)
// - Monta o HTML do Cloudinho no <body>
// - Recria automaticamente se algum script apagar/esvaziar
// - Evita listeners duplicados
// - Garante visibilidade e z-index alto
// ============================================================

(() => {
  const ROOT_ID = "cloudinho";
  const IMG_SRC = "imagens/cloudinho.png";
  const ZMAX = 2147483647;

  let inactivityTimer = null;
  let observer = null;

  // ---------- Cria/garante o container raiz ----------
  function ensureRoot() {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      root.style.position = "fixed";
      root.style.bottom = "20px";
      root.style.right = "20px";
      root.style.zIndex = String(ZMAX);
      root.style.display = "flex";
      root.style.flexDirection = "column";
      root.style.alignItems = "flex-end";
      root.style.gap = "8px";
      root.style.opacity = "1";
      root.style.transition = "opacity .8s ease";
      document.body.appendChild(root);
    }
    return root;
  }

  // ---------- Renderiza o conteúdo (botão + balão) ----------
  function render() {
    const root = ensureRoot();

    // Se já está renderizado, não refaz
    if (root.querySelector("#cloudinhoBtn") && root.querySelector("#cloudinhoBubble")) return;

    root.innerHTML = `
      <button id="cloudinhoBtn" title="Fale com o Cloudinho" style="background:none;border:none;cursor:pointer;padding:0;">
        <img src="${IMG_SRC}" alt="Cloudinho" class="cloudinho-img">
      </button>
      <div id="cloudinhoBubble" class="cloudinho-bubble hidden">
        <p id="cloudinhoMessage">Oi! Eu sou o Cloudinho ☁️<br>Como posso te ajudar hoje?</p>
      </div>
    `;

    attachBehavior();
    // Mensagem de boas-vindas automática
    setTimeout(() => showBubble("Olá! 👋 Sou o Cloudinho — posso te ajudar com o Varal dos Sonhos?"), 1200);
    console.info("☁️ Cloudinho montado.");
  }

  // ---------- Liga os comportamentos ----------
  function attachBehavior() {
    const root = document.getElementById(ROOT_ID);
    const btn = document.getElementById("cloudinhoBtn");
    const bubble = document.getElementById("cloudinhoBubble");
    const msg = document.getElementById("cloudinhoMessage");

    if (!root || !btn || !bubble || !msg) return;

    // Remove handlers antigos para evitar duplicidade
    const freshBtn = btn.cloneNode(true);
    btn.replaceWith(freshBtn);

    freshBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (bubble.classList.contains("show")) hideBubble();
      else showBubble("Oi! Eu sou o Cloudinho ☁️<br>Como posso te ajudar hoje?");
    });

    document.addEventListener("click", outsideHandler);
  }

  function outsideHandler(e) {
    const root = document.getElementById(ROOT_ID);
    const bubble = document.getElementById("cloudinhoBubble");
    if (!root || !bubble) return;
    if (!root.contains(e.target)) hideBubble();
  }

  function showBubble(text) {
    const bubble = document.getElementById("cloudinhoBubble");
    const msg = document.getElementById("cloudinhoMessage");
    if (!bubble || !msg) return;
    msg.innerHTML = text;
    bubble.classList.remove("hidden");
    bubble.classList.add("show");
    resetInactivity();
  }

  function hideBubble() {
    const bubble = document.getElementById("cloudinhoBubble");
    if (!bubble) return;
    bubble.classList.remove("show");
    setTimeout(() => bubble.classList.add("hidden"), 350);
    clearTimeout(inactivityTimer);
  }

  function resetInactivity() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(hideBubble, 6000);
  }

  // ---------- Observa o DOM e “cura” se for apagado ----------
  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => {
      const root = document.getElementById(ROOT_ID);
      const hasBtn = root && root.querySelector("#cloudinhoBtn");
      const hasBubble = root && root.querySelector("#cloudinhoBubble");
      if (!root || !hasBtn || !hasBubble) {
        render();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ---------- Inicialização robusta ----------
  function init() {
    render();
    startObserver();

    // Redundância: alguns scripts trocam o body no onload; refaça por segurança
    let tries = 0;
    const retry = setInterval(() => {
      tries++;
      render();
      if (tries >= 5) clearInterval(retry);
    }, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
