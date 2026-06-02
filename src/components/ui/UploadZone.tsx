import { Upload } from 'lucide-react';
import { useCallback, useState } from 'react';

interface UploadZoneProps {
  hint: string;
  accept?: string;
  onFile?: (file: File) => void;
}

export function UploadZone({ hint, accept = '.pdf,.jpg,.jpeg,.png', onFile }: UploadZoneProps) {
  const [drag, setDrag] = useState(false);

  const handle = useCallback(
    (files: FileList | null) => {
      if (files?.[0]) onFile?.(files[0]);
    },
    [onFile]
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        drag ? 'border-cyan-400 bg-cyan-500/10' : 'border-btp-500/40 hover:border-btp-400 bg-btp-900/30'
      }`}
    >
      <Upload className="w-10 h-10 text-btp-400" />
      <p className="text-slate-400 text-sm text-center">{hint}</p>
      <input type="file" accept={accept} className="hidden" onChange={(e) => handle(e.target.files)} />
    </label>
  );
}
