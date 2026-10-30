import Link from 'next/link';
import { principalCrmUrl } from '@/lib/principal-crm';
import { ArrowUpRight, Building2, CalendarDays, FileText, KeyRound, Users, Wrench } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { immobilierInquiryUrl } from '@/lib/immobilier-service';
import styles from './immobilier.module.css';

export const metadata = buildMetadata({
  title: 'NOWIS Immobilier | Le bureau des gestionnaires immobiliers',
  description: 'Découvrez NOWIS Immobilier : immeubles, baux, loyers, documents et suivis pour votre entreprise de gestion. Mise en route accompagnée et accès sur invitation.',
  path: '/immobilier',
});

const tools = [
  { icon: Building2, title: 'Votre parc immobilier', detail: 'Immeubles, logements, propriétaires et locataires réunis dans le même espace.' },
  { icon: FileText, title: 'Baux et documents', detail: 'Retrouvez les dossiers et les pièces qui accompagnent chaque logement.' },
  { icon: KeyRound, title: 'Loyers et finances', detail: 'Suivez les loyers, les paiements saisis, les dépenses et les pièces comptables.' },
  { icon: Wrench, title: 'Demandes et interventions', detail: 'Organisez les demandes d’entretien et le travail de vos intervenants.' },
  { icon: CalendarDays, title: 'Le travail de la journée', detail: 'Gardez vos tâches, vos échéances et vos suivis à portée de main.' },
  { icon: Users, title: 'Une équipe bien organisée', detail: 'Accordez à chaque personne les accès nécessaires à son rôle.' },
];

export default function ImmobilierPage() {
  return <div className={styles.page}>
    <section className={styles.hero} aria-labelledby="immobilier-title">
      <div className={styles.intro}>
        <p className={styles.eyebrow}>NOWIS IMMOBILIER · POUR LES GESTIONNAIRES</p>
        <h1 id="immobilier-title">Vos immeubles.<br />Votre équipe.<br /><em>Un même bureau.</em></h1>
        <p className={styles.lead}>Un logiciel de gestion immobilière pour retrouver vos dossiers, organiser les suivis et travailler ensemble, dans l’espace de votre entreprise.</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href={immobilierInquiryUrl}>Demander une démonstration<ArrowUpRight size={19} aria-hidden="true" /></Link>
          <a className={styles.secondary} href={principalCrmUrl} referrerPolicy="no-referrer">Accéder au CRM principal</a>
        </div>
        <p className={styles.caption}>Accès sur invitation · Mise en route accompagnée</p>
      </div>
      <div className={styles.preview} aria-label="Illustration de l’organisation du CRM, données de démonstration">
        <div className={styles.previewHead}><span>NOWIS <strong>Immobilier</strong></span><span className={styles.demoBadge}>Aperçu fictif</span></div>
        <div className={styles.previewBody}>
          <p className={styles.miniLabel}>VOTRE ESPACE DE TRAVAIL</p><h2>Une journée bien organisée.</h2>
          <div className={styles.previewGrid}><div><Building2 size={22} /><strong>Mes immeubles</strong><span>Logements et dossiers</span></div><div><CalendarDays size={22} /><strong>Ma journée</strong><span>Tâches et échéances</span></div></div>
          <p className={styles.miniLabel}>À RETROUVER AU MÊME ENDROIT</p>
          <div className={styles.previewRow}><span className={styles.dot} /><span>Demande d’entretien</span><span>À suivre</span></div>
          <div className={styles.previewRow}><span className={styles.dot} /><span>Documents d’un logement</span><span>À consulter</span></div>
          <div className={styles.previewRow}><span className={styles.dot} /><span>Échéances de la semaine</span><span>À planifier</span></div>
        </div>
      </div>
    </section>
    <section className={styles.tools} aria-labelledby="tools-title"><div className={styles.sectionHeading}><p className={styles.eyebrow}>LE QUOTIDIEN, AU MÊME ENDROIT</p><h2 id="tools-title">Moins de dossiers éparpillés.<br />Plus de clarté pour votre équipe.</h2></div>
      <div className={styles.toolGrid}>{tools.map(({ icon: Icon, title, detail }) => <article key={title}><Icon size={25} aria-hidden="true" /><h3>{title}</h3><p>{detail}</p></article>)}</div>
    </section>
    <section className={styles.privacy} aria-labelledby="privacy-title"><div><p className={styles.eyebrow}>VOTRE ENTREPRISE, VOTRE ESPACE</p><h2 id="privacy-title">Chacun retrouve<br />les dossiers qui le concernent.</h2></div><div><p>Votre entreprise dispose de son propre portefeuille. Les accès des gestionnaires, des collaborateurs, des propriétaires et des locataires sont accordés selon leur rôle.</p><p>La mise en route commence avec un espace vide. Vos immeubles et vos documents y sont ajoutés selon les modalités convenues avec vous.</p></div></section>
    <section id="mise-en-route" className={styles.start} aria-labelledby="start-title"><p className={styles.eyebrow}>ON COMMENCE PAR VOTRE RÉALITÉ</p><h2 id="start-title">Une mise en route accompagnée.</h2><ol className={styles.steps}><li><span>01</span><h3>Parlons de vos besoins</h3><p>Votre entreprise, votre parc de logements et votre façon de travailler.</p></li><li><span>02</span><h3>Découvrons le logiciel</h3><p>Une démonstration pour parcourir les fonctions utiles à votre équipe.</p></li><li><span>03</span><h3>Préparons votre espace</h3><p>Les accès, l’accompagnement et le tarif sont convenus avant l’activation.</p></li></ol><div className={styles.contactBox}><div><h3>Prêt à découvrir NOWIS Immobilier?</h3><p>Une première demande, sans engagement de paiement.</p></div><Link className={styles.primary} href={immobilierInquiryUrl}>Parler de mon entreprise<ArrowUpRight size={19} aria-hidden="true" /></Link></div></section>
  </div>;
}
