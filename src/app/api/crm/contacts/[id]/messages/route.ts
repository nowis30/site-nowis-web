import { NextResponse } from 'next/server';

const DISABLED_MESSAGE = 'Ce canal CRM est indisponible. Utilisez le courriel externe.';

export async function GET() {
  return NextResponse.json({
    error: DISABLED_MESSAGE,
    outlookUrl: 'https://outlook.office.com/mail/deeplink/compose?to=simonmorin@nowis.store&subject=Demande%20depuis%20le%20portail%20client',
    mailtoUrl: 'mailto:simonmorin@nowis.store?subject=Demande%20depuis%20le%20portail%20client',
  }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({
    error: DISABLED_MESSAGE,
    outlookUrl: 'https://outlook.office.com/mail/deeplink/compose?to=simonmorin@nowis.store&subject=Demande%20depuis%20le%20portail%20client',
    mailtoUrl: 'mailto:simonmorin@nowis.store?subject=Demande%20depuis%20le%20portail%20client',
  }, { status: 410 });
}
