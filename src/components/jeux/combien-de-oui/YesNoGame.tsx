'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { ArrowLeft, Check, Copy, Crown, LogOut, MessageSquarePlus, RefreshCw, Share2, SkipForward, Trophy, UserMinus, Users, X } from 'lucide-react';
import type { RoomView } from '@/lib/yes-no-game/engine';
import { questionPacks, type QuestionPackId } from '@/lib/yes-no-game/questions';

const API = '/api/jeux/combien-de-oui';
const SESSION_KEY = 'nowis-combien-de-oui:session';
const NAME_KEY = 'nowis-combien-de-oui:name';
const POLL_MS = 1200;
const ROUND_CHOICES = [5, 10, 15, 20];

type Session = { code: string; playerId: string; token: string };

function readStorage(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch { /* stockage indisponible : la partie continue en mémoire */ }
}
function loadSession(): Session | null {
  const raw = readStorage(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    return parsed && /^[A-Z]{4}$/.test(parsed.code) && parsed.token ? parsed : null;
  } catch { return null; }
}

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function callApi<T>(url: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (init.token) headers.set('x-player-token', init.token);
  const response = await fetch(url, { ...init, headers, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, (data as { error?: string }).error || 'Oups, une erreur est survenue.');
  return data as T;
}

function shareUrl(code: string) {
  return `${window.location.origin}/jeux/combien-de-oui?code=${code}`;
}

function setUrlCode(code: string | null) {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set('code', code);
  else url.searchParams.delete('code');
  window.history.replaceState(null, '', url.toString());
}

// ---------- Petits éléments visuels ----------

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[1.7rem] border border-white/10 bg-slate-950/75 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

function PrimaryButton({ children, onClick, disabled, type = 'button', tone = 'cyan' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; tone?: 'cyan' | 'violet' | 'amber' }) {
  const tones = {
    cyan: 'bg-cyan-300 text-cyan-950 hover:bg-cyan-200',
    violet: 'bg-violet-300 text-violet-950 hover:bg-violet-200',
    amber: 'bg-amber-300 text-amber-950 hover:bg-amber-200',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-base font-black shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}>
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-4 text-sm font-bold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 active:scale-[0.98] disabled:opacity-40">
      {children}
    </button>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-14 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-lg font-bold text-white placeholder:text-slate-500 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/30 ${props.className ?? ''}`}
    />
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">{children}</div>;
}

function Avatar({ name, highlight = false }: { name: string; highlight?: boolean }) {
  const hue = ([...name].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7) * 137) % 360;
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-slate-950 ${highlight ? 'ring-2 ring-white' : ''}`}
      style={{ background: `hsl(${hue} 85% 72%)` }}
      aria-hidden="true"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

// ---------- Écran d'accueil ----------

function HomeScreen({ initialCode, busy, onCreate, onJoin }: {
  initialCode: string;
  busy: boolean;
  onCreate: (name: string) => void;
  onJoin: (code: string, name: string) => void;
}) {
  const [name, setName] = useState(() => readStorage(NAME_KEY) ?? '');
  const [code, setCode] = useState(initialCode);
  const [mode, setMode] = useState<'join' | 'create'>(initialCode ? 'join' : 'create');

  const cleanCode = code.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  const canSubmit = name.trim().length > 0 && (mode === 'create' || cleanCode.length === 4);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-fuchsia-100">
          <Users size={14} /> Jeu de groupe · 2 à 16 cellulaires
        </div>
        <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-6xl">
          Combien
          <span className="block bg-[linear-gradient(90deg,#67e8f9,#a78bfa,#f0abfc)] bg-clip-text text-transparent">de Oui?</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
          Une question. Tout le monde répond en secret par oui ou non. Devine combien ont dit <strong className="text-emerald-300">OUI</strong>!
        </p>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.04] p-1" role="tablist">
          {(['create', 'join'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={`min-h-11 rounded-xl text-sm font-black transition ${mode === value ? 'bg-white text-slate-950' : 'text-slate-300'}`}
            >
              {value === 'create' ? 'Créer une partie' : 'Rejoindre'}
            </button>
          ))}
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit || busy) return;
            writeStorage(NAME_KEY, name.trim());
            if (mode === 'create') onCreate(name.trim());
            else onJoin(cleanCode, name.trim());
          }}
        >
          {mode === 'join' ? (
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Code de la partie</span>
              <TextInput
                value={cleanCode}
                onChange={(event) => setCode(event.target.value)}
                placeholder="ABCD"
                autoCapitalize="characters"
                autoComplete="off"
                inputMode="text"
                maxLength={4}
                className="text-center text-3xl tracking-[0.5em]"
              />
            </label>
          ) : null}
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">Ton nom</span>
            <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. : Nowis" maxLength={20} autoComplete="nickname" />
          </label>
          <PrimaryButton type="submit" disabled={!canSubmit || busy} tone={mode === 'create' ? 'cyan' : 'violet'}>
            {busy ? 'Un instant…' : mode === 'create' ? 'Créer la partie' : 'Entrer dans la partie'}
          </PrimaryButton>
        </form>
      </Card>

      <Card>
        <Eyebrow>Comment jouer</Eyebrow>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
          <li className="flex gap-3"><span className="text-xl">📱</span><span>Un joueur crée la partie. Les autres scannent le code QR ou entrent le code à 4 lettres.</span></li>
          <li className="flex gap-3"><span className="text-xl">🤫</span><span>Chaque question, tu réponds <strong className="text-white">oui ou non en secret</strong>. Personne ne saura jamais qui a dit quoi.</span></li>
          <li className="flex gap-3"><span className="text-xl">🎯</span><span>Prédis combien de joueurs ont dit oui (toi inclus). <strong className="text-white">Pile = 3 points</strong>, à un près = 1 point.</span></li>
        </ol>
      </Card>
    </div>
  );
}

// ---------- Salle d'attente ----------

function JoinPanel({ code }: { code: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const link = useMemo(() => (typeof window === 'undefined' ? '' : shareUrl(code)), [code]);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(link, { margin: 1, width: 280, color: { dark: '#020617', light: '#ffffff' } })
      .then((url) => { if (active) setQr(url); })
      .catch(() => { if (active) setQr(null); });
    return () => { active = false; };
  }, [link]);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Combien de Oui?', text: `Viens jouer! Code : ${code}`, url: link });
        return;
      }
    } catch { return; }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* presse-papiers bloqué */ }
  };

  return (
    <Card className="text-center">
      <Eyebrow>Code de la partie</Eyebrow>
      <div className="mt-2 font-mono text-6xl font-black tracking-[0.25em] text-white sm:text-7xl">{code}</div>
      <div className="mx-auto mt-5 w-fit rounded-3xl bg-white p-3 shadow-[0_0_45px_rgba(103,232,249,0.25)]">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`Code QR pour rejoindre la partie ${code}`} width={200} height={200} className="h-[200px] w-[200px]" />
        ) : (
          <div className="h-[200px] w-[200px] animate-pulse rounded-2xl bg-slate-200" aria-hidden="true" />
        )}
      </div>
      <p className="mt-4 text-sm text-slate-300">Scanne avec l’appareil photo, ou va sur <strong className="text-white">nowis.store/jeux/combien-de-oui</strong>.</p>
      <div className="mt-4">
        <GhostButton onClick={share}>
          {copied ? <><Check size={18} /> Lien copié!</> : <><Share2 size={18} /> Partager le lien</>}
        </GhostButton>
      </div>
    </Card>
  );
}

function SuggestQuestion({ onSuggest, pending }: { onSuggest: (question: string) => Promise<boolean>; pending: number }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <Card>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
        <span className="flex items-center gap-3">
          <MessageSquarePlus size={22} className="text-fuchsia-200" />
          <span>
            <span className="block font-black text-white">Proposer une question anonyme</span>
            <span className="block text-xs text-slate-400">{pending > 0 ? `${pending} question${pending > 1 ? 's' : ''} des joueurs en attente` : 'Elle sortira au hasard, personne ne saura qu’elle vient de toi.'}</span>
          </span>
        </span>
        <span className="text-2xl text-slate-400">{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (question.trim().length < 5) return;
            if (await onSuggest(question)) {
              setQuestion('');
              setSent(true);
              window.setTimeout(() => setSent(false), 2500);
            }
          }}
        >
          <TextInput value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="As-tu déjà…?" maxLength={140} className="text-base" />
          <PrimaryButton type="submit" tone="violet" disabled={question.trim().length < 5}>
            {sent ? <><Check size={18} /> Ajoutée en secret!</> : 'Ajouter ma question'}
          </PrimaryButton>
        </form>
      ) : null}
    </Card>
  );
}

function LobbyScreen({ room, act, onSuggest }: { room: RoomView; act: (action: Record<string, unknown>) => Promise<boolean>; onSuggest: (q: string) => Promise<boolean> }) {
  const isHost = Boolean(room.you?.isHost);
  const pack = questionPacks.find((candidate) => candidate.id === room.pack);
  const enough = room.players.length >= 2;

  return (
    <div className="space-y-5">
      <JoinPanel code={room.code} />

      <Card>
        <div className="flex items-center justify-between">
          <Eyebrow>Joueurs ({room.players.length}/16)</Eyebrow>
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> En direct</span>
        </div>
        <ul className="mt-4 space-y-2">
          {room.players.map((player) => (
            <li key={player.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-2">
              <Avatar name={player.name} highlight={player.isYou} />
              <span className="flex-1 truncate font-bold text-white">{player.name}{player.isYou ? <span className="ml-2 text-xs font-semibold text-slate-400">(toi)</span> : null}</span>
              {player.isHost ? <Crown size={18} className="text-amber-300" aria-label="Hôte" /> : null}
              {isHost && !player.isYou ? (
                <button type="button" aria-label={`Retirer ${player.name}`} className="rounded-full p-2 text-slate-400 hover:bg-rose-400/15 hover:text-rose-200" onClick={() => { if (window.confirm(`Retirer ${player.name} de la partie?`)) void act({ type: 'kick', playerId: player.id }); }}>
                  <UserMinus size={18} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {room.players.length < 3 ? <p className="mt-3 text-xs text-slate-400">Conseil : c’est plus drôle (et plus anonyme) à 3 joueurs et plus.</p> : null}
      </Card>

      <Card>
        <Eyebrow>Paquet de questions</Eyebrow>
        {isHost ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {questionPacks.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  aria-pressed={room.pack === candidate.id}
                  onClick={() => void act({ type: 'settings', pack: candidate.id as QuestionPackId })}
                  className={`rounded-2xl border p-3 text-left transition ${room.pack === candidate.id ? 'border-cyan-300/70 bg-cyan-300/15' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}
                >
                  <div className="text-2xl">{candidate.emoji}</div>
                  <div className="mt-1 text-sm font-black text-white">{candidate.name}</div>
                  <div className="mt-0.5 text-[11px] leading-4 text-slate-400">{candidate.description}</div>
                </button>
              ))}
            </div>
            <div className="mt-5"><Eyebrow>Nombre de questions</Eyebrow></div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {ROUND_CHOICES.map((value) => (
                <button key={value} type="button" aria-pressed={room.totalRounds === value} onClick={() => void act({ type: 'settings', totalRounds: value })} className={`min-h-12 rounded-xl border text-lg font-black transition ${room.totalRounds === value ? 'border-cyan-300/70 bg-cyan-300/15 text-white' : 'border-white/10 text-slate-300'}`}>
                  {value}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-3 text-lg font-bold text-white">{pack?.emoji} {pack?.name} · {room.totalRounds} questions</p>
        )}
      </Card>

      <SuggestQuestion onSuggest={onSuggest} pending={room.pendingCustomQuestions} />

      {isHost ? (
        <div className="sticky bottom-4 z-10">
          <PrimaryButton disabled={!enough} onClick={() => void act({ type: 'start' })}>
            {enough ? `Lancer la partie (${room.players.length} joueurs)` : 'En attente d’un 2e joueur…'}
          </PrimaryButton>
        </div>
      ) : (
        <p className="py-2 text-center text-sm font-semibold text-slate-300">⏳ En attente que l’hôte lance la partie…</p>
      )}
    </div>
  );
}

// ---------- Question en cours ----------

function RoundHeader({ room }: { room: RoomView }) {
  const round = room.round!;
  return (
    <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-slate-400">
      <span>Question {round.number} / {room.totalRounds}</span>
      {round.custom ? <span className="rounded-full bg-fuchsia-400/15 px-3 py-1 text-fuchsia-200">Question d’un joueur</span> : null}
    </div>
  );
}

function QuestionScreen({ room, act }: { room: RoomView; act: (action: Record<string, unknown>) => Promise<boolean> }) {
  const round = room.round!;
  const isHost = Boolean(room.you?.isHost);
  const alreadySent = round.myAnswer !== null && round.myGuess !== null;
  const [answer, setAnswer] = useState<boolean | null>(round.myAnswer);
  const [guess, setGuess] = useState<number | null>(round.myGuess);
  const [wantsEdit, setWantsEdit] = useState(false);
  const [sending, setSending] = useState(false);
  const max = round.participantCount;
  // Ce composant est recréé à chaque nouvelle question (prop key). Si le serveur a annulé
  // notre prédiction (un joueur est parti), le formulaire réapparaît de lui-même.
  const editing = wantsEdit || !alreadySent;

  const impossible = (value: number) => (answer === true && value === 0) || (answer === false && value === max);
  const validGuess = guess !== null && !impossible(guess) && guess <= max;

  const send = async () => {
    if (answer === null || !validGuess) return;
    setSending(true);
    const ok = await act({ type: 'answer', answer, guess });
    setSending(false);
    if (ok) setWantsEdit(false);
  };

  return (
    <div className="space-y-5">
      <Card className="border-violet-300/20">
        <RoundHeader room={room} />
        <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">{round.question}</h2>
      </Card>

      {!round.isParticipant ? (
        <Card className="text-center"><p className="text-lg font-bold text-white">Tu embarques à la prochaine question! 🚀</p></Card>
      ) : editing ? (
        <>
          <Card>
            <Eyebrow>1. Ta réponse secrète</Eyebrow>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" aria-pressed={answer === true} onClick={() => { setAnswer(true); if (guess === 0) setGuess(null); }} className={`min-h-24 rounded-3xl border-2 text-3xl font-black transition active:scale-95 ${answer === true ? 'border-emerald-200 bg-emerald-400 text-emerald-950 shadow-[0_0_40px_rgba(52,211,153,0.35)]' : 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200'}`}>OUI</button>
              <button type="button" aria-pressed={answer === false} onClick={() => { setAnswer(false); if (guess === max) setGuess(null); }} className={`min-h-24 rounded-3xl border-2 text-3xl font-black transition active:scale-95 ${answer === false ? 'border-rose-200 bg-rose-400 text-rose-950 shadow-[0_0_40px_rgba(251,113,133,0.35)]' : 'border-rose-300/30 bg-rose-400/10 text-rose-200'}`}>NON</button>
            </div>
          </Card>

          {answer !== null ? (
            <Card>
              <Eyebrow>2. Combien de OUI au total? (toi inclus)</Eyebrow>
              <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6">
                {Array.from({ length: max + 1 }, (_, value) => (
                  <button key={value} type="button" disabled={impossible(value)} aria-pressed={guess === value} onClick={() => setGuess(value)} className={`aspect-square rounded-2xl border text-xl font-black transition active:scale-90 disabled:opacity-20 ${guess === value ? 'border-cyan-200 bg-cyan-300 text-cyan-950' : 'border-white/15 bg-white/[0.05] text-white'}`}>
                    {value}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">sur {max} joueur{max > 1 ? 's' : ''} · Pile = 3 pts · à 1 près = 1 pt</p>
              <div className="mt-4"><PrimaryButton disabled={!validGuess || sending} onClick={send}>{sending ? 'Envoi…' : 'Envoyer en secret'}</PrimaryButton></div>
            </Card>
          ) : null}
        </>
      ) : (
        <Card className="text-center">
          <div className="text-4xl">🤫</div>
          <p className="mt-2 text-lg font-black text-white">Réponse envoyée!</p>
          <p className="mt-1 text-sm text-slate-300">
            Toi : <strong className={round.myAnswer ? 'text-emerald-300' : 'text-rose-300'}>{round.myAnswer ? 'OUI' : 'NON'}</strong> · Ta prédiction : <strong className="text-cyan-200">{round.myGuess} oui</strong>
          </p>
          <div className="mx-auto mt-4 max-w-xs"><GhostButton onClick={() => setWantsEdit(true)}>Changer ma réponse</GhostButton></div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <Eyebrow>Réponses reçues</Eyebrow>
          <span className="text-lg font-black text-white">{round.submittedCount} / {round.participantCount}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-300 transition-all duration-500" style={{ width: `${round.participantCount ? (round.submittedCount / round.participantCount) * 100 : 0}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {room.players.filter((player) => player.isParticipant).map((player) => (
            <span key={player.id} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${player.hasSubmitted ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/[0.05] text-slate-400'}`}>
              {player.hasSubmitted ? <Check size={13} /> : <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />}
              {player.name}
            </span>
          ))}
        </div>
      </Card>

      {isHost ? (
        <div className="grid grid-cols-2 gap-2">
          <GhostButton disabled={round.submittedCount === 0} onClick={() => { if (window.confirm('Révéler maintenant? Ceux qui n’ont pas répondu ne comptent pas.')) void act({ type: 'reveal' }); }}>Révéler maintenant</GhostButton>
          <GhostButton onClick={() => void act({ type: 'skip' })}><SkipForward size={16} /> Autre question</GhostButton>
        </div>
      ) : null}
    </div>
  );
}

// ---------- Révélation ----------

// Le composant est recréé à chaque question (prop key) : le compteur repart de 0.
function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let current = 0;
    const step = Math.max(180, 900 / target);
    const timer = window.setInterval(() => {
      current += 1;
      setValue(current);
      if (current >= target) window.clearInterval(timer);
    }, step);
    return () => window.clearInterval(timer);
  }, [target]);
  return value;
}

function Leaderboard({ room, limit }: { room: RoomView; limit?: number }) {
  const players = limit ? room.players.slice(0, limit) : room.players;
  return (
    <ol className="space-y-2">
      {players.map((player, index) => (
        <li key={player.id} className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${player.isYou ? 'bg-cyan-300/10 ring-1 ring-cyan-300/30' : 'bg-white/[0.04]'}`}>
          <span className="w-6 text-center text-sm font-black text-slate-400">{index + 1}</span>
          <Avatar name={player.name} />
          <span className="flex-1 truncate font-bold text-white">{player.name}</span>
          <span className="text-lg font-black text-white">{player.score}<span className="ml-1 text-xs font-bold text-slate-400">pts</span></span>
        </li>
      ))}
    </ol>
  );
}

function RevealScreen({ room, act, onSuggest }: { room: RoomView; act: (action: Record<string, unknown>) => Promise<boolean>; onSuggest: (q: string) => Promise<boolean> }) {
  const round = room.round!;
  const result = round.result!;
  const isHost = Boolean(room.you?.isHost);
  const shown = useCountUp(result.yesCount);
  const done = shown >= result.yesCount;
  const last = round.number >= room.totalRounds;
  const mine = result.guesses.find((entry) => entry.playerId === room.you?.id);

  return (
    <div className="space-y-5">
      <Card className="text-center">
        <RoundHeader room={room} />
        <p className="mt-4 text-lg font-bold leading-snug text-slate-200">{round.question}</p>
        <div className="mt-6 text-[7rem] font-black leading-none tracking-tighter text-emerald-300 drop-shadow-[0_0_35px_rgba(52,211,153,0.45)] sm:text-[9rem]" aria-live="polite">{shown}</div>
        <p className="mt-2 text-xl font-black text-white">OUI sur {result.answeredCount}</p>
        <div className="mx-auto mt-5 flex h-4 max-w-sm overflow-hidden rounded-full bg-white/10">
          <div className="bg-emerald-400 transition-all duration-700" style={{ width: done && result.answeredCount ? `${(result.yesCount / result.answeredCount) * 100}%` : '0%' }} />
          <div className="flex-1 bg-rose-400/80" />
        </div>
        <div className="mx-auto mt-2 flex max-w-sm justify-between text-xs font-bold"><span className="text-emerald-300">{result.yesCount} oui</span><span className="text-rose-300">{result.noCount} non</span></div>
        {done && mine ? (
          <p className="mt-5 text-lg font-black text-white">
            {mine.points === 3 ? '🎯 Pile poil! +3' : mine.points === 1 ? '👌 Presque! +1' : `😅 Tu avais dit ${mine.guess}. 0 point`}
          </p>
        ) : null}
      </Card>

      {done ? (
        <Card>
          <Eyebrow>Les prédictions</Eyebrow>
          <ul className="mt-4 space-y-2">
            {result.guesses.map((entry) => (
              <li key={entry.playerId} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-2">
                <Avatar name={entry.name} />
                <span className="flex-1 truncate font-bold text-white">{entry.name}</span>
                <span className="text-sm font-bold text-slate-300">a dit {entry.guess}</span>
                <span className={`min-w-12 rounded-full px-2.5 py-1 text-center text-xs font-black ${entry.points === 3 ? 'bg-emerald-400 text-emerald-950' : entry.points === 1 ? 'bg-amber-300 text-amber-950' : 'bg-white/10 text-slate-400'}`}>+{entry.points}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <Eyebrow>Classement</Eyebrow>
        <div className="mt-4"><Leaderboard room={room} limit={5} /></div>
      </Card>

      <SuggestQuestion onSuggest={onSuggest} pending={room.pendingCustomQuestions} />

      {isHost ? (
        <div className="sticky bottom-4 z-10">
          <PrimaryButton tone={last ? 'amber' : 'cyan'} onClick={() => void act({ type: 'next' })}>
            {last ? <><Trophy size={20} /> Voir le classement final</> : 'Question suivante →'}
          </PrimaryButton>
        </div>
      ) : (
        <p className="py-2 text-center text-sm font-semibold text-slate-300">⏳ L’hôte lance la prochaine question…</p>
      )}
    </div>
  );
}

// ---------- Fin de partie ----------

function FinishedScreen({ room, act, onLeave }: { room: RoomView; act: (action: Record<string, unknown>) => Promise<boolean>; onLeave: () => void }) {
  const isHost = Boolean(room.you?.isHost);
  const [first, second, third] = room.players;
  const podium = [second, first, third];
  const heights = ['h-24', 'h-32', 'h-16'];
  const medals = ['🥈', '🥇', '🥉'];

  return (
    <div className="space-y-5">
      <Card className="text-center">
        <Eyebrow>Partie terminée</Eyebrow>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-white">🏆 {first?.name ?? '—'}</h2>
        <p className="mt-1 text-sm text-slate-300">{first ? `${first.score} points · ${first.exactCount} prédiction${first.exactCount > 1 ? 's' : ''} pile` : ''}</p>
        <div className="mt-6 flex items-end justify-center gap-2">
          {podium.map((player, index) => player ? (
            <div key={player.id} className="flex w-24 flex-col items-center">
              <span className="text-3xl">{medals[index]}</span>
              <span className="mt-1 w-full truncate text-sm font-black text-white">{player.name}</span>
              <div className={`mt-2 flex w-full items-start justify-center rounded-t-2xl bg-gradient-to-b from-violet-300/40 to-cyan-300/10 pt-2 text-lg font-black text-white ${heights[index]}`}>{player.score}</div>
            </div>
          ) : null)}
        </div>
      </Card>

      <Card>
        <Eyebrow>Classement complet</Eyebrow>
        <div className="mt-4"><Leaderboard room={room} /></div>
      </Card>

      {room.history.length > 0 ? (
        <Card>
          <Eyebrow>Les résultats de la soirée</Eyebrow>
          <ul className="mt-4 space-y-3">
            {room.history.map((entry) => (
              <li key={`${entry.number}-${entry.question}`} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 min-w-14 rounded-full bg-emerald-400/15 px-2 py-1 text-center text-xs font-black text-emerald-200">{entry.yesCount}/{entry.answeredCount}</span>
                <span className="leading-5 text-slate-300">{entry.question}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="space-y-2">
        {isHost ? <PrimaryButton onClick={() => void act({ type: 'restart' })}><RefreshCw size={18} /> Rejouer avec le même groupe</PrimaryButton> : <p className="py-2 text-center text-sm font-semibold text-slate-300">L’hôte peut relancer une partie avec le même groupe.</p>}
        <GhostButton onClick={onLeave}><LogOut size={16} /> Quitter</GhostButton>
      </div>
    </div>
  );
}

// ---------- Composant principal ----------

function readInitialState(): { session: Session | null; code: string } {
  const code = (new URL(window.location.href).searchParams.get('code') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  const saved = loadSession();
  // Une partie en cours est reprise (rechargement de page, écran verrouillé…),
  // sauf si le lien ouvert pointe vers une autre partie.
  if (saved && (!code || code === saved.code)) return { session: saved, code: '' };
  return { session: null, code };
}

/** Rendu uniquement dans le navigateur (voir YesNoGameLoader). */
export function YesNoGame() {
  const [initial] = useState(readInitialState);
  const [session, setSession] = useState<Session | null>(initial.session);
  const [room, setRoom] = useState<RoomView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const versionRef = useRef<number | undefined>(undefined);
  const sessionRef = useRef<Session | null>(initial.session);

  const applyResult = useCallback((result: { version: number; room: RoomView | null }) => {
    // Une réponse de polling partie avant une action peut arriver après : on l'ignore.
    if (versionRef.current !== undefined && result.version < versionRef.current) return null;
    versionRef.current = result.version;
    if (result.room) setRoom(result.room);
    return result.room;
  }, []);

  const resetSession = useCallback((message?: string) => {
    writeStorage(SESSION_KEY, null);
    sessionRef.current = null;
    versionRef.current = undefined;
    setSession(null);
    setRoom(null);
    setUrlCode(null);
    if (message) setNotice(message);
  }, []);

  const startSession = useCallback((result: { playerId: string; token: string; version: number; room: RoomView }) => {
    const next = { code: result.room.code, playerId: result.playerId, token: result.token };
    writeStorage(SESSION_KEY, JSON.stringify(next));
    sessionRef.current = next;
    versionRef.current = result.version;
    setSession(next);
    setRoom(result.room);
    setUrlCode(next.code);
    setNotice(null);
  }, []);

  const refresh = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    try {
      const params = versionRef.current !== undefined ? `?v=${versionRef.current}` : '';
      const result = await callApi<{ version: number; room: RoomView | null }>(`${API}/${current.code}${params}`, { token: current.token });
      setOffline(false);
      const view = applyResult(result);
      if (view && !view.you) resetSession('Tu ne fais plus partie de cette partie.');
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) resetSession('Cette partie est terminée ou a expiré.');
      else setOffline(true);
    }
  }, [applyResult, resetSession]);

  // Mise à jour en direct (polling léger, en pause quand l'écran est caché).
  useEffect(() => {
    if (!session) return;
    let timer: number | undefined;
    let stopped = false;
    const loop = async () => {
      if (stopped) return;
      if (!document.hidden) await refresh();
      if (!stopped) timer = window.setTimeout(loop, POLL_MS);
    };
    void loop();
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [session, refresh]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(null), 4000);
    return () => window.clearTimeout(timer);
  }, [error]);

  const act = useCallback(async (action: Record<string, unknown>) => {
    const current = sessionRef.current;
    if (!current) return false;
    try {
      const result = await callApi<{ version: number; room: RoomView | null }>(`${API}/${current.code}`, { method: 'POST', body: JSON.stringify(action), token: current.token });
      applyResult(result);
      return true;
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) resetSession('Cette partie est terminée ou a expiré.');
      else setError(caught instanceof Error ? caught.message : 'Oups, réessaie.');
      return false;
    }
  }, [applyResult, resetSession]);

  const create = async (name: string) => {
    setBusy(true);
    try { startSession(await callApi(API, { method: 'POST', body: JSON.stringify({ action: 'create', name }) })); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Oups, réessaie.'); }
    finally { setBusy(false); }
  };

  const join = async (code: string, name: string) => {
    setBusy(true);
    try { startSession(await callApi(API, { method: 'POST', body: JSON.stringify({ action: 'join', code, name }) })); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Oups, réessaie.'); }
    finally { setBusy(false); }
  };

  const leave = async () => {
    if (!window.confirm('Quitter la partie?')) return;
    await act({ type: 'leave' });
    resetSession();
  };

  const suggest = (question: string) => act({ type: 'suggest', question });

  let screen: ReactNode;
  if (!session) screen = <HomeScreen initialCode={initial.code} busy={busy} onCreate={create} onJoin={join} />;
  else if (!room) screen = <div className="flex justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" aria-label="Chargement de la partie" /></div>;
  else if (room.phase === 'lobby') screen = <LobbyScreen room={room} act={act} onSuggest={suggest} />;
  else if (room.phase === 'question' && room.round) screen = <QuestionScreen key={`${room.round.number}:${room.round.question}`} room={room} act={act} />;
  else if (room.phase === 'reveal' && room.round?.result) screen = <RevealScreen key={`${room.round.number}:${room.round.question}`} room={room} act={act} onSuggest={suggest} />;
  else screen = <FinishedScreen room={room} act={act} onLeave={() => resetSession()} />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02030a] text-white">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(168,85,247,0.16),transparent_26%),radial-gradient(circle_at_50%_92%,rgba(16,185,129,0.12),transparent_30%),linear-gradient(180deg,#010207_0%,#040714_48%,#02030a_100%)]" />
        <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle,rgba(255,255,255,0.9)_1px,transparent_1.4px),radial-gradient(circle,rgba(196,181,253,0.6)_1px,transparent_1.5px)] [background-position:0_0,41px_57px] [background-size:79px_79px,131px_131px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl px-4 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/jeux" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-slate-200 backdrop-blur-xl transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
            <ArrowLeft size={16} /> Jeux
          </Link>
          {session ? (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { void navigator.clipboard?.writeText(shareUrl(session.code)).catch(() => undefined); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 font-mono text-sm font-black tracking-[0.2em] text-cyan-100" aria-label={`Copier le lien de la partie ${session.code}`}>
                {session.code} <Copy size={14} />
              </button>
              <button type="button" onClick={leave} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300 hover:text-rose-200" aria-label="Quitter la partie">
                <LogOut size={17} />
              </button>
            </div>
          ) : null}
        </div>

        {offline ? <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">Connexion instable… on réessaie.</div> : null}
        {notice ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-200">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Fermer"><X size={16} /></button>
          </div>
        ) : null}

        {screen}

        {session && room?.you?.isHost && (room.phase === 'question' || room.phase === 'reveal') ? (
          <button type="button" onClick={() => { if (window.confirm('Terminer la partie maintenant et voir le classement?')) void act({ type: 'end' }); }} className="mt-6 w-full text-center text-xs font-bold text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline">
            Terminer la partie maintenant
          </button>
        ) : null}
      </div>

      {error ? (
        <div role="alert" className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-rose-300/30 bg-rose-950/95 px-4 py-3 text-center text-sm font-bold text-rose-100 shadow-2xl backdrop-blur">
          {error}
        </div>
      ) : null}
    </div>
  );
}
