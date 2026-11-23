/* =========================================================
   PARTE 1 · Rayos de colores de la página de inicio
   Cada rayo es una línea con un degradado que va cambiando entre
   los colores de la paleta, y se corre un poco cuando el cursor
   se acerca.
   ========================================================= */

const svg = document.querySelector('#rayos');
const defs = svg.querySelector('defs');
const grupo = svg.querySelector('g');

const colores = [
  '#F6C94D', '#FCB900', '#DBE586', '#D0E426', '#A7C7E4',
  '#88C2F6', '#A88AED', '#826DEE', '#F19DF1', '#EE77BB'
];

const centroX = 875;
const centroY = 570;
const cantidadDeRayos = 40;
const rayos = [];

// "Aleatorio" que siempre da lo mismo, así los rayos no cambian al recargar
let semilla = 11;
function aleatorio() {
  semilla = (semilla * 16807) % 2147483647;
  return semilla / 2147483647;
}

function colorAlAzar() {
  return colores[Math.floor(aleatorio() * colores.length)];
}

// Lista de colores que se repite: "color1;color2;color3;color1"
function cicloDeColores() {
  const a = colorAlAzar();
  return [a, colorAlAzar(), colorAlAzar(), a].join(';');
}

function crearRayo(numero) {
  const angulo = (numero / cantidadDeRayos) * Math.PI * 2 + (aleatorio() - 0.5) * 0.12;
  const inicio = 15 + aleatorio() * 230;
  const largo = aleatorio() > 0.25 ? 2100 : 420 + aleatorio() * 900;
  const grosor = 40 + aleatorio() * 32;

  const x1 = centroX + Math.cos(angulo) * inicio;
  const y1 = centroY + Math.sin(angulo) * inicio;
  const x2 = centroX + Math.cos(angulo) * (inicio + largo);
  const y2 = centroY + Math.sin(angulo) * (inicio + largo);

  const id = 'degradado-rayo-' + numero;
  const ciclo1 = cicloDeColores();
  const ciclo2 = cicloDeColores();
  const duracion = 7 + aleatorio() * 8;
  const conBlanco = aleatorio() > 0.85;

  defs.insertAdjacentHTML('beforeend', `
    <linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      <stop offset="0" stop-color="${ciclo1.split(';')[0]}">
        <animate attributeName="stop-color" values="${ciclo1}" dur="${duracion}s" begin="-${aleatorio() * 8}s" repeatCount="indefinite"/>
      </stop>
      ${conBlanco ? '<stop offset="0.5" stop-color="#FFFFFF"/>' : ''}
      <stop offset="1" stop-color="${ciclo2.split(';')[0]}">
        <animate attributeName="stop-color" values="${ciclo2}" dur="${duracion + 3}s" begin="-${aleatorio() * 8}s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>`);

  const linea = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  linea.setAttribute('x1', x1);
  linea.setAttribute('y1', y1);
  linea.setAttribute('x2', x2);
  linea.setAttribute('y2', y2);
  linea.setAttribute('stroke', `url(#${id})`);
  linea.setAttribute('stroke-width', grosor);
  linea.setAttribute('stroke-linecap', 'round');
  linea.setAttribute('pathLength', 1);   // para poder "dibujarlo" al entrar (ver .rayos line en el CSS)
  linea.style.animationDelay = (numero * 0.035) + 's';
  grupo.appendChild(linea);

  rayos.push({ linea, angulo, grosor, x1, y1, x2, y2 });
}

for (let i = 0; i < cantidadDeRayos; i++) {
  crearRayo(i);
}

// Mueve hacia afuera los rayos que están cerca del cursor
function moverRayos(cursorX, cursorY) {
  rayos.forEach((rayo) => {
    const largoX = rayo.x2 - rayo.x1;
    const largoY = rayo.y2 - rayo.y1;

    // punto del rayo más cercano al cursor
    let t = ((cursorX - rayo.x1) * largoX + (cursorY - rayo.y1) * largoY) / (largoX * largoX + largoY * largoY);
    t = Math.max(0, Math.min(1, t));

    const distancia = Math.hypot(cursorX - (rayo.x1 + largoX * t), cursorY - (rayo.y1 + largoY * t));
    // 1 = el cursor está encima del rayo, 0 = está lejos
    const cercania = Math.max(0, 1 - distancia / 420);
    const empuje = cercania * 110;

    // el rayo se corre hacia afuera y se engrosa
    rayo.linea.style.transform = `translate(${Math.cos(rayo.angulo) * empuje}px, ${Math.sin(rayo.angulo) * empuje}px)`;
    rayo.linea.style.strokeWidth = rayo.grosor + cercania * 18;
  });
}

// Sigue al dedo o al mouse (los "pointer events" sirven para los dos)
let esperando = false;
function seguirPuntero(evento) {
  if (esperando) return;
  esperando = true;
  requestAnimationFrame(() => {
    esperando = false;

    // si la página de inicio no se está viendo, el dibujo no tiene tamaño
    const matriz = svg.getScreenCTM();
    if (!matriz) return;

    // pasamos la posición del puntero a las coordenadas del dibujo
    const punto = svg.createSVGPoint();
    punto.x = evento.clientX;
    punto.y = evento.clientY;
    const enElDibujo = punto.matrixTransform(matriz.inverse());
    moverRayos(enElDibujo.x, enElDibujo.y);
  });
}

function soltarRayos() {
  rayos.forEach((rayo) => {
    rayo.linea.style.transform = '';
    rayo.linea.style.strokeWidth = '';
  });
}

document.addEventListener('pointermove', seguirPuntero);
document.addEventListener('pointerdown', seguirPuntero);
document.documentElement.addEventListener('mouseleave', soltarRayos);
document.addEventListener('pointercancel', soltarRayos);
document.addEventListener('pointerup', (evento) => {
  // con mouse los rayos se quedan donde está el cursor; con el dedo vuelven al soltar
  if (evento.pointerType !== 'mouse') soltarRayos();
});


/* =========================================================
   PARTE 2 · Carruseles de fotos de los proyectos (5 posiciones)
   ========================================================= */

// Clases del CSS, de izquierda a derecha
const posiciones = ['lejos-izq', 'cerca-izq', 'centro', 'cerca-der', 'lejos-der'];

const carruseles = document.querySelectorAll('.carrusel');

carruseles.forEach((carrusel) => {
  const slides = carrusel.querySelectorAll('.slide');
  const botonAnterior = carrusel.querySelector('.flecha--izq');
  const botonSiguiente = carrusel.querySelector('.flecha--der');
  let indiceCentral = 2;

  function acomodarSlides() {
    slides.forEach((slide, i) => {
      let diferencia = i - indiceCentral;
      if (diferencia > 2) diferencia -= slides.length;
      if (diferencia < -2) diferencia += slides.length;
      slide.className = 'slide ' + posiciones[diferencia + 2];
    });
  }

  function anterior() {
    indiceCentral = (indiceCentral - 1 + slides.length) % slides.length;
    acomodarSlides();
  }

  function siguiente() {
    indiceCentral = (indiceCentral + 1) % slides.length;
    acomodarSlides();
  }

  botonAnterior.addEventListener('click', anterior);
  botonSiguiente.addEventListener('click', siguiente);

  // Al hacer clic en una foto del costado, esa pasa al centro
  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => {
      indiceCentral = i;
      acomodarSlides();
    });
  });

  // En el celular también se puede deslizar con el dedo
  let inicioDelToque = 0;
  carrusel.addEventListener('touchstart', (evento) => {
    inicioDelToque = evento.touches[0].clientX;
  });
  carrusel.addEventListener('touchend', (evento) => {
    const diferencia = evento.changedTouches[0].clientX - inicioDelToque;
    if (Math.abs(diferencia) < 40) return;
    if (diferencia < 0) siguiente();
    else anterior();
  });

  // También se puede usar el teclado (solo en el carrusel que se está viendo)
  document.addEventListener('keydown', (evento) => {
    if (carrusel.offsetParent === null) return;
    if (evento.key === 'ArrowLeft') anterior();
    if (evento.key === 'ArrowRight') siguiente();
  });
});


/* =========================================================
   PARTE 3 · Interacciones al tocar (celular y tablet)
   En una pantalla táctil no existe "pasar el cursor", así que al tocar una
   etiqueta de Sobre mí o el nombre del proyecto se pone la clase "tocada",
   que en el CSS hace lo mismo que el hover. Se quita sola al rato.
   ========================================================= */

document.querySelectorAll('.etiqueta, .miga--actual').forEach((elemento) => {
  let temporizador;
  elemento.addEventListener('pointerdown', (evento) => {
    if (evento.pointerType === 'mouse') return;   // con mouse ya funciona el hover
    clearTimeout(temporizador);
    elemento.classList.remove('tocada');
    void elemento.offsetWidth;                    // reinicia la animación del rebote
    elemento.classList.add('tocada');
    temporizador = setTimeout(() => elemento.classList.remove('tocada'), 1200);
  });
});
