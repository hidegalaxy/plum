// Widget de Plum para Scriptable (iPhone).
// 1. Instala Scriptable. 2. Crea un script nuevo, pega todo esto y llámalo Plum.
// 3. En la pantalla de inicio (o de bloqueo) añade un widget de Scriptable y elige el script Plum.
// Tamaños: pequeño, mediano, grande y los tres de la pantalla de bloqueo. Al tocarlo se abre Plum.
const URL = '__URL__';
const C = { fondo: '#0c0c0d', caja: '#161618', pista: '#2a2a2f', acento: '#c3a2ff', texto: '#f4f4f2', gris: '#9a9aa1', tenue: '#67676e', examen: '#ff6b5e', aviso: '#ffc247' };
const TIPO = { estudio: '#c3a2ff', examen: '#ff6b5e', entrega: '#ffc247', clase: '#5aa2ff', entreno: '#ff9f43', cau: '#3fd69b', viaje: '#4dd0e1', cita: '#ff8fc7', plan: '#a3e635', evento: '#9a9aa1', trabajo: '#6c6c73' };
const col = c => new Color(c);
const fam = config.widgetFamily || 'medium';
const bloqueo = /^accessory/.test(fam);

// Datos: de Plum o, sin conexión, lo último que se guardó.
const fm = FileManager.local();
const cache = fm.joinPath(fm.documentsDirectory(), 'plum-widget.json');
let d = null, guardado = false, error = '';
try {
  d = await new Request(URL).loadJSON();
  if (d && d.error) { error = d.error; d = null; } else fm.writeString(cache, JSON.stringify(d));
} catch (e) {
  if (fm.fileExists(cache)) { try { d = JSON.parse(fm.readString(cache)); guardado = true; } catch (e2) {} }
}

const w = new ListWidget();
if (!bloqueo) {
  w.backgroundColor = col(C.fondo);
  w.setPadding(14, 15, 14, 15);
}
w.refreshAfterDate = new Date(Date.now() + 15 * 60000);
if (d && d.app) w.url = d.app;

function texto(pila, t, color, fuente, lineas) {
  const x = pila.addText(String(t));
  x.textColor = col(color);
  x.font = fuente;
  x.lineLimit = lineas || 1;
  return x;
}
const negrita = n => Font.boldSystemFont(n);
const normal = n => Font.systemFont(n);
const media = n => Font.semiboldSystemFont(n);

// Barra de progreso de horas de estudio.
function barra(pila, hechos, total, ancho) {
  const fondo = pila.addStack();
  fondo.size = new Size(ancho, 6);
  fondo.cornerRadius = 3;
  fondo.backgroundColor = col(C.pista);
  const lleno = fondo.addStack();
  lleno.size = new Size(Math.max(4, Math.round(ancho * Math.min(1, total ? hechos / total : 0))), 6);
  lleno.cornerRadius = 3;
  lleno.backgroundColor = col(C.acento);
  fondo.addSpacer();
}
const horas = min => String(Math.round(min / 6) / 10).replace('.', ',') + ' h';
const cuando = e => e.ahora ? 'AHORA · HASTA ' + e.horaFin : (e.manana ? 'MAÑANA · ' : 'A LAS ') + e.hora;

if (!d) {
  if (bloqueo) {
    texto(w, error ? 'Plum: ' + error : 'Plum: sin conexión', '#ffffff', media(13));
  } else {
    texto(w, 'Plum', C.acento, negrita(16));
    texto(w, error || 'Sin conexión', C.gris, normal(13), 2);
  }
} else if (fam === 'accessoryInline') {
  const e = d.eventos[0];
  texto(w, e ? (e.ahora ? 'Ahora: ' : e.hora + ' ') + e.titulo : d.examen ? d.examen.faltan + ' d · ' + d.examen.titulo : 'Nada más hoy', '#ffffff', media(13));
} else if (fam === 'accessoryCircular') {
  w.addAccessoryWidgetBackground = true;
  const ex = d.examen;
  texto(w, ex ? ex.faltan : '–', '#ffffff', negrita(22)).centerAlignText();
  texto(w, ex ? (ex.asig || 'días') : 'Plum', '#ffffff', media(10)).centerAlignText();
} else if (fam === 'accessoryRectangular') {
  const e = d.eventos[0];
  texto(w, e ? cuando(e) : 'HOY', '#ffffff', negrita(11));
  texto(w, e ? e.titulo : 'Nada más hoy', '#ffffff', media(14), 2);
  if (d.examen) texto(w, d.examen.faltan + ' días · ' + d.examen.titulo, '#ffffff', normal(11));
} else {
  // Cabecera: día y avisos.
  const cab = w.addStack();
  cab.centerAlignContent();
  texto(cab, d.diaSemana.toUpperCase() + ' ' + d.diaMes, C.acento, negrita(12));
  cab.addSpacer();
  if (guardado) texto(cab, 'Sin conexión · datos guardados', C.tenue, normal(10));
  else if (fam !== 'small') {
    const extra = [];
    if (d.habitos) extra.push(d.habitos + (d.habitos === 1 ? ' hábito' : ' hábitos'));
    if (d.tarjetas) extra.push(d.tarjetas + ' tarjetas');
    if (extra.length) texto(cab, extra.join(' · '), C.gris, media(11));
  }
  w.addSpacer(fam === 'small' ? 6 : 8);

  // Lo que toca ahora o lo siguiente, con su primer paso.
  const e = d.eventos[0];
  if (e) {
    texto(w, cuando(e), TIPO[e.tipo] || C.acento, negrita(11));
    w.addSpacer(2);
    texto(w, e.titulo, C.texto, negrita(fam === 'small' ? 15 : 18), 2);
    if (e.paso && fam !== 'small') { w.addSpacer(2); texto(w, e.paso, C.gris, normal(12), fam === 'large' ? 3 : 2); }
  } else {
    texto(w, 'Nada más hoy', C.gris, media(15));
  }

  // En el grande, lo que viene después.
  if (fam === 'large' && d.eventos.length > 1) {
    w.addSpacer(12);
    texto(w, 'DESPUÉS', C.tenue, negrita(10));
    w.addSpacer(4);
    d.eventos.slice(1, 6).forEach(x => {
      const f = w.addStack();
      f.centerAlignContent();
      const punto = f.addStack();
      punto.size = new Size(6, 6);
      punto.cornerRadius = 3;
      punto.backgroundColor = col(TIPO[x.tipo] || C.acento);
      f.addSpacer(8);
      texto(f, (x.manana ? 'mañ ' : '') + x.hora, C.gris, media(12));
      f.addSpacer(8);
      texto(f, x.titulo, C.texto, media(13));
      w.addSpacer(5);
    });
  }

  w.addSpacer();

  // Abajo: el examen que más importa, con sus horas.
  const ex = d.examen;
  if (ex) {
    const f = w.addStack();
    f.centerAlignContent();
    texto(f, ex.faltan + (ex.faltan === 1 ? ' día' : ' días'), C.examen, negrita(13));
    f.addSpacer(6);
    texto(f, ex.titulo, C.gris, normal(12));
    if (ex.total && fam !== 'small') {
      w.addSpacer(5);
      const b = w.addStack();
      b.centerAlignContent();
      barra(b, ex.hechos, ex.total, fam === 'large' ? 210 : 150);
      b.addSpacer(8);
      texto(b, horas(ex.hechos) + ' de ' + horas(ex.total), C.gris, media(11));
    }
    if (ex.atraso >= 60 && fam !== 'small') {
      w.addSpacer(3);
      texto(w, 'Vas ' + horas(ex.atraso) + ' por detrás', C.aviso, media(11));
    }
  }
}

Script.setWidget(w);
if (config.runsInApp) {
  if (fam === 'small') await w.presentSmall();
  else if (fam === 'large') await w.presentLarge();
  else await w.presentMedium();
}
Script.complete();
