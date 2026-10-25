import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/features/crm/auth/api-guard';
import { loadQuebecTaxReport } from '@/lib/server/quebec-tax-report';
import { csvCell } from '@/lib/quebec-fiscal';

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(request, 'finance', 'read');
  if (guard.error) return guard.error;

  try {
    const report = await loadQuebecTaxReport(
      request.nextUrl.searchParams.get('from'),
      request.nextUrl.searchParams.get('to'),
    );
    const rows = [
      ['Numero', 'Date', 'Statut', 'Fournitures taxables', 'Fournitures non taxables', 'TPS', 'TVQ', 'Total'],
      ...report.summary.lines.map((line) => [
        line.number,
        line.issueDate.slice(0, 10),
        line.status,
        line.taxableBase.toFixed(2),
        line.exemptAmount.toFixed(2),
        line.gstAmount.toFixed(2),
        line.qstAmount.toFixed(2),
        line.total.toFixed(2),
      ]),
      [],
      ['Fournitures taxables', report.summary.taxableSupplies.toFixed(2)],
      ['Fournitures non taxables', report.summary.exemptSupplies.toFixed(2)],
      ['TPS percue', report.summary.gstCollected.toFixed(2)],
      ['TVQ percue', report.summary.qstCollected.toFixed(2)],
      ['Taxes percues', report.summary.taxCollected.toFixed(2)],
    ];
    const body = rows.map((row) => row.map((cell) => csvCell(cell)).join(',')).join('\n');
    const filename = `sommaire-tps-tvq-${report.period.from}_${report.period.to}.csv`;
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const safe = message === 'Date invalide.' || message.startsWith('La date de fin') || message.startsWith('La période')
      ? message
      : 'Période invalide.';
    return NextResponse.json({ error: safe }, { status: 400 });
  }
}
