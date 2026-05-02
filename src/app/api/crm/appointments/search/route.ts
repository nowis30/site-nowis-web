import { NextRequest, NextResponse } from 'next/server';
import { Prisma, AppointmentType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireApiPermission } from '@/features/crm/auth/api-guard';

export async function GET(request: NextRequest) {
  const guard = requireApiPermission(request, 'appointments', 'read');
  if (guard.error) return guard.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q')?.toLowerCase() ?? '';
    const contactId = searchParams.get('contactId');
    const organizationId = searchParams.get('organizationId');
    const workshopRequestId = searchParams.get('workshopRequestId');
    const songRequestId = searchParams.get('songRequestId');
    const onlyUnlinked = searchParams.get('onlyUnlinked') === 'true';
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    const type = searchParams.get('type');

    const from = fromStr ? new Date(fromStr) : null;
    const to = toStr ? new Date(toStr) : null;

    // Build Prisma where clause
    const where: Prisma.AppointmentWhereInput = {};

    // Text search on title
    if (q && q.length >= 2) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Filter by contact
    if (contactId) {
      where.contactId = contactId;
    }

    // Filter by organization
    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Filter by type
    const validTypes = Object.values(AppointmentType);
    if (type && validTypes.includes(type as AppointmentType)) {
      where.appointmentType = {
        equals: type as AppointmentType,
      };
    }

    // Filter unlinked appointments (no workshopRequestId and no songRequestId)
    if (onlyUnlinked) {
      where.AND = [
        { workshopRequestId: null },
        { songRequestId: null },
      ];
    }

    // Filter by workshop request (appointments linked to a workshop)
    if (workshopRequestId) {
      where.workshopRequestId = workshopRequestId;
    }

    // Filter by song request (appointments linked to a song)
    if (songRequestId) {
      where.songRequestId = songRequestId;
    }

    // Filter by date range
    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = from;
      if (to) where.startAt.lte = to;
    }

    // Fetch appointments (limit to 50 results)
    const appointments = await prisma.appointment.findMany({
      where,
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        status: true,
        appointmentType: true,
        location: true,
        type: true,
        contact: {
          select: {
            id: true,
            fullName: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
      take: 50,
    });

    return NextResponse.json({
      items: appointments.map((apt) => ({
        id: apt.id,
        title: apt.title,
        startAt: apt.startAt.toISOString(),
        endAt: apt.endAt.toISOString(),
        status: apt.status,
        type: apt.appointmentType || apt.type,
        location: apt.location,
        contact: apt.contact
          ? { id: apt.contact.id, fullName: apt.contact.fullName }
          : null,
        organization: apt.organization
          ? { id: apt.organization.id, name: apt.organization.name }
          : null,
      })),
      total: appointments.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Recherche impossible' }, { status: 500 });
  }
}
