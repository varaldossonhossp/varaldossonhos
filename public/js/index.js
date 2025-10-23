// ============================================================
// 💙 VARAL DOS SONHOS — index.js 
// ------------------------------------------------------------
// Página inicial — controla o carrossel dinâmico de eventos
// com destaque_home = true (vitrine de campanhas solidárias).
// ------------------------------------------------------------
// 🔗 API utilizada: /api/eventos  (ou /api/index?rota=eventos)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  carregarEventos(); // inicia o carregamento assim que a página abre
});

// ============================================================
// 🔁 Carrega os eventos do Airtable (via API pública do Vercel)
// ============================================================
async function carregarEventos() {
  const track = document.getElementById("carouselTrack");
  if (!track) return;

  try {
    // 🔹 Define baseURL dinâmica (Vercel ou local)
    const baseURL = window.location.hostname.includes("vercel.app")
      ? ""
      : "https://varaldossonhos.vercel.app";

    const resposta = await fetch(`${baseURL}/api/eventos`);
    if (!resposta.ok) throw new Error("Erro ao buscar eventos no servidor.");

    const eventos = await resposta.json();
    track.innerHTML = "";

    // 🔹 Caso não haja eventos retornados
    if (!eventos || eventos.length === 0) {
      adicionarImagemPadrao(track);
      return;
    }

    // 🔹 Monta o carrossel com os dados da API
    eventos.forEach((ev, i) => {
      const imagem =
        ev.imagem || ev.imagem_evento?.[0]?.url || "imagens/evento-padrao.jpg";
      const nome = ev.nome || ev.nome_evento || "Evento Solidário";
      const descricao = ev.descricao || ev.descricao_evento || "";
      const data = ev.data_inicio || "";

      const li = document.createElement("li");
      li.className = `carousel-slide${i === 0 ? " active" : ""}`;
      li.innerHTML = `
        <img src="${imagem}" 
             alt="${nome}" 
             title="${nome} - ${descricao}" 
             loading="lazy">
      `;
      track.appendChild(li);
    });

    iniciarCarrossel();
  } catch (erro) {
    console.error("❌ Erro ao carregar eventos:", erro);
    adicionarImagemPadrao(track);
  }
}

// ============================================================
// 🌤️ Exibe imagem padrão quando não há eventos disponíveis
// ============================================================
function adicionarImagemPadrao(track) {
  track.innerHTML = `
    <li class="carousel-slide active">
      <img src="imagens/evento-padrao.jpg" 
           alt="Campanha solidária" 
           loading="lazy">
    </li>`;
  iniciarCarrossel();
}

// ============================================================
// 🎞️ Controle do carrossel (fade automático + botões laterais)
// ============================================================
let intervaloCarrossel;

function iniciarCarrossel() {
  const track = document.getElementById("carouselTrack");
  const slides = Array.from(track.querySelectorAll(".carousel-slide"));
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");

  let index = 0;
  const total = slides.length;
  if (total === 0) return;

  // 🔹 Evita múltiplos intervalos simultâneos
  if (intervaloCarrossel) clearInterval(intervaloCarrossel);

  slides[index].classList.add("active");

  const mostrarSlide = (novoIndex) => {
    slides.forEach((slide, i) =>
      slide.classList.toggle("active", i === novoIndex)
    );
  };

  const proximoSlide = () => {
    index = (index + 1) % total;
    mostrarSlide(index);
  };

  const slideAnterior = () => {
    index = (index - 1 + total) % total;
    mostrarSlide(index);
  };

  nextBtn?.addEventListener("click", proximoSlide);
  prevBtn?.addEventListener("click", slideAnterior);

  intervaloCarrossel = setInterval(proximoSlide, 4000);

  // 🔹 Pausa o carrossel quando a aba fica em segundo plano
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInterval(intervaloCarrossel);
    } else {
      intervaloCarrossel = setInterval(proximoSlide, 4000);
    }
  });
}
