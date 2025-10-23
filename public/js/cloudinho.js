// ============================================================
// ☁️ CLOUDINHO — Assistente Virtual Inteligente (2025)
// ------------------------------------------------------------
// - Monta o widget do Cloudinho no canto inferior direito
// - Integra com a rota /api/cloudinho
// - Busca respostas da tabela cloudinho_kb no Airtable
// ============================================================

(() => {
  const ROOT_ID = "cloudinho";
  const IMG_SRC = "imagens/cloudinho.png";
  const ZMAX = 2147483647;
  let inactivityTimer = null;
  let observer = null;

  function ensureRoot() {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      root.style.position = "fixed";
      root.style.bottom = "20px";
      root.style.right = "20px";
      root.style.zIndex = ZMAX;
      root.style.display = "flex";
      root.style.flexDirection = "column";
      root.style.alignItems = "flex-end";
      root.style.gap = "8px";
      document.body.appendChild(root);
    }
    return root;
  }

  function render() {
    const root = ensureRoot();
    if (root.querySelector("#cloudinhoBtn")) return;

    root.innerHTML = `
      <button id="cloudinhoBtn" style="background:none;border:none;cursor:pointer;padding:0;">
        <img src="${IMG_SRC}" alt="Cloudinho" class="cloudinho-img" style="width:80px;height:auto;">
      </button>
      <div id="cloudinhoBubble" class="cloudinho-bubble hidden">
        <p id="cloudinhoMessage">Olá! ☁️ Sou o Cloudinho — posso te ajudar com o Varal dos Sonhos?</p>
        <input id="cloudinhoInput" placeholder="Digite sua pergunta..." />
      </div>
    `;

    attachBehavior();
    console.info("☁️ Cloudinho montado.");
  }

  function attachBehavior() {
    const btn = document.getElementById("cloudinhoBtn");
    const bubble = document.getElementById("cloudinhoBubble");
    const input = document.getElementById("cloudinhoInput");

    btn.onclick = () => {
      bubble.classList.toggle("hidden");
      input.focus();
    };

    input.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        const pergunta = input.value.trim();
        input.value = "";
        await enviarPergunta(pergunta);
      }
    });
  }

  async function enviarPergunta(pergunta) {
    const bubble = document.getElementById("cloudinhoBubble");
    const msg = document.getElementById("cloudinhoMessage");

    msg.innerHTML = "⏳ Pensando...";
    try {
      const baseURL = window.location.hostname.includes("vercel.app")
        ? ""
        : "https://varaldossonhos-sp.vercel.app";

      const resposta = await fetch(`${baseURL}/api/cloudinho`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta }),
      }).then((r) => r.json());

      msg.innerHTML = resposta.resposta || "Desculpe, ainda não sei responder isso 💭";
    } catch (err) {
      msg.innerHTML = "⚠️ Erro ao conectar com o servidor.";
      console.error("Erro Cloudinho:", err);
    }

    resetInactivity();
  }

  function resetInactivity() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      const bubble = document.getElementById("cloudinhoBubble");
      if (bubble) bubble.classList.add("hidden");
    }, 8000);
  }

  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => {
      const root = document.getElementById(ROOT_ID);
      if (!root || !root.querySelector("#cloudinhoBtn")) render();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    render();
    startObserver();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
