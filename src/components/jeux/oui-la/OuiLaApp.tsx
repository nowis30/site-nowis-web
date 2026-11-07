'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { CEILING_LABEL, CEILING_RANK, CEILINGS, type Ceiling, type PublicRoom } from '@/lib/oui-la/types';
import { QrCode } from './QrCode';

const STORAGE = 'nowis-oui-la';
const buzzedRounds = new Set<string>();
const TEMPLATES: { level: Ceiling; mode: 'cible' | 'tous'; text: string }[] = [
  { level: 'doux', mode: 'cible', text: 'Est-ce que {nom} est du genre à arriver en retard?' },
  { level: 'party', mode: 'cible', text: 'Est-ce que {nom} t’a déjà fait rougir?' },
  { level: 'ose', mode: 'cible', text: 'Est-ce que tu embrasserais {nom} ce soir?' },
  { level: 'party', mode: 'tous', text: 'Est-ce que {nom} est la personne la plus susceptible de texter son ex ce soir?' },
  { level: 'sans-filtre', mode: 'cible', text: 'Est-ce que tu coucherais avec {nom}?' },
];

type Session = { code: string; token: string | null; hostToken: string | null };

type CallResult = { room: PublicRoom; code?: string; token?: string | null; hostToken?: string | null };

async function call(body: Record<string, unknown>): Promise<CallResult> {
  let response: Response;
  try {
    response = await fetch('/api/jeux/oui-la', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Connexion perdue.');
  }
  const data = await response.json().catch(() => null) as (CallResult & { ok?: boolean; error?: string }) | null;
  if (data?.room) {
    if (data.ok === false) {
      const error = new Error(data.error || 'Ça n’a pas marché.') as Error & { room?: PublicRoom };
      error.room = data.room;
      throw error;
    }
  }
  if (!data || data.ok !== true || !data.room) throw new Error(data?.error || 'Ça n’a pas marché.');
  return data;
}

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed || typeof parsed.code !== 'string' || parsed.code.length !== 4) return null;
    return { code: parsed.code, token: parsed.token ?? null, hostToken: parsed.hostToken ?? null };
  } catch {
    return null;
  }
}

function capBetween(adult: Ceiling, personal: Ceiling): Ceiling {
  return CEILING_RANK[adult] <= CEILING_RANK[personal] ? adult : personal;
}

export function OuiLaApp({ initialCode }: { initialCode: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [booted, setBooted] = useState(false);
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [error, setError] = useState('');
  const [link, setLink] = useState<'ok' | 'perdu'>('ok');
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState(initialCode);
  const [ceiling, setCeiling] = useState<Ceiling>('party');
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const origin = useOrigin();

  useEffect(() => {
    const saved = readSession();
    const frame = window.requestAnimationFrame(() => {
      if (saved && (!initialCode || saved.code === initialCode)) setSession(saved);
      setBooted(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialCode]);

  useEffect(() => {
    if (!booted) return;
    if (!session) sessionStorage.removeItem(STORAGE);
    else sessionStorage.setItem(STORAGE, JSON.stringify(session));
  }, [booted, session]);

  useEffect(() => {
    if (!session) return undefined;
    let stop = false;
    let timer = 0;
    let inflight = false;
    const tick = async () => {
      if (!session || inflight) return;
      inflight = true;
      try {
        const data = await call({ action: 'sync', code: session.code, token: session.token, hostToken: session.hostToken });
        if (!stop) {
          setRoom(data.room);
          setLink('ok');
        }
      } catch (caught) {
        if (!stop) {
          const message = caught instanceof Error ? caught.message : 'Connexion perdue.';
          const attached = caught as Error & { room?: PublicRoom };
          if (attached.room) setRoom(attached.room);
          if (message.includes('existe plus')) {
            setSession(null);
            setRoom(null);
            setError('Cette salle est terminée.');
          } else setLink('perdu');
        }
      } finally {
        inflight = false;
        if (!stop) timer = window.setTimeout(tick, document.visibilityState === 'hidden' ? 4000 : 1200);
      }
    };
    void tick();
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, [session]);

  async function run(body: Record<string, unknown>, nextSession?: Session) {
    setBusy(true);
    setError('');
    try {
      const current = nextSession ?? session;
      const data = await call({ ...body, code: current?.code, token: current?.token, hostToken: current?.hostToken });
      if (data.code || data.token || data.hostToken) {
        const created: Session = {
          code: data.code || current?.code || '',
          token: data.token === undefined ? current?.token ?? null : data.token,
          hostToken: data.hostToken === undefined ? current?.hostToken ?? null : data.hostToken,
        };
        setSession(created);
      }
      setRoom(data.room);
      setLink('ok');
      return data;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Ça n’a pas marché.';
      const attached = caught as Error & { room?: PublicRoom };
      if (attached.room) setRoom(attached.room);
      setError(message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return (
      <Landing
        name={name}
        code={joinCode}
        ceiling={ceiling}
        adult={adult}
        busy={busy}
        error={error}
        onName={setName}
        onCode={setJoinCode}
        onCeiling={setCeiling}
        onAdult={setAdult}
        onWall={() => void run({ action: 'create', mode: 'mur' }, { code: '', token: null, hostToken: null })}
        onCreate={() => void run({ action: 'create', mode: 'joueur', name, ceiling, adult }, { code: '', token: null, hostToken: null })}
        onJoin={() => void run({ action: 'join', code: joinCode, name, ceiling, adult }, { code: joinCode, token: null, hostToken: null })}
      />
    );
  }

  if (!room) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 text-white">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Oui là</p>
        <h1 className="mt-3 text-4xl font-black">Connexion à {session.code}…</h1>
        {error ? <p className="mt-4 text-sm text-rose-100" role="alert">{error}</p> : null}
        <button type="button" onClick={() => { setSession(null); setError(''); }} className="mt-6 min-h-12 rounded-2xl border border-white/20 font-bold">Retour</button>
      </main>
    );
  }

  return (
    <Room
      room={room}
      origin={origin}
      error={error}
      link={link}
      busy={busy}
      onError={setError}
      onRun={run}
      onLeave={async () => {
        if (session.token) await run({ action: 'leave' });
        setSession(null);
        setRoom(null);
      }}
    />
  );
}

function Landing({
  name, code, ceiling, adult, busy, error, onName, onCode, onCeiling, onAdult, onWall, onCreate, onJoin,
}: {
  name: string;
  code: string;
  ceiling: Ceiling;
  adult: boolean;
  busy: boolean;
  error: string;
  onName: (value: string) => void;
  onCode: (value: string) => void;
  onCeiling: (value: Ceiling) => void;
  onAdult: (value: boolean) => void;
  onWall: () => void;
  onCreate: () => void;
  onJoin: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-6 pb-28 text-white">
      <Link href="/jeux" className="text-sm font-bold text-cyan-200">← Retour aux jeux</Link>
      <p className="mt-8 text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Jeu de soirée</p>
      <h1 className="mt-3 font-display text-6xl leading-none text-white sm:text-7xl">Oui là</h1>
      <p className="mt-4 text-base leading-7 text-slate-300">
        Des questions auxquelles on répond seulement par oui ou par non. Ouvre la salle sur la télé, scanne le code, et chacun joue sur son cellulaire.
      </p>
      {error ? <p className="mt-4 rounded-2xl border border-rose-300/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100" role="alert">{error}</p> : null}
      <section className="mt-8 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
        <h2 className="text-lg font-black">Cet écran reste au mur</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">La télé montre le code et les réponses. Toi, tu joueras sur ton téléphone.</p>
        <button type="button" disabled={busy} onClick={onWall} className="mt-4 min-h-12 w-full rounded-2xl bg-cyan-200 px-4 font-black text-slate-950 disabled:opacity-60">Afficher le code QR</button>
      </section>
      <section className="mt-4 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
        <h2 className="text-lg font-black">Je joue sur ce téléphone</h2>
        <label className="mt-4 block text-sm font-bold" htmlFor="oui-la-name">Ton nom</label>
        <input id="oui-la-name" value={name} onChange={(event) => onName(event.target.value)} maxLength={18} autoComplete="nickname" className="mt-2 min-h-12 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-base" />
        <p className="mt-4 text-sm font-bold">Jusqu’où tu veux aller</p>
        <CeilingPicker ceiling={ceiling} adult={adult} roomCap="sans-filtre" onChange={onCeiling} />
        <label className="mt-4 flex min-h-12 items-center gap-3 text-sm">
          <input type="checkbox" checked={adult} onChange={(event) => onAdult(event.target.checked)} className="h-5 w-5" />
          J’ai 18 ans ou plus
        </label>
        <p className="mt-1 text-xs leading-5 text-slate-400">Si quelqu’un ne coche pas, les questions osées se ferment pour toute la salle.</p>
        <button type="button" disabled={busy} onClick={onCreate} className="mt-4 min-h-12 w-full rounded-2xl bg-white px-4 font-black text-slate-950 disabled:opacity-60">Créer une salle et jouer ici</button>
        <label className="mt-5 block text-sm font-bold" htmlFor="oui-la-code">Rejoindre avec un code</label>
        <input id="oui-la-code" value={code} onChange={(event) => onCode(event.target.value.toUpperCase())} maxLength={4} autoCapitalize="characters" className="mt-2 min-h-12 w-full rounded-2xl border border-white/15 bg-black/40 px-4 text-center text-2xl font-black tracking-[0.4em]" />
        <button type="button" disabled={busy} onClick={onJoin} className="mt-3 min-h-12 w-full rounded-2xl border border-white/20 px-4 font-black disabled:opacity-60">Rejoindre la salle</button>
      </section>
    </main>
  );
}

function CeilingPicker({
  ceiling, adult, roomCap, onChange,
}: {
  ceiling: Ceiling;
  adult: boolean;
  roomCap: Ceiling;
  onChange: (value: Ceiling) => void;
}) {
  const max = capBetween(roomCap, adult ? 'sans-filtre' : 'party');
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {CEILINGS.map((level) => {
        const locked = CEILING_RANK[level] > CEILING_RANK[max];
        const selected = ceiling === level;
        return (
          <button
            key={level}
            type="button"
            disabled={locked}
            onClick={() => onChange(level)}
            className={`min-h-11 rounded-xl border px-3 text-sm font-black ${selected ? 'border-cyan-200 bg-cyan-200 text-slate-950' : 'border-white/15 text-white'} disabled:opacity-40`}
          >
            {CEILING_LABEL[level]}
          </button>
        );
      })}
    </div>
  );
}

function Room({
  room, origin, error, link, busy, onError, onRun, onLeave,
}: {
  room: PublicRoom;
  origin: string;
  error: string;
  link: 'ok' | 'perdu';
  busy: boolean;
  onError: (value: string) => void;
  onRun: (body: Record<string, unknown>) => Promise<CallResult | null>;
  onLeave: () => Promise<void>;
}) {
  const joinUrl = origin ? `${origin}/jeux/oui-la?salle=${room.code}` : '';
  const [mode, setMode] = useState<'cible' | 'tous'>('tous');
  const [targetId, setTargetId] = useState('');
  const [level, setLevel] = useState<Ceiling>('party');
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const youAreTarget = Boolean(room.you && room.round?.targetIds.includes(room.you.id) && room.phase === 'question' && !room.round.yourAnswer);
  const clock = useServerNow(room.serverNow);
  const remaining = room.round && room.phase === 'question' ? Math.max(0, Math.ceil((room.round.deadline - clock) / 1000)) : 0;
  useEffect(() => {
    if (!youAreTarget || !room.round || buzzedRounds.has(room.round.id)) return;
    buzzedRounds.add(room.round.id);
    navigator.vibrate?.(40);
  }, [room.round, youAreTarget]);

  const personalCap = room.you ? capBetween(room.adultCap, room.you.ceiling) : room.adultCap;
  const selected = room.players.find((player) => player.id === targetId) ?? null;
  const askCap = mode === 'tous' || !selected ? room.caps.tous : capBetween(room.adultCap, selected.ceiling);
  const activeCap = mode === 'cible' && selected ? askCap : mode === 'tous' ? room.caps.tous : personalCap;

  async function copyLink() {
    if (!joinUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Oui là', text: `Salle ${room.code}`, url: joinUrl });
        return;
      }
    } catch {
      // Le partage a été annulé ou refusé : on tente la copie.
    }
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
    } catch {
      onError(`Copie le code à la main : ${room.code}`);
    }
  }

  async function ask(kind: 'ask' | 'draw', template?: string) {
    const body: Record<string, unknown> = {
      action: kind,
      mode,
      level: CEILING_RANK[level] > CEILING_RANK[activeCap] ? activeCap : level,
      targetId: mode === 'cible' ? targetId : undefined,
      text: template ?? text,
    };
    const result = await onRun(body);
    if (result && kind === 'ask') setText('');
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-4 pb-28 text-white lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:gap-6 lg:px-6">
      <section className="flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <Link href="/jeux" className="text-sm font-bold text-cyan-200">← Jeux</Link>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{link === 'perdu' ? 'Reconnexion…' : 'En ligne'}</p>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Oui là</p>
            <p className="mt-1 text-4xl font-black tracking-[0.18em]">{room.code}</p>
          </div>
          <button type="button" onClick={() => void onLeave()} className="min-h-11 rounded-full border border-white/15 px-4 text-sm font-bold">Quitter</button>
        </div>
        {room.notice ? <p className="mt-4 rounded-2xl border border-amber-200/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">{room.notice}</p> : null}
        {error ? <p className="mt-4 rounded-2xl border border-rose-300/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100" role="alert">{error}</p> : null}

        {room.phase === 'lobby' ? (
          <div className="mt-6">
            {joinUrl ? (
              <div className="mx-auto w-full max-w-xs rounded-[1.8rem] bg-white p-4">
                <QrCode value={joinUrl} />
              </div>
            ) : null}
            <p className="mt-4 text-center text-sm text-slate-300">Scanne pour jouer sur ton cellulaire. Code {room.code}.</p>
            <button type="button" onClick={() => void copyLink()} className="mx-auto mt-3 flex min-h-11 items-center justify-center rounded-full border border-white/15 px-4 text-sm font-bold">{copied ? 'Lien copié' : 'Partager le lien'}</button>
          </div>
        ) : null}

        {room.round ? (
          <div className="mt-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              {room.round.authorName} · {CEILING_LABEL[room.round.level]}
              {room.phase === 'question' ? ` · ${remaining}s` : ''}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl" aria-live="polite">{room.round.text}</h2>
            {youAreTarget ? (
              <div className="mt-5 grid gap-3">
                <button type="button" disabled={busy} onClick={() => void onRun({ action: 'answer', value: 'oui' })} className="min-h-24 rounded-[1.6rem] bg-lime-300 text-4xl font-black text-slate-950">Oui</button>
                <button type="button" disabled={busy} onClick={() => void onRun({ action: 'answer', value: 'non' })} className="min-h-24 rounded-[1.6rem] bg-rose-400 text-4xl font-black text-slate-950">Non</button>
                <button type="button" disabled={busy || !room.you?.passeLeft} onClick={() => void onRun({ action: 'answer', value: 'passe' })} className="min-h-12 rounded-2xl border border-white/20 font-bold disabled:opacity-40">Passe{room.you?.passeLeft ? ' (1 pour la soirée)' : ' déjà utilisé'}</button>
                <button type="button" disabled={busy} onClick={() => void onRun({ action: 'veto' })} className="min-h-11 text-sm font-bold text-slate-400">Trop loin{room.round.vetoes ? ` · ${room.round.vetoes}` : ''}</button>
              </div>
            ) : null}
            {room.phase === 'reveal' && room.round.answers ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {room.round.answers.map((answer) => (
                  <li key={answer.playerId} className={`rounded-3xl px-4 py-5 ${answer.value === 'oui' ? 'bg-lime-300 text-slate-950' : answer.value === 'non' ? 'bg-rose-400 text-slate-950' : 'bg-white/10 text-white'}`}>
                    <p className="text-sm font-bold opacity-70">{answer.name}</p>
                    <p className="text-4xl font-black uppercase">{answer.value === 'silence' ? '…' : answer.value}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-5 flex flex-wrap gap-2">
                {room.players.filter((player) => room.round?.targetIds.includes(player.id)).map((player) => {
                  const done = room.round?.answeredIds.includes(player.id);
                  return <li key={player.id} className={`rounded-full px-3 py-2 text-sm font-bold ${done ? 'bg-lime-300 text-slate-950' : 'bg-white/10'}`}>{player.name}{done ? ' · répondu' : ''}</li>;
                })}
              </ul>
            )}
            {room.phase === 'reveal' && room.round.mode === 'cible' ? (
              <div className="mt-5">
                <p className="text-sm font-bold">On te croit?</p>
                <p className="mt-1 text-sm text-slate-400">{room.round.belief.yes} oui · {room.round.belief.no} non</p>
                {room.you && room.round.belief.yours === null ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" disabled={busy} onClick={() => void onRun({ action: 'believe', value: true })} className="min-h-12 rounded-2xl bg-white font-black text-slate-950">Oui</button>
                    <button type="button" disabled={busy} onClick={() => void onRun({ action: 'believe', value: false })} className="min-h-12 rounded-2xl border border-white/20 font-black">Mouais</button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <PlayerList room={room} onKick={(playerId) => void onRun({ action: 'kick', playerId })} />
      </section>

      <section className="mt-6 lg:mt-14">
        {room.phase === 'question' && !youAreTarget ? (
          <div className="grid gap-3">
            <p className="text-sm text-slate-300">{room.round?.yourAnswer ? `Ta réponse est entrée : ${room.round.yourAnswer}.` : 'La salle répond.'}</p>
            {(room.you || room.host) ? <button type="button" disabled={busy} onClick={() => void onRun({ action: 'reveal' })} className="min-h-12 rounded-2xl border border-white/20 font-black">Révéler maintenant</button> : null}
            {room.you ? <button type="button" disabled={busy} onClick={() => void onRun({ action: 'veto' })} className="min-h-11 text-sm font-bold text-slate-400">Trop loin{room.round?.vetoes ? ` · ${room.round.vetoes}` : ''}</button> : null}
          </div>
        ) : null}

        {room.phase === 'reveal' && (room.you || room.host) ? (
          <button type="button" disabled={busy} onClick={() => void onRun({ action: 'next' })} className="min-h-14 w-full rounded-2xl bg-white font-black text-slate-950">Question suivante</button>
        ) : null}

        {room.phase === 'lobby' && (room.you || room.host) ? (
          <Composer
            room={room}
            mode={mode}
            targetId={targetId}
            level={CEILING_RANK[level] > CEILING_RANK[activeCap] ? activeCap : level}
            text={text}
            busy={busy}
            cap={activeCap}
            onMode={setMode}
            onTarget={setTargetId}
            onLevel={setLevel}
            onText={setText}
            onAsk={() => void ask('ask')}
            onDraw={() => void ask('draw')}
            onTemplate={(template) => void ask('ask', template)}
          />
        ) : null}

        {room.you ? (
          <div className="mt-6 rounded-[1.4rem] border border-white/10 p-4">
            <p className="text-sm font-bold">Ton plafond, {room.you.name}</p>
            <CeilingPicker
              ceiling={room.you.ceiling}
              adult={room.you.adult}
              roomCap={room.adultCap}
              onChange={(value) => void onRun({ action: 'profile', ceiling: value, adult: room.you?.adult === true })}
            />
            <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" checked={room.you.adult} onChange={(event) => void onRun({ action: 'profile', ceiling: room.you?.ceiling, adult: event.target.checked })} className="h-5 w-5" />
              J’ai 18 ans ou plus
            </label>
            {room.adultCap === 'party' ? <p className="mt-2 text-xs leading-5 text-slate-400">Une personne n’a pas confirmé avoir 18 ans. L’osé reste fermé pour tout le monde.</p> : null}
          </div>
        ) : (
          <p className="mt-6 text-sm leading-6 text-slate-400">Cet écran ne répond pas. Scanne le code avec ton téléphone pour jouer, même si c’est toi qui animes.</p>
        )}

        {room.host ? (
          <button type="button" disabled={busy} onClick={() => void onRun({ action: 'lock', locked: !room.locked })} className="mt-4 min-h-11 text-sm font-bold text-slate-300">
            {room.locked ? 'Rouvrir la salle' : 'Barrer la salle'}
          </button>
        ) : null}
      </section>
    </main>
  );
}

function Composer({
  room, mode, targetId, level, text, busy, cap, onMode, onTarget, onLevel, onText, onAsk, onDraw, onTemplate,
}: {
  room: PublicRoom;
  mode: 'cible' | 'tous';
  targetId: string;
  level: Ceiling;
  text: string;
  busy: boolean;
  cap: Ceiling;
  onMode: (mode: 'cible' | 'tous') => void;
  onTarget: (id: string) => void;
  onLevel: (level: Ceiling) => void;
  onText: (text: string) => void;
  onAsk: () => void;
  onDraw: () => void;
  onTemplate: (text: string) => void;
}) {
  const target = room.players.find((player) => player.id === targetId);
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">Poser une question</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onMode('tous')} className={`min-h-11 rounded-xl font-bold ${mode === 'tous' ? 'bg-white text-slate-950' : 'border border-white/15'}`}>Tout le monde</button>
        <button type="button" onClick={() => onMode('cible')} className={`min-h-11 rounded-xl font-bold ${mode === 'cible' ? 'bg-white text-slate-950' : 'border border-white/15'}`}>Une personne</button>
      </div>
      {mode === 'cible' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {room.players.filter((player) => player.id !== room.you?.id).map((player) => (
            <button key={player.id} type="button" onClick={() => onTarget(player.id)} className={`min-h-11 rounded-full px-3 font-bold ${targetId === player.id ? 'bg-cyan-200 text-slate-950' : 'bg-white/10'}`}>{player.name}</button>
          ))}
        </div>
      ) : null}
      <p className="mt-3 text-xs text-slate-400">Plafond de cette question : {CEILING_LABEL[cap]}</p>
      <CeilingPicker ceiling={level} adult={CEILING_RANK[cap] >= CEILING_RANK.ose} roomCap={cap} onChange={onLevel} />
      <label className="mt-3 block text-sm font-bold" htmlFor="oui-la-question">Ta question</label>
      <textarea id="oui-la-question" value={text} onChange={(event) => onText(event.target.value)} maxLength={180} rows={3} className="mt-2 w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-base" placeholder="Une question qui se répond par oui ou par non" />
      <div className="mt-3 flex flex-wrap gap-2">
        {TEMPLATES.filter((template) => template.mode === mode && CEILING_RANK[template.level] <= CEILING_RANK[cap]).map((template) => (
          <button key={template.text} type="button" disabled={busy || (mode === 'cible' && !target)} onClick={() => onTemplate(template.text.split('{nom}').join(target?.name ?? 'cette personne'))} className="min-h-10 rounded-full bg-white/10 px-3 text-left text-xs font-bold">{template.text.split('{nom}').join(target?.name ?? '…')}</button>
        ))}
      </div>
      <button type="button" disabled={busy} onClick={onAsk} className="mt-4 min-h-12 w-full rounded-2xl bg-cyan-200 font-black text-slate-950 disabled:opacity-60">Poser la question</button>
      <button type="button" disabled={busy} onClick={onDraw} className="mt-2 min-h-12 w-full rounded-2xl border border-white/20 font-black disabled:opacity-60">Piger une question</button>
    </div>
  );
}

function PlayerList({ room, onKick }: { room: PublicRoom; onKick: (playerId: string) => void }) {
  return (
    <ul className="mt-6 flex flex-wrap gap-2">
      {room.players.map((player) => (
        <li key={player.id} className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-3 pr-1 text-sm">
          <span className="font-bold">{player.name}</span>
          <span className="text-slate-400">{CEILING_LABEL[player.ceiling]}</span>
          {room.host ? <button type="button" onClick={() => onKick(player.id)} className="min-h-9 rounded-full px-2 font-bold text-slate-300" aria-label={`Retirer ${player.name}`}>×</button> : null}
        </li>
      ))}
      {!room.players.length ? <li className="text-sm text-slate-400">Personne n’a encore scanné.</li> : null}
    </ul>
  );
}

function useOrigin() {
  return useSyncExternalStore(emptySubscribe, clientOrigin, serverOrigin);
}

function emptySubscribe() {
  return () => undefined;
}

function clientOrigin() {
  return window.location.origin;
}

function serverOrigin() {
  return '';
}

function useServerNow(serverNow: number) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const offset = serverNow - Date.now();
    const timer = window.setInterval(() => setNow(Date.now() + offset), 250);
    return () => window.clearInterval(timer);
  }, [serverNow]);
  return now;
}
