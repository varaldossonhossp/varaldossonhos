document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("cartinhasContainer");
  const loginLink = document.getElementById("loginLink");

  // Exibir nome do usuário logado (se houver)
  const usuario = localStorage.getItem("nomeUsuario");
  if (usuario) {
    loginLink.textContent = usuario;
    loginLink.href = "#";
    loginLink.style.fontWeight = "bold";
    loginLink.style.color = "#1E50E2";
  }

  // Carregar cartinhas do banco (API)
  try {
    const response = await fetch("/api/cartinhas");
    if (!response.ok) throw new Error("Erro ao carregar cartinhas");
    const cartinhas = await response.json();

    container.innerHTML = "";

    cartinhas.forEach(c => {
      const nome = c.fields?.primeiro_nome || "Criança";
      const idade = c.fields?.idade || "Não informada";
      const sonho = c.fields?.sonho || "Sonho não informado";
      const irmaos = c.fields?.irmaos || "Não informado";
      const imagem = c.fields?.imagem_cartinha?.[0]?.url || "imagens/sem-imagem.jpg";
      const sexo = c.fields?.sexo === "menina" ? "imagens/menina.jpg" : "imagens/menino.jpg";
      const id = c.fields?.id_cartinha || Math.random().toString(36).substring(2, 9);

      const card = document.createElement("div");
      card.className = "card-cartinha";
      card.innerHTML = `
        <img src="imagens/prendedor.png" alt="Prendedor" class="prendedor">
        <img src="${imagem}" alt="Cartinha de ${nome}" class="carta">
        <img src="${sexo}" alt="Avatar da criança" class="avatar">
        <h3>${nome}</h3>
        <p>${idade} anos</p>
        <p><strong>Sonho:</strong> ${sonho}</p>
        <p><strong>Irmãos:</strong> ${irmaos}</p>
        <button class="btn-adotar" data-id="${id}" data-nome="${nome}" data-sonho="${sonho}" data-imagem="${imagem}">
          Adotar 💙
        </button>
      `;
      container.appendChild(card);
    });

    // Evento do botão "Adotar"
    document.querySelectorAll(".btn-adotar").forEach(botao => {
      botao.addEventListener("click", () => {
        const id = botao.dataset.id;
        const nome = botao.dataset.nome;
        const sonho = botao.dataset.sonho;
        const imagem = botao.dataset.imagem;

        let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

        // Evita duplicar
        if (carrinho.some(c => c.id === id)) {
          alert(`Você já adotou a cartinha de ${nome}! 💙`);
          return;
        }

        carrinho.push({ id, nome, sonho, imagem });
        localStorage.setItem("carrinho", JSON.stringify(carrinho));

        alert(`Cartinha de ${nome} adicionada ao carrinho! 💙`);
      });
    });

  } catch (erro) {
    console.error("Erro ao carregar cartinhas:", erro);
    container.innerHTML = "<p>Erro ao carregar as cartinhas. Tente novamente mais tarde.</p>";
  }

  // Controle do carrossel
  const carrossel = document.querySelector(".cartinhas-lista");
  document.getElementById("prevBtn").addEventListener("click", () => {
    carrossel.scrollBy({ left: -300, behavior: "smooth" });
  });
  document.getElementById("nextBtn").addEventListener("click", () => {
    carrossel.scrollBy({ left: 300, behavior: "smooth" });
  });
});
