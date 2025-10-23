// ============================================================
// 🌐 VARAL DOS SONHOS — eventos.js
// Lista todos os eventos da tabela "eventos" do Airtable
// ============================================================

import { carregarComponentes, atualizarLogin } from "./componentes.js";

document.addEventListener("DOMContentLoaded", async () => {
  await carregarComponentes();
  atualizarLogin();
  carregarEventos();
});

// 🔁 Puxa todos os eventos da API
async function carregarEventos() {
  const container = document.getElementById("listaEventos").querySelector(".container");

  try {
    // 🔄 Busca TODOS os eventos (ajuste aplicado aqui 👇)
    const resposta = await fetch("/api/eventos-todos");
    const eventos = await resposta.json();

    if (!eventos || eventos.length === 0) {
      container.innerHTML = "<p class='sem-eventos'>Nenhum evento encontrado.</p>";
      return;
    }

    // Remove mensagem de carregamento
    container.innerHTML = "";

    // Cria um card para cada evento
    eventos.forEach((ev) => {
      const card = document.createElement("article");
      card.className = "evento-card";
      card.setAttribute("data-id", ev.id);

      card.innerHTML = `
        <div class="evento-imagem">
          <img src="${ev.imagem}" alt="${ev.nome}" loading="lazy" />
          <span class="evento-status ${ev.status?.toLowerCase()}">${ev.status}</span>
        </div>

        <div class="evento-info">
          <h2 class="evento-nome">${ev.nome}</h2>
          <p class="evento-data">
            📅 ${formatarData(ev.data_inicio)} 
            ${ev.data_fim ? ` → ${formatarData(ev.data_fim)}` : ""}
          </p>
          <p class="evento-local">📍 ${ev.local || "Local a definir"}</p>
          <p class="evento-descricao">${ev.descricao || "Sem descrição disponível."}</p>
          <button class="btn btn-outline btn-detalhes">Ver detalhes</button>
        </div>
      `;

      // Ao clicar, abre a página de detalhes
      card.querySelector(".btn-detalhes").addEventListener("click", () => {
        window.location.href = `evento-detalhe.html?id=${ev.id}`;
      });

      container.appendChild(card);
    });
  } catch (erro) {
    console.error("Erro ao carregar eventos:", erro);
    container.innerHTML =
      "<p class='erro'>❌ Erro ao carregar os eventos. Tente novamente mais tarde.</p>";
  }
}

// 🗓️ Formata a data no padrão brasileiro
function formatarData(dataISO) {
  if (!dataISO) return "";
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
