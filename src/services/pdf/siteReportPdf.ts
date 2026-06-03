import {
  generateAndSaveDocumentPdf,
  generateDocumentPdfBytes,
  generatePdfDocumentNumber,
} from './devisPdfGenerator';

export async function generateSiteReportPdf(params: {
  chantierName: string;
  clientName?: string;
  sections: { heading: string; lines: string[] }[];
  conditions?: string[];
}): Promise<void> {
  await generateAndSaveDocumentPdf({
    kind: 'report',
    documentNumber: generatePdfDocumentNumber('report').replace('RPT', 'RCH'),
    subtitle: `Rapport chantier — ${params.chantierName}`,
    client: {
      clientName: params.clientName ?? params.chantierName,
      siteAddress: params.chantierName,
    },
    sections: params.sections,
    conditions: params.conditions ?? ['Document généré par SmartChantier AI'],
    showTotals: false,
  });
}

export async function generateSiteReportPdfBytes(
  params: Parameters<typeof generateSiteReportPdf>[0]
): Promise<Uint8Array> {
  return generateDocumentPdfBytes({
    kind: 'report',
    documentNumber: generatePdfDocumentNumber('report').replace('RPT', 'RCH'),
    subtitle: `Rapport chantier — ${params.chantierName}`,
    client: {
      clientName: params.clientName ?? params.chantierName,
      siteAddress: params.chantierName,
    },
    sections: params.sections,
    conditions: params.conditions,
    showTotals: false,
  });
}
