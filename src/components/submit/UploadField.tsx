import React, { useRef, useState } from 'react';
import { AlertCircleIcon, ImagePlusIcon, RotateCwIcon, XIcon } from 'lucide-react';

export interface Upload {
  id: string;
  name: string;
  size: number;
  url: string;
  progress: number;
  error?: string;
}

const MAX = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function UploadField({ files, onChange }: {files: Upload[];onChange: React.Dispatch<React.SetStateAction<Upload[]>>;}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const simulate = (id: string) => {
    let p = 0;
    const t = setInterval(() => {
      p += 20 + Math.random() * 25;
      onChange((fs) => fs.map((f) => f.id === id ? { ...f, progress: Math.min(100, p) } : f));
      if (p >= 100) clearInterval(t);
    }, 180);
  };

  const add = (list: FileList | null) => {
    if (!list) return;
    const next: Upload[] = [];
    Array.from(list).forEach((file) => {
      if (files.length + next.length >= 3) return;
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      const error = !TYPES.includes(file.type) ?
      'Unsupported format. Use JPG, PNG or WEBP.' :
      file.size > MAX ?
      'File is larger than 5 MB. Try a smaller photo.' :
      undefined;
      next.push({ id, name: file.name, size: file.size, url: error ? '' : URL.createObjectURL(file), progress: error ? 0 : 0, error });
      if (!error) setTimeout(() => simulate(id), 50);
    });
    onChange((fs) => [...fs, ...next]);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {e.preventDefault();setDrag(true);}}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {e.preventDefault();setDrag(false);add(e.dataTransfer.files);}}
        className={`flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors duration-150 ${drag ? 'border-brand bg-brand-50' : 'border-line bg-canvas/50'}`}>
        
        <ImagePlusIcon className="h-8 w-8 text-brand" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-ink">
          Drag photos here or{' '}
          <button type="button" onClick={() => input.current?.click()} className="text-brand underline-offset-2 hover:underline">browse your device</button>
        </p>
        <p className="mt-1 text-xs text-muted">JPG, PNG or WEBP · up to 5 MB each · maximum 3 photos</p>
        <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => {add(e.target.files);e.target.value = '';}} aria-label="Upload supporting photos" />
      </div>
      {files.length > 0 &&
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {files.map((f) =>
        <li key={f.id} className={`relative overflow-hidden rounded-xl border ${f.error ? 'border-danger/40 bg-danger-50' : 'border-line bg-white'}`}>
              {f.error ?
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 p-3 text-center">
                  <AlertCircleIcon className="h-5 w-5 text-danger" aria-hidden="true" />
                  <p className="text-xs font-semibold text-danger" role="alert">{f.error}</p>
                  <button type="button" onClick={() => input.current?.click()} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-ink"><RotateCwIcon className="h-3 w-3" /> Choose another</button>
                </div> :

          <img src={f.url} alt={`Preview of ${f.name}`} className="aspect-[4/3] w-full object-cover" />
          }
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="truncate text-xs font-medium text-ink">{f.name}</span>
                <span className="shrink-0 text-[11px] text-muted">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              {!f.error && f.progress < 100 &&
          <div className="absolute inset-x-0 bottom-0 h-1 bg-line" role="progressbar" aria-valuenow={Math.round(f.progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${f.name}`}>
                  <div className="h-full bg-brand transition-[width] duration-150" style={{ width: `${f.progress}%` }} />
                </div>
          }
              <button type="button" onClick={() => onChange((fs) => fs.filter((x) => x.id !== f.id))} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white hover:bg-ink" aria-label={`Remove ${f.name}`}>
                <XIcon className="h-4 w-4" />
              </button>
            </li>
        )}
        </ul>
      }
    </div>);

}