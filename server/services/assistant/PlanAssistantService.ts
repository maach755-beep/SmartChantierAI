import { planRepo } from '../../repositories/PlanExtractionRepository.js';
import type { AssistantPlanContext } from '../../../shared/plan-extraction/types.js';

export class PlanAssistantService {
  getContext(projectId: string, extractionId?: string): AssistantPlanContext | null {
    const project = planRepo.getProject(projectId);
    if (!project) return null;

    const jobs = planRepo.listJobs(projectId);
    const jobId = extractionId ?? jobs[jobs.length - 1]?.id;
    return {
      projectId,
      extractionId: jobId,
      rooms: planRepo.getRooms(projectId, jobId),
      materials: planRepo.getMaterials(projectId),
      devis: planRepo.listDevis(projectId).at(-1),
    };
  }

  answer(question: string, ctx: AssistantPlanContext, lang: 'fr' | 'ar' | 'en'): string {
    const q = question.toLowerCase();

    const roomMatch = q.match(/(?:room|pièce|piece|غرفة)\s*(\d+|[\w\s]+)/i);
    if (roomMatch) {
      const room = ctx.rooms.find((r) =>
        r.name.toLowerCase().includes(roomMatch[1].toLowerCase().trim())
      );
      if (room) {
        const mat = ctx.materials.find((m) => m.id === room.floorMaterialId);
        const labels = { fr: 'Matériau', ar: 'المادة', en: 'Material' };
        return `${labels[lang]} — ${room.name}: ${mat?.brand ?? '—'} ${mat?.model ?? ''} (${room.surfaceSqm} m²)`;
      }
    }

    if (q.includes('s1') || q.includes('m²') || q.includes('m2') || q.includes('remain')) {
      const s1 = ctx.materials.filter((m) => m.legendCode === 'S1' || m.reference.includes('S1'));
      const total = ctx.rooms.reduce((s, r) => s + r.surfaceSqm, 0);
      const installed = ctx.rooms.filter((r) => r.floorMaterialId).reduce((s, r) => s + r.surfaceSqm, 0);
      const remain = Math.max(0, total - installed);
      return lang === 'ar'
        ? `مساحة S1 المتبقية تقريباً: ${remain.toFixed(2)} m²`
        : lang === 'en'
          ? `Estimated remaining S1 surface: ${remain.toFixed(2)} m²`
          : `Surface S1 restante estimée: ${remain.toFixed(2)} m² (${s1.length} refs S1)`;
    }

    if (q.includes('purchase') || q.includes('commande') || q.includes('achat')) {
      const list = ctx.devis?.lines ?? [];
      if (!list.length) {
        return lang === 'en' ? 'Generate a devis first from extracted plan data.' : 'Générez d\'abord un devis depuis les données extraites.';
      }
      return list.map((l) => `• ${l.material} — ${l.quantity} ${l.unit}`).join('\n');
    }

    if (q.includes('delay') || q.includes('retard') || q.includes('تأخير')) {
      const project = planRepo.getProject(ctx.projectId);
      return lang === 'en'
        ? `Project delay indicator: ${project?.delayPercent ?? 0}%`
        : `Retard projet: ${project?.delayPercent ?? 0}%`;
    }

    if (q.includes('budget') || q.includes('marge') || q.includes('ميزانية')) {
      const d = ctx.devis;
      if (!d) return lang === 'en' ? 'No devis on file.' : 'Aucun devis enregistré.';
      return lang === 'en'
        ? `Budget impact — Subtotal: ${d.subtotalHt}, Margin: ${d.marginAmount}, VAT: ${d.vatAmount}, Total: ${d.totalTtc} ${d.currency}`
        : `Impact budget — HT: ${d.subtotalHt}, Marge: ${d.marginAmount}, TVA: ${d.vatAmount}, TTC: ${d.totalTtc} ${d.currency}`;
    }

    return lang === 'en'
      ? `BTP assistant (${ctx.rooms.length} rooms, ${ctx.materials.length} materials). Ask about a room, S1 m², purchase order, delays, or budget.`
      : lang === 'ar'
        ? `مساعد BTP (${ctx.rooms.length} غرف، ${ctx.materials.length} مواد).`
        : `Assistant BTP (${ctx.rooms.length} pièces, ${ctx.materials.length} matériaux).`;
  }
}

export const planAssistant = new PlanAssistantService();
