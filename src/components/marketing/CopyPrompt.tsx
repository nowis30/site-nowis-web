'use client';
import { useState } from 'react';

export function CopyPrompt({title, text}: {title:string; text:string}) {
  const [status, setStatus] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus('Texte copié. Remplacez les passages entre crochets par votre histoire.'); }
    catch { setStatus('La copie automatique est indisponible. Sélectionnez le texte ci-dessous pour le copier.'); }
  }
  return <div className="ng-prompt"><div className="ng-prompt-head"><h3>{title}</h3><button type="button" className="cta-secondary" onClick={copy}>Copier le modèle</button></div><pre>{text}</pre><p className="nm-fine" role="status">{status}</p></div>;
}
