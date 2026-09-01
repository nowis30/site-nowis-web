'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, Compass, Lightbulb, Send, X } from 'lucide-react';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const quickLinks = [
  { label: 'Découvrir les ateliers', href: '/ateliers' },
  { label: 'Commander une chanson', href: '/commander-une-chanson' },
  { label: 'Voir les jeux', href: '/jeux' },
  { label: 'Voir les tarifs', href: '/tarifs' },
  { label: 'Contacter NOWIS', href: '/contact' },
];

const initialMessage: ChatMessage = {
  role: 'assistant',
  content:
    'Bonjour! Je suis l’assistant NOWIS. Je peux vous guider vers les services, les ateliers ou les jeux, ou transmettre une idée pour améliorer le site.',
};

export function SiteAssistant() {
  const [open, setOpen] = useState(false);
  const [ideaMode, setIdeaMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [idea, setIdea] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [ideaStatus, setIdeaStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, loading]);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) setOpen(false);
    }
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: 'user' as const, content }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/site-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, pathname: window.location.pathname }),
      });
      const data = (await response.json()) as { reply?: string };
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            data.reply ||
            'Je peux toujours vous guider avec les raccourcis ci-dessous. Pour une demande précise, la page Contact est aussi disponible.',
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            'Je n’arrive pas à joindre le service IA pour le moment. Les raccourcis de navigation restent disponibles.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitIdea(event: React.FormEvent) {
    event.preventDefault();
    if (idea.trim().length < 10 || ideaStatus === 'sending') return;

    setIdeaStatus('sending');
    try {
      const response = await fetch('/api/site-assistant/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: idea.trim(),
          email: visitorEmail.trim() || undefined,
          pathname: window.location.pathname,
          website: '',
        }),
      });

      if (!response.ok) throw new Error('feedback_failed');
      setIdeaStatus('sent');
      setIdea('');
      setVisitorEmail('');
    } catch {
      setIdeaStatus('error');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[150] inline-flex min-h-12 items-center gap-2 rounded-full border border-[rgba(124,78,46,0.18)] bg-[color:var(--site-heading)] px-4 py-3 text-sm font-semibold text-[#fffdf9] shadow-[0_18px_48px_rgba(72,43,24,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_54px_rgba(72,43,24,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-controls="nowis-site-assistant"
      >
        <Bot size={20} aria-hidden="true" />
        <span>Assistant NOWIS</span>
      </button>

      {open ? (
        <section
          id="nowis-site-assistant"
          aria-label="Assistant de navigation NOWIS"
          className="fixed inset-x-3 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.25rem)] z-[149] mx-auto flex max-h-[min(78dvh,700px)] w-auto max-w-[420px] flex-col overflow-hidden rounded-[1.75rem] border border-[rgba(124,78,46,0.2)] bg-[#fffdfa] shadow-[0_28px_80px_rgba(72,43,24,0.3)] sm:left-auto sm:right-[max(1rem,env(safe-area-inset-right))] sm:mx-0 sm:w-[400px]"
        >
          <header className="flex items-center justify-between border-b border-[rgba(124,78,46,0.1)] bg-[linear-gradient(135deg,#2b1e18,#4a2f22)] px-4 py-3 text-[#fffdf9]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.12)]" aria-hidden="true">
                <Bot size={22} />
              </span>
              <div>
                <p className="text-base font-bold leading-5 text-[#fffdf9]">Assistant NOWIS</p>
                <p className="text-sm font-medium text-[#f3e8df]">Navigation & idées</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid min-h-11 min-w-11 place-items-center rounded-xl text-[#fffdf9] transition hover:bg-[rgba(255,255,255,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fffdf9]"
              aria-label="Fermer l’assistant"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex border-b border-[rgba(124,78,46,0.1)] bg-[#f7eee4] p-2" role="tablist" aria-label="Fonctions de l’assistant">
            <button
              type="button"
              role="tab"
              aria-selected={!ideaMode}
              onClick={() => setIdeaMode(false)}
              className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-base font-semibold transition ${!ideaMode ? 'bg-white text-[color:var(--site-heading)] shadow-sm' : 'text-[color:var(--site-muted)] hover:bg-white/60'}`}
            >
              <Compass size={17} aria-hidden="true" /> Aide
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={ideaMode}
              onClick={() => {
                setIdeaMode(true);
                setIdeaStatus('idle');
              }}
              className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-base font-semibold transition ${ideaMode ? 'bg-white text-[color:var(--site-heading)] shadow-sm' : 'text-[color:var(--site-muted)] hover:bg-white/60'}`}
            >
              <Lightbulb size={17} aria-hidden="true" /> Mon idée
            </button>
          </div>

          {ideaMode ? (
            <form onSubmit={submitIdea} className="overflow-y-auto p-4">
              <div className="rounded-2xl border border-[rgba(194,119,73,0.16)] bg-[#fff8ef] p-4">
                <h2 className="text-base font-semibold text-[color:var(--site-heading)]">Proposer une amélioration</h2>
                <p className="mt-1 text-sm leading-5 text-[color:var(--site-muted)]">
                  Décrivez ce qui pourrait rendre le site plus clair, plus utile ou plus agréable. Votre idée sera envoyée à l’équipe NOWIS par courriel.
                </p>
              </div>

              <label className="mt-4 block text-sm font-semibold text-[color:var(--site-heading)]" htmlFor="nowis-idea">
                Votre idée
              </label>
              <textarea
                id="nowis-idea"
                value={idea}
                onChange={(event) => setIdea(event.target.value.slice(0, 2000))}
                minLength={10}
                maxLength={2000}
                required
                rows={5}
                placeholder="Ex. : J’aimerais trouver les ateliers plus rapidement depuis l’accueil…"
                className="mt-2 w-full resize-none rounded-2xl border border-[rgba(124,78,46,0.24)] bg-white px-4 py-3 text-base text-[color:var(--site-heading)] outline-none transition placeholder:text-[#76675b] focus:border-[color:var(--site-accent)] focus:ring-2 focus:ring-[color:var(--site-accent)]/20"
              />

              <label className="mt-3 block text-sm font-semibold text-[color:var(--site-heading)]" htmlFor="nowis-idea-email">
                Votre courriel <span className="font-normal text-[color:var(--site-muted)]">(facultatif)</span>
              </label>
              <input
                id="nowis-idea-email"
                type="email"
                value={visitorEmail}
                onChange={(event) => setVisitorEmail(event.target.value.slice(0, 160))}
                maxLength={160}
                autoComplete="email"
                placeholder="Pour pouvoir vous répondre"
                className="mt-2 min-h-12 w-full rounded-2xl border border-[rgba(124,78,46,0.24)] bg-white px-4 text-base text-[color:var(--site-heading)] outline-none transition placeholder:text-[#76675b] focus:border-[color:var(--site-accent)] focus:ring-2 focus:ring-[color:var(--site-accent)]/20"
              />

              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

              {ideaStatus === 'sent' ? (
                <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800" role="status">
                  Merci! Votre idée a bien été transmise à NOWIS.
                </p>
              ) : null}
              {ideaStatus === 'error' ? (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
                  L’envoi n’a pas fonctionné. Vous pouvez réessayer ou utiliser la page Contact.
                </p>
              ) : null}

              <button
                type="submit"
                disabled={idea.trim().length < 10 || ideaStatus === 'sending'}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--site-heading)] px-4 font-semibold text-[#fffdf9] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2"
              >
                <Send size={18} aria-hidden="true" />
                {ideaStatus === 'sending' ? 'Envoi…' : 'Envoyer mon idée'}
              </button>
              <p className="mt-2 text-center text-xs leading-4 text-[color:var(--site-muted)]">
                Seule l’idée que vous soumettez est envoyée par courriel; votre conversation d’aide n’est pas jointe automatiquement.
              </p>
            </form>
          ) : (
            <>
              <div ref={logRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-base leading-6 ${message.role === 'assistant' ? 'bg-[#f1e4d6] text-[color:var(--site-heading)]' : 'ml-auto bg-[color:var(--site-heading)] text-[#fffdf9]'}`}
                  >
                    {message.content}
                  </div>
                ))}
                {loading ? (
                  <div className="max-w-[88%] rounded-2xl bg-[#f1e4d6] px-4 py-3 text-sm text-[color:var(--site-muted)]" role="status">
                    Je cherche la meilleure réponse…
                  </div>
                ) : null}
              </div>

              <div className="border-t border-[rgba(124,78,46,0.1)] bg-[#fffaf5] p-3">
                <div className="mb-3 grid grid-cols-2 gap-2" aria-label="Raccourcis de navigation">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl border border-[rgba(124,78,46,0.2)] bg-white px-3 py-2 text-left text-sm font-semibold leading-4 text-[color:var(--site-heading)] transition last:col-span-2 hover:border-[rgba(194,119,73,0.4)] hover:bg-[#fff5e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)]/40"
                      onClick={() => setOpen(false)}
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="shrink-0" size={15} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
                <form onSubmit={sendMessage} className="flex items-end gap-2">
                  <label htmlFor="nowis-assistant-message" className="sr-only">
                    Votre question
                  </label>
                  <textarea
                    id="nowis-assistant-message"
                    value={input}
                    onChange={(event) => setInput(event.target.value.slice(0, 1000))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={1}
                    maxLength={1000}
                    placeholder="Où puis-je trouver…?"
                    className="min-h-12 max-h-28 flex-1 resize-none rounded-2xl border border-[rgba(124,78,46,0.24)] bg-white px-4 py-3 text-base text-[color:var(--site-heading)] outline-none placeholder:text-[#76675b] focus:border-[color:var(--site-accent)] focus:ring-2 focus:ring-[color:var(--site-accent)]/20"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="grid min-h-12 min-w-12 place-items-center rounded-2xl bg-[color:var(--site-heading)] text-[#fffdf9] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--site-accent)] focus-visible:ring-offset-2"
                    aria-label="Envoyer la question"
                  >
                    <Send size={19} />
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      ) : null}
    </>
  );
}
