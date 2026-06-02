import { generateAndSaveTechnicalSheetPdf } from './technicalSheetPdfGenerator';
import {
  formatTechnicalSheetValidationError,
  validateTechnicalSheetInput,
} from './validateTechnicalSheet';
import { generateTechnicalSheet } from './engine';
import type { TechnicalSheetInput, TechnicalSheetPdfLabels } from '@/types/technicalSheet';

export async function exportTechnicalSheetFromInput(
  input: TechnicalSheetInput,
  labels: TechnicalSheetPdfLabels
): Promise<void> {
  const invalid = validateTechnicalSheetInput(input);
  if (invalid) {
    throw new Error(formatTechnicalSheetValidationError(invalid));
  }

  const sheet = await generateTechnicalSheet(input);
  await generateAndSaveTechnicalSheetPdf(sheet, labels);
}
