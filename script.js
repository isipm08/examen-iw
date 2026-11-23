
/* =========================================================
   PARTE 1 · Rayos de colores de la página de inicio
   Se dibujan en un <canvas> (en vez de 40 líneas SVG con degradados
   animados, que obligaban al navegador a repintar todo en cada cuadro).
   Cada rayo cambia de color con el tiempo, se "dibuja" al entrar y se
   corre suavemente hacia afuera cuando el cursor se acerca.
   ========================================================= */
 
const lienzo = document.querySelector('#rayos');
const ctx = lienzo.getContext('2d');
 
const colores = [
  '#F6C94D', '#FCB900', '#DBE586', '#D0E426', '#A7C7E4',
  '#88C2F6', '#A88AED', '#826DEE', '#F19DF1', '#EE77BB'
];
 
// Mismas coordenadas que el dibujo original (1728 x 1117)
const ANCHO_BASE = 1728;
const ALTO_BASE = 1117;
const centroX = 875;
const centroY = 570;
const cantidadDeRayos = 40;
const rayos = [];
 
function aRGB(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const coloresRGB = colores.map(aRGB);
 
// "Aleatorio" que siempre da lo mismo, así los rayos no cambian al recargar
let semilla = 11;
function aleatorio() {
  semilla = (semilla * 16807) % 2147483647;
  return semilla / 2147483647;
}
 
function colorAlAzar() {
  return coloresRGB[Math.floor(aleatorio() * coloresRGB.length)];
}
 
// Lista de colores que se repite: color1 → color2 → color3 → color1
function cicloDeColores() {
  const a = colorAlAzar();
  return [a, colorAlAzar(), colorAlAzar(), a];
}
 
function crearRayo(numero) {
  const angulo = (numero / cantidadDeRayos) * Math.PI * 2 + (aleatorio() - 0.5) * 0.12;
  const inicio = 15 + aleatorio() * 230;
  const largo = aleatorio() > 0.25 ? 2100 : 420 + aleatorio() * 900;
  const grosor = 40 + aleatorio() * 32;
 
  const ciclo1 = cicloDeColores();
  const ciclo2 = cicloDeColores();
  const duracion = 7 + aleatorio() * 8;
  const desfase1 = aleatorio() * 8;
  const desfase2 = aleatorio() * 8;
  const conBlanco = aleatorio() > 0.85;
 
  rayos.push({
    angulo, grosor, conBlanco, ciclo1, ciclo2, duracion, desfase1, desfase2,
    x1: centroX + Math.cos(angulo) * inicio,
    y1: centroY + Math.sin(angulo) * inicio,
    x2: centroX + Math.cos(angulo) * (inicio + largo),
    y2: centroY + Math.sin(angulo) * (inicio + largo),
    retraso: numero * 0.035,   // segundos antes de empezar a dibujarse
    empuje: 0,                 // cuánto está corrido ahora
    empujeMeta: 0,             // cuánto debería estar corrido
    extra: 0,                  // grosor extra ahora
    extraMeta: 0
  });
}
 
for (let i = 0; i < cantidadDeRayos; i++) crearRayo(i);
 
// Color de un extremo del rayo en el instante "t" (mezcla entre los colores del ciclo)
function colorEn(ciclo, duracion, desfase, t) {
  const pos = (((((t + desfase) / duracion) % 1) + 1) % 1) * (ciclo.length - 1);
  const i = Math.floor(pos);
  const f = pos - i;
  const a = ciclo[i];
  const b = ciclo[i + 1] || ciclo[0];
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
}
 
// --- Tamaño del lienzo (se comporta como preserveAspectRatio="slice") ---
let escala = 1, desvioX = 0, desvioY = 0, ratio = 1;
 
function ajustarTamano() {
  const w = lienzo.clientWidth;
  const h = lienzo.clientHeight;
  if (!w || !h) return false;                        // la página de inicio no se está viendo
  ratio = Math.min(window.devicePixelRatio || 1, 2); // más de 2x no se nota y pesa mucho
  const pw = Math.round(w * ratio);
  const ph = Math.round(h * ratio);
  if (lienzo.width !== pw || lienzo.height !== ph) {
    lienzo.width = pw;
    lienzo.height = ph;
  }
  escala = Math.max(w / ANCHO_BASE, h / ALTO_BASE);
  desvioX = (w - ANCHO_BASE * escala) / 2;
  desvioY = (h - ALTO_BASE * escala) / 2;
  return true;
}
 
// --- Puntero: guardamos dónde está y en cada cuadro calculamos los empujes ---
let punteroX = null;
let punteroY = null;
 
function seguirPuntero(evento) {
  const caja = lienzo.getBoundingClientRect();
  punteroX = (evento.clientX - caja.left - desvioX) / escala;
  punteroY = (evento.clientY - caja.top - desvioY) / escala;
}
 
function soltarRayos() {
  punteroX = null;
  punteroY = null;
}
 
function calcularMetas() {
  rayos.forEach((rayo) => {
    if (punteroX === null) {
      rayo.empujeMeta = 0;
      rayo.extraMeta = 0;
      return;
    }
    const largoX = rayo.x2 - rayo.x1;
    const largoY = rayo.y2 - rayo.y1;
 
    // punto del rayo más cercano al cursor
    let t = ((punteroX - rayo.x1) * largoX + (punteroY - rayo.y1) * largoY) / (largoX * largoX + largoY * largoY);
    t = Math.max(0, Math.min(1, t));
 
    const distancia = Math.hypot(punteroX - (rayo.x1 + largoX * t), punteroY - (rayo.y1 + largoY * t));
    // 1 = el cursor está encima del rayo, 0 = está lejos
    const cercania = Math.max(0, 1 - distancia / 420);
    rayo.empujeMeta = cercania * 110;
    rayo.extraMeta = cercania * 18;
  });
}
 
document.addEventListener('pointermove', seguirPuntero, { passive: true });
document.addEventListener('pointerdown', seguirPuntero, { passive: true });
document.documentElement.addEventListener('mouseleave', soltarRayos);
document.addEventListener('pointercancel', soltarRayos);
document.addEventListener('pointerup', (evento) => {
  // con mouse los rayos se quedan donde está el cursor; con el dedo vuelven al soltar
  if (evento.pointerType !== 'mouse') soltarRayos();
});
 
// --- Dibujo, un cuadro por vez ---
const DURACION_ENTRADA = 1.3;   // segundos que tarda cada rayo en dibujarse
let tInicio = null;
let tAnterior = null;
 
function suavizarEntrada(p) {   // empieza rápido y frena al final
  return 1 - Math.pow(1 - p, 4);
}
 
function dibujar(ahora) {
  requestAnimationFrame(dibujar);
 
  if (!ajustarTamano()) { tInicio = null; tAnterior = null; return; }
 
  if (tInicio === null) { tInicio = ahora; tAnterior = ahora; }
  const t = (ahora - tInicio) / 1000;
  const dt = Math.min((ahora - tAnterior) / 1000, 0.05);
  tAnterior = ahora;
 
  // los rayos se acercan al valor deseado de a poco (esto es lo que da la suavidad)
  calcularMetas();
  const suavidad = 1 - Math.exp(-dt * 9);
 
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, lienzo.width, lienzo.height);
  ctx.setTransform(ratio * escala, 0, 0, ratio * escala, ratio * desvioX, ratio * desvioY);
  ctx.lineCap = 'round';
 
  rayos.forEach((rayo) => {
    rayo.empuje += (rayo.empujeMeta - rayo.empuje) * suavidad;
    rayo.extra += (rayo.extraMeta - rayo.extra) * suavidad;
 
    const p = Math.min(1, Math.max(0, (t - rayo.retraso) / DURACION_ENTRADA));
    if (p === 0) return;
    const avance = suavizarEntrada(p);
 
    const dx = Math.cos(rayo.angulo) * rayo.empuje;
    const dy = Math.sin(rayo.angulo) * rayo.empuje;
    const x1 = rayo.x1 + dx;
    const y1 = rayo.y1 + dy;
    const x2 = x1 + (rayo.x2 - rayo.x1) * avance;
    const y2 = y1 + (rayo.y2 - rayo.y1) * avance;
 
    // el degradado siempre cubre el rayo completo, aunque todavía se esté dibujando
    const degradado = ctx.createLinearGradient(x1, y1, rayo.x2 + dx, rayo.y2 + dy);
    degradado.addColorStop(0, colorEn(rayo.ciclo1, rayo.duracion, rayo.desfase1, t));
    if (rayo.conBlanco) degradado.addColorStop(0.5, '#FFFFFF');
    degradado.addColorStop(1, colorEn(rayo.ciclo2, rayo.duracion + 3, rayo.desfase2, t));
 
    ctx.strokeStyle = degradado;
    ctx.lineWidth = rayo.grosor + rayo.extra;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
}
 
requestAnimationFrame(dibujar);
 
 
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
