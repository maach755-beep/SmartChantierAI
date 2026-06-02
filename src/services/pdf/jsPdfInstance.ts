import jspdfImport from 'jspdf';

type JsPdfClass = typeof import('jspdf').jsPDF;

/** Compatible navigateur (Vite) et Node (tsx / CI). */
function resolveJsPDF(): JsPdfClass {
  const mod = jspdfImport as JsPdfClass | { jsPDF: JsPdfClass; default: JsPdfClass };
  if (typeof mod === 'function') return mod as JsPdfClass;
  if (typeof (mod as { jsPDF?: JsPdfClass }).jsPDF === 'function') {
    return (mod as { jsPDF: JsPdfClass }).jsPDF;
  }
  if (typeof (mod as { default?: JsPdfClass }).default === 'function') {
    return (mod as { default: JsPdfClass }).default;
  }
  throw new Error('Constructeur jsPDF introuvable.');
}

export const jsPDF = resolveJsPDF();
