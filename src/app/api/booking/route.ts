/**
 * API Route - Booking Handler
 * Gère les soumissions du formulaire de réservation
 * 
 * TODO: Intègre ton service d'email (Resend, SendGrid, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';

interface BookingData {
  name: string;
  email: string;
  phone?: string;
  service: string;
  date: string;
  time: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Valider que c'est du JSON
    const body = await request.json();
    const { name, email, phone, service, date, time, message } = body as BookingData;

    // Validation basique
    if (!name || !email || !service || !date || !time) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    // TODO: Intègre ton service d'email ici
    console.log('📧 Réservation reçue:', {
      name,
      email,
      phone,
      service,
      date,
      time,
      message,
    });

    // Exemple avec Resend (décommenter et configurer)
    /*
    import { Resend } from 'resend';
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: 'noreply@nowis.store',
      to: process.env.BOOKING_EMAIL || 'simonmorin@nowis.store',
      subject: `Nouvelle réservation de ${name}`,
      html: `
        <h2>Nouvelle réservation</h2>
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Téléphone:</strong> ${phone}</p>` : ''}
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Heure:</strong> ${time}</p>
        ${message ? `<p><strong>Message:</strong><br/>${message}</p>` : ''}
      `,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    */

    // Exemple avec SendGrid (décommenter et configurer)
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: process.env.BOOKING_EMAIL || 'simonmorin@nowis.store',
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@nowis.store',
      subject: `Nouvelle réservation de ${name}`,
      html: `
        <h2>Nouvelle réservation</h2>
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Téléphone:</strong> ${phone}</p>` : ''}
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Heure:</strong> ${time}</p>
        ${message ? `<p><strong>Message:</strong><br/>${message}</p>` : ''}
      `,
    };

    await sgMail.send(msg);
    */

    // Réponse de succès
    return NextResponse.json(
      {
        success: true,
        message: 'Réservation envoyée avec succès!',
        data: {
          name,
          email,
          service,
          date,
          time,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erreur booking:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'envoi de la réservation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Configuration des routes API
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
