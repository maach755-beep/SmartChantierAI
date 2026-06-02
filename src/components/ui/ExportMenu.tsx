import { FileDown, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

type ExportMenuProps = {
  onPdf?: () => void;
  onExcel?: () => void;
  onCsv?: () => void;
  disabled?: boolean;
};

/** Demo exports work; shows integration-ready hint in UI. */
export function ExportMenu({ onPdf, onExcel, onCsv, disabled }: ExportMenuProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onPdf && (
        <Button variant="secondary" size="sm" disabled={disabled} onClick={onPdf}>
          <FileDown className="w-4 h-4" />
          PDF
        </Button>
      )}
      {onExcel && (
        <Button variant="secondary" size="sm" disabled={disabled} onClick={onExcel}>
          <FileSpreadsheet className="w-4 h-4" />
          Excel
        </Button>
      )}
      {onCsv && (
        <Button variant="secondary" size="sm" disabled={disabled} onClick={onCsv}>
          <FileSpreadsheet className="w-4 h-4" />
          CSV
        </Button>
      )}
      <span className="text-[10px] text-slate-600 w-full sm:w-auto">{t('common.exportReady')}</span>
    </div>
  );
}
