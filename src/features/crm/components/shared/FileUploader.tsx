'use client';

import { useRef, useState } from 'react';

interface FileUploaderProps {
  onSelect: (files: File[]) => void;
  accept?: string;
  label?: string;
}

export function FileUploader({ onSelect, accept, label = 'Importer un document' }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white"
        >
          {label}
        </button>
        {fileNames.length > 0 ? (
          <p className="text-xs text-slate-300">{fileNames.join(', ')}</p>
        ) : (
          <p className="text-xs text-slate-500">Aucun fichier sélectionné</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          setFileNames(files.map((file) => file.name));
          onSelect(files);
        }}
      />
    </div>
  );
}
