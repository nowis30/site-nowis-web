import Link from 'next/link';

const OUTLOOK_MESSAGE_URL = 'https://outlook.office.com/mail/deeplink/compose?to=simonmorin@nowis.store&subject=Demande%20depuis%20le%20portail%20client';
const MAILTO_MESSAGE_URL = 'mailto:simonmorin@nowis.store?subject=Demande%20depuis%20le%20portail%20client';

export function ClientMessagesRetiredCard() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-xl font-semibold text-white">Contacter par courriel</h1>
        <p className="mt-2 text-sm text-slate-300">Utilisez le courriel pour nous joindre rapidement depuis le portail client.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={OUTLOOK_MESSAGE_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-primary-500/40 bg-primary-500/10 px-3 py-2 text-sm font-medium text-primary-100 hover:bg-primary-500/20"
          >
            Envoyer un message
          </a>
          <Link href="/client/dashboard" className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-primary-500/40 hover:text-white">
            Retour au portail
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Si Outlook ne s&apos;ouvre pas, utilisez le{' '}
          <a href={MAILTO_MESSAGE_URL} className="underline underline-offset-2 hover:text-slate-200">
            courriel de secours
          </a>
          .
        </p>
      </div>
    </section>
  );
}