// ============================================================
// 🌐 VARAL DOS SONHOS — evento-detalhe.js
// Exibe as informações completas de um evento selecionado
// ============================================================

import { carregarComponentes, atualizarLogin } from "./componentes.js";

document.addEventListener("DOMContentLoaded", async () => {
  await carregarComponentes();
  atualizarLogin();
  carregarDetalhesEvento();
});

async function carregarDetalhesEvento() {
  const container = document.querySelector("#eventoDetalhe .container");
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  if (!id) {
    container.innerHTML = "<p class='erro'>Evento não encontrado.</p>";
    return;
  }

  try {
    const resposta = await fetch(`/api/evento-detalhe?id=${id}`);
    const evento = await resposta.json();

    container.innerHTML = `
      <article class="detalhe-card">
        <div class="detalhe-imagem">
          <img src="${evento.imagem}" alt="${evento.nome}" />
        </div>
        <div class="detalhe-info">
          <h1>${evento.nome}</h1>
          <p class="detalhe-data">📅 ${formatarData(evento.data_inicio)} ${
      evento.data_fim ? `→ ${formatarData(evento.data_fim)}` : ""
    }</p>
          <p class="detalhe-local">📍 ${evento.local || "Local a definir"}</p>
          <p class="detalhe-status">🔵 Status: ${evento.status}</p>
          <p class="detalhe-responsavel">👤 Responsável: ${
            evento.responsavel || "Equipe Varal dos Sonhos"
          }</p>
          <p class="detalhe-descricao">${evento.descricao || ""}</p>
        </div>
      </article>
    `;
  } catch (erro) {
    console.error("Erro ao carregar evento:", erro);
    container.innerHTML = "<p class='erro'>❌ Não foi possível carregar este evento.</p>";
  }
}

function formatarData(dataISO) {
  if (!dataISO) return "";
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
