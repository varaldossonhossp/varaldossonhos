/* js/carrossel.js
   Carrossel acessível (3 por vez / até 15 imagens), autoplay + loop suave
*/
const track = document.getElementById('carouselTrack');
const prev  = document.getElementById('carouselPrev');
const next  = document.getElementById('carouselNext');

if (track) {
  // Limite máximo de 15 imagens
  const slides = Array.from(track.querySelectorAll('.carousel-slide')).slice(0, 15);

  // Se tiver menos que 4, não clona (não precisa de loop)
  const enableLoop = slides.length >= 4;

  // Para loop infinito: clonar primeiros e últimos itens
  if (enableLoop) {
    const clonesHead = slides.slice(0, 3).map(n => n.cloneNode(true));
    const clonesTail = slides.slice(-3).map(n => n.cloneNode(true));
    clonesHead.forEach(n => track.appendChild(n));
    clonesTail.reverse().forEach(n => track.insertBefore(n, track.firstChild));
  }

  const allSlides = Array.from(track.querySelectorAll('.carousel-slide'));
  const gap = parseFloat(getComputedStyle(track).gap) || 14;

  // Calcula a largura de 1 “card” (considerando breakpoints)
  const slideWidth = () => allSlides[0].getBoundingClientRect().width + gap;

  // Posição inicial (se clonou, começa após os 3 clones do início)
  let index = enableLoop ? 3 : 0;
  let offset = -index * slideWidth();
  track.style.transform = `translateX(${offset * -1}px)`; // invertido por causa do padding

  const goTo = (newIndex, { animate = true } = {}) => {
    index = newIndex;
    const dist = index * slideWidth();
    track.style.transition = animate ? 'transform .6s ease' : 'none';
    track.style.transform = `translateX(${-dist}px)`;
  };

  const step = (dir = 1) => {
    const maxIndex = allSlides.length - 3; // 3 visíveis na view desktop
    goTo(index + dir);

    // Teletransporte suave quando passar dos limites (loop)
    track.addEventListener('transitionend', () => {
      if (!enableLoop) return;

      if (index >= maxIndex) {
        // voltou ao bloco original (sem animação)
        goTo(3, { animate: false });
      }
      if (index <= 0) {
        goTo(allSlides.length - 6, { animate: false });
      }
    }, { once: true });
  };

  // Controles
  next?.addEventListener('click', () => step(+1));
  prev?.addEventListener('click', () => step(-1));

  // Autoplay (pausa ao focar/hover)
  let timer = setInterval(() => step(+1), 3500);
  const pause = () => clearInterval(timer);
  const resume = () => { timer = setInterval(() => step(+1), 3500); };

  track.addEventListener('mouseenter', pause);
  track.addEventListener('mouseleave', resume);
  track.addEventListener('focusin', pause);
  track.addEventListener('focusout', resume);

  // Ajusta na troca de breakpoint / resize
  const onResize = () => {
    // Recalcula offset mantendo o índice atual
    track.style.transition = 'none';
    const dist = index * slideWidth();
    track.style.transform = `translateX(${-dist}px)`;
  };
  window.addEventListener('resize', () => requestAnimationFrame(onResize));
}
