import Link from "next/link";
import { requireCrmSession } from "@/features/crm/auth/session";
import { prisma } from "@/lib/prisma";
import { DashboardUploader } from "@/features/crm/components/shared/DashboardUploader";
import { StatusBadge } from "@/features/crm/components/shared/StatusBadge";
import { Calendar, CheckSquare, FileText, Activity, AlertCircle, Clock, User } from "lucide-react";

export default async function CrmDashboardPage() {
  const session = await requireCrmSession();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let contacts = 0;
  let openCases = 0;
  let closedCasesCount = 0;
  let recentCases: Array<{ id: string; title: string; status: string; type: string; referenceCode: string }> = [];
  let todayAppointments: Array<{ id: string; title: string; type: string; startAt: Date; contact: { fullName: string } | null }> = [];
  let overdueTasks: Array<{ id: string; title: string; dueDate: Date | null }> = [];
  let recentActivities: Array<{ id: string; type: string; title: string; createdAt: Date; contact: { fullName: string } | null }> = [];
  let pendingInvoices = 0;
  let overdueInvoices = 0;
  let newContactsThisMonth = 0;
  let openPortalNotifications = 0;
  let clientFollowUpTasks: Array<{ id: string; title: string; description: string | null; linkedId: string | null; dueDate: Date | null }> = [];
  let followUpContacts: Array<{ id: string; fullName: string }> = [];
  let dbUnavailable = false;

  try {
    [
      contacts,
      openCases,
      closedCasesCount,
      recentCases,
      todayAppointments,
      overdueTasks,
      recentActivities,
      pendingInvoices,
      overdueInvoices,
      newContactsThisMonth,
      openPortalNotifications,
      clientFollowUpTasks,
    ] = await Promise.all([
      prisma.contact.count(),
      prisma.caseRecord.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] } } }),
      prisma.caseRecord.count({ where: { status: "CLOSED" } }),
      prisma.caseRecord.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, type: true, referenceCode: true },
      }),
      prisma.appointment.findMany({
        where: { startAt: { gte: today, lt: tomorrow }, status: { not: "CANCELLED" } },
        include: { contact: { select: { fullName: true } } },
        orderBy: { startAt: "asc" },
      }),
      prisma.task.findMany({
        where: { status: { in: ["TODO", "IN_PROGRESS"] }, dueDate: { lt: today } },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.activity.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { contact: { select: { fullName: true } } },
      }),
      prisma.invoice.count({ where: { status: "SENT" } }),
      prisma.invoice.count({ where: { status: "OVERDUE" } }),
      prisma.contact.count({
        where: { createdAt: { gte: new Date(new Date().setDate(1)) } },
      }),
      prisma.communication.count({
        where: {
          direction: 'INBOUND',
          OR: [{ channel: 'portal' }, { channel: { startsWith: 'portal-' } }],
          handledAt: null,
        },
      }),
      prisma.task.findMany({
        where: {
          status: { in: ['TODO', 'IN_PROGRESS'] },
          title: 'Contacter le client sous 24h',
          dueDate: { lte: next24Hours },
        },
        orderBy: { dueDate: 'asc' },
        take: 6,
      }),
    ]);

    const followUpContactIds = Array.from(new Set(clientFollowUpTasks.map((task) => task.linkedId).filter(Boolean))) as string[];
    followUpContacts = followUpContactIds.length > 0
      ? await prisma.contact.findMany({
          where: { id: { in: followUpContactIds } },
          select: { id: true, fullName: true },
        })
      : [];
  } catch (error) {
    dbUnavailable = true;
    console.error('[CRM_DASHBOARD_DB_UNAVAILABLE]', error);
  }

  if (dbUnavailable) {
    return (
      <section className="space-y-5">
        <div className="rounded-2xl border border-red-800/50 bg-red-950/20 p-6">
          <h2 className="text-xl font-semibold text-white">CRM temporairement indisponible</h2>
          <p className="mt-2 text-sm text-red-200">
            La base de donnees ne repond pas pour le moment. La session est valide, mais les donnees CRM ne peuvent pas etre chargees.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/crm/login" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
              Revenir a la connexion
            </Link>
            <Link href="/crm/dashboard" className="rounded-lg border border-red-700/60 bg-red-950/30 px-3 py-2 text-sm text-red-200 hover:bg-red-950/50">
              Reessayer
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const followUpContactMap = new Map(followUpContacts.map((contact) => [contact.id, contact.fullName]));

  const kpis = [
    { label: "Contacts", value: contacts, sub: `+${newContactsThisMonth} ce mois`, href: "/crm/contacts", color: "from-blue-500/20", icon: "👥" },
    { label: "Dossiers ouverts", value: openCases, sub: `${closedCasesCount} fermés`, href: "/crm/cases", color: "from-amber-500/20", icon: "📁" },
    { label: "Factures en attente", value: pendingInvoices, sub: overdueInvoices > 0 ? `⚠ ${overdueInvoices} en retard` : "À jour", href: "/crm/invoices", color: overdueInvoices > 0 ? "from-red-500/20" : "from-emerald-500/20", icon: "🧾" },
    { label: "RDV aujourd'hui", value: todayAppointments.length, sub: "rendez-vous planifiés", href: "/crm/calendar", color: "from-indigo-500/20", icon: "📅" },
    { label: "Tâches en retard", value: overdueTasks.length, sub: "nécessitent attention", href: "/crm/tasks", color: overdueTasks.length > 0 ? "from-red-500/20" : "from-slate-500/20", icon: "✅" },
  ];

  const TYPE_ICON: Record<string, string> = {
    NOTE: "📝", CALL: "📞", MESSAGE: "💬", EMAIL: "📧",
    APPOINTMENT: "📅", INVOICE: "🧾", PAYMENT: "💳", FORM: "📋", FILE: "📎", TASK: "✅",
  };
  const APT_TYPE_LABELS: Record<string, string> = {
    VISIT: "Visite", CALL: "Appel", FOLLOWUP: "Suivi", MEETING: "Rencontre",
    INSPECTION: "Inspection", DEADLINE: "Échéance", REMINDER: "Rappel",
  };
  const paypalBillingUrl = process.env.NEXT_PUBLIC_PAYPAL_BILLING_URL || process.env.PAYPAL_BILLING_URL;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Bonjour, {session.fullName.split(" ")[0]} 👋</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {new Date().toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Alertes */}
      {(openPortalNotifications > 0 || overdueTasks.length > 0 || overdueInvoices > 0 || clientFollowUpTasks.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {clientFollowUpTasks.length > 0 && (
            <Link href="/crm/tasks" className="flex items-center gap-2 rounded-lg border border-emerald-700/50 bg-emerald-950/30 px-4 py-2.5 text-sm text-emerald-300 hover:bg-emerald-950/50 transition-colors">
              <Clock size={15} />
              {clientFollowUpTasks.length} nouveau{clientFollowUpTasks.length > 1 ? 'x' : ''} client{clientFollowUpTasks.length > 1 ? 's' : ''} a contacter sous 24h
            </Link>
          )}
          {openPortalNotifications > 0 && (
            <Link href="/crm/notifications" className="flex items-center gap-2 rounded-lg border border-cyan-700/50 bg-cyan-950/30 px-4 py-2.5 text-sm text-cyan-300 hover:bg-cyan-950/50 transition-colors">
              <Activity size={15} />
              {openPortalNotifications} notification{openPortalNotifications > 1 ? 's' : ''} portail à traiter
            </Link>
          )}
          {overdueTasks.length > 0 && (
            <Link href="/crm/tasks" className="flex items-center gap-2 rounded-lg border border-red-700/50 bg-red-950/30 px-4 py-2.5 text-sm text-red-300 hover:bg-red-950/50 transition-colors">
              <AlertCircle size={15} />
              {overdueTasks.length} tâche{overdueTasks.length > 1 ? "s" : ""} en retard
            </Link>
          )}
          {overdueInvoices > 0 && (
            <Link href="/crm/invoices" className="flex items-center gap-2 rounded-lg border border-orange-700/50 bg-orange-950/30 px-4 py-2.5 text-sm text-orange-300 hover:bg-orange-950/50 transition-colors">
              <FileText size={15} />
              {overdueInvoices} facture{overdueInvoices > 1 ? "s" : ""} en retard
            </Link>
          )}
        </div>
      )}

      {clientFollowUpTasks.length > 0 && (
        <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-emerald-300" />
            <h3 className="text-sm font-semibold text-emerald-200">Nouveaux clients a contacter sous 24h</h3>
          </div>
          <div className="mt-3 space-y-2">
            {clientFollowUpTasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-3 py-2">
                <p className="text-sm font-medium text-white">{followUpContactMap.get(task.linkedId || '') || task.title}</p>
                <p className="mt-0.5 text-xs text-emerald-300">{task.description}</p>
                {task.dueDate ? (
                  <p className="mt-1 text-xs text-emerald-400">
                    Echeance: {new Date(task.dueDate).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <Link href="/crm/tasks" className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200 transition-colors">
            Ouvrir les taches CRM →
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}
            className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/70 to-slate-950 p-4 transition hover:border-primary-500/40">
            <div className="flex items-start justify-between">
              <p className="text-xs text-slate-500 group-hover:text-slate-400 leading-tight">{kpi.label}</p>
              <span className="text-base">{kpi.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-white">{kpi.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{kpi.sub}</p>
            <div className={`mt-3 h-0.5 w-full rounded-full bg-gradient-to-r ${kpi.color} to-transparent`} />
          </Link>
        ))}
      </div>

      {/* Layout 3 colonnes */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* RDV du jour */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-indigo-400" />
            <h3 className="font-semibold text-white text-sm">Rendez-vous du jour</h3>
          </div>
          {todayAppointments.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Aucun rendez-vous aujourd'hui</p>
          ) : (
            <div className="space-y-2">
              {todayAppointments.map(apt => (
                <div key={apt.id} className="flex items-start gap-3 rounded-lg bg-slate-800/50 px-3 py-2.5">
                  <div className="text-center min-w-[36px]">
                    <p className="text-xs font-bold text-indigo-300">
                      {new Date(apt.startAt).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{apt.title}</p>
                    {apt.contact && <p className="text-xs text-slate-400">{apt.contact.fullName}</p>}
                    <p className="text-xs text-slate-500">{APT_TYPE_LABELS[apt.type] ?? apt.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/crm/calendar" className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-primary-400 transition-colors">
            Voir le calendrier →
          </Link>
        </div>

        {/* Tâches en retard + urgentes */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare size={16} className="text-yellow-400" />
            <h3 className="font-semibold text-white text-sm">Tâches à traiter</h3>
          </div>
          {overdueTasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Toutes les tâches sont à jour ✓</p>
          ) : (
            <div className="space-y-2">
              {overdueTasks.map(task => (
                <div key={task.id} className="flex items-start gap-2 rounded-lg bg-red-950/20 border border-red-800/30 px-3 py-2">
                  <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-white">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        Dû le {new Date(task.dueDate).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/crm/tasks" className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-primary-400 transition-colors">
            Voir toutes les tâches →
          </Link>
        </div>

        {/* Activités récentes */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-blue-400" />
            <h3 className="font-semibold text-white text-sm">Activités récentes</h3>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Aucune activité récente</p>
          ) : (
            <div className="space-y-2">
              {recentActivities.map(act => (
                <div key={act.id} className="flex items-start gap-2.5 rounded-lg bg-slate-800/40 px-3 py-2">
                  <span className="text-sm shrink-0">{TYPE_ICON[act.type] ?? "📌"}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{act.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {act.contact && <span className="text-xs text-slate-500 flex items-center gap-1"><User size={10} />{act.contact.fullName}</span>}
                      <span className="text-xs text-slate-600">
                        {new Date(act.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/crm/activities" className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-primary-400 transition-colors">
            Voir la timeline →
          </Link>
        </div>
      </div>

      {/* Dossiers récents + stats */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
          <h3 className="font-semibold text-white text-sm mb-4">Dossiers récents</h3>
          {recentCases.length > 0 ? (
            <div className="space-y-2">
              {recentCases.map((caseItem) => (
                <Link key={caseItem.id} href={`/crm/cases/${caseItem.id}`}
                  className="flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-2.5 hover:bg-slate-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{caseItem.title}</p>
                    <p className="text-xs text-slate-500 font-mono">{caseItem.referenceCode}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <StatusBadge value={caseItem.type} />
                    <StatusBadge value={caseItem.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Aucun dossier pour le moment.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-white text-sm">Statistiques</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/crm/invoices" className="rounded-xl border border-primary-600/50 bg-primary-950/30 px-3 py-1.5 text-xs font-medium text-primary-200 hover:bg-primary-900/40 hover:text-white">
                Créer facture CRM
              </Link>
              <Link href="/crm/invoices" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-primary-500/40 hover:text-white">
                Envoyer facture PayPal
              </Link>
              {paypalBillingUrl ? (
                <a href={paypalBillingUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-emerald-600/50 bg-emerald-950/30 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-900/40 hover:text-white">
                  Ouvrir lien PayPal
                </a>
              ) : (
                <span className="rounded-xl border border-amber-700/50 bg-amber-950/20 px-3 py-1.5 text-xs font-medium text-amber-200">
                  Lien PayPal non configuré
                </span>
              )}
              <Link href="/crm/activities" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-primary-500/40 hover:text-white">
                Vérifier paiement PayPal
              </Link>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between rounded-lg bg-slate-800/40 px-3 py-2">
              <span className="text-slate-400">Suivi des dossiers</span>
              <span className="font-semibold text-emerald-400">{openCases}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-800/40 px-3 py-2">
              <span className="text-slate-400">Résolution dossiers</span>
              <span className="font-semibold text-emerald-400">{Math.round((closedCasesCount / Math.max(openCases + closedCasesCount, 1)) * 100)}%</span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-800/40 px-3 py-2">
              <span className="text-slate-400">Factures en attente</span>
              <span className={`font-semibold ${pendingInvoices > 0 ? "text-yellow-400" : "text-emerald-400"}`}>{pendingInvoices}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-800/40 px-3 py-2">
              <span className="text-slate-400">Tâches en retard</span>
              <span className={overdueTasks.length > 0 ? "font-semibold text-red-400" : "font-semibold text-emerald-400"}>{overdueTasks.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="font-semibold text-white text-sm mb-1">Documents rapides</h3>
        <p className="mb-4 text-xs text-slate-400">Importez des pièces liées aux dossiers clients (PDF, Word, images). Max 10 Mo.</p>
        <DashboardUploader />
      </div>
    </section>
  );
}
