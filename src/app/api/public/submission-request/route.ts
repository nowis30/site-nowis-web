import { NextResponse } from 'next/server';

/**
 * LEGACY — Route publique désactivée le 2026-05-05.
 *
 * Cette route créait des Inquiry, SongRequest et WorkshopRequest directement
 * sans authentification, causant des doublons dans le CRM.
 *
 * Elle a été remplacée par le portail client authentifié :
 *   - /client/song-requests/nouveau  (demandes chanson)
 *   - /client/workshops/nouveau      (demandes atelier)
 *
 * Les données historiques (Inquiry) sont conservées dans la base.
 * NE PAS réactiver sans révision de sécurité complète.
 */

const GONE_RESPONSE = {
  error: "Cette ancienne route de soumission est désactivée. Utilisez le portail client.",
  portalUrl: "/client/dashboard",
};

export async function POST() {
  return NextResponse.json(GONE_RESPONSE, { status: 410 });
}

export async function GET() {
  return NextResponse.json(GONE_RESPONSE, { status: 410 });
}

export async function PUT() {
  return NextResponse.json(GONE_RESPONSE, { status: 410 });
}

export async function PATCH() {
  return NextResponse.json(GONE_RESPONSE, { status: 410 });
}
