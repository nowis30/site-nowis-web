/**
 * Page de Confidentialité / Loi 25
 * Politique de protection des renseignements personnels conforme à la Loi 25
 */

'use client';

import React from 'react';
import Link from 'next/link';

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white py-20">
          <div className="max-w-4xl mx-auto px-6">
            
            {/* En-tête */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Politique de confidentialité
              </h1>
              <p className="text-xl text-gray-600">
                Conforme à la <strong>Loi 25</strong> sur la protection des renseignements personnels au Québec
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Dernière mise à jour : 12 décembre 2025
              </p>
            </div>

            {/* Contenu principal */}
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-card border border-gray-100 space-y-8 text-gray-700 leading-relaxed">
              
              {/* Section 1 */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  1. Introduction
                </h2>
                <p>
                  <strong>Création NOWIS</strong> (ci-après « nous » ou « notre ») s'engage à protéger la confidentialité et la sécurité de vos renseignements personnels conformément à la <strong>Loi 25</strong> (Loi modernisant des dispositions législatives en matière de protection des renseignements personnels) en vigueur au Québec.
                </p>
                <p className="mt-3">
                  Cette politique explique quels renseignements nous collectons, comment nous les utilisons, et vos droits concernant vos données personnelles.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  2. Renseignements que nous collectons
                </h2>
                <p>
                  Nous collectons uniquement les renseignements personnels nécessaires à la fourniture de nos services créatifs. Cela peut inclure :
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li><strong>Nom complet</strong> et coordonnées (courriel, téléphone)</li>
                  <li><strong>Informations sur votre projet</strong> (description, besoins, préférences)</li>
                  <li><strong>Données de navigation</strong> (adresse IP, cookies) si vous utilisez notre site web</li>
                  <li><strong>Historique de communication</strong> (messages, appels, rendez-vous)</li>
                </ul>
                <p className="mt-3">
                  Nous ne collectons <strong>jamais</strong> de renseignements sensibles (origine ethnique, religion, orientation sexuelle, santé) sauf si vous nous les fournissez volontairement dans le cadre d'un projet spécifique et avec votre consentement explicite.
                </p>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  3. Utilisation de vos renseignements
                </h2>
                <p>
                  Vos renseignements personnels sont utilisés pour :
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>Vous contacter et répondre à vos demandes de projet</li>
                  <li>Fournir nos services créatifs (vidéos, chansons, publicités, sites web, etc.)</li>
                  <li>Gérer les rendez-vous et planifications (via Cal.com ou autre outil)</li>
                  <li>Améliorer notre site web et nos services</li>
                  <li>Respecter nos obligations légales et contractuelles</li>
                </ul>
                <p className="mt-3">
                  Nous <strong>ne vendons ni ne louons</strong> vos renseignements personnels à des tiers. Nous ne partageons vos données qu'avec des partenaires de confiance (ex. : plateformes de paiement, hébergement web) dans le strict respect de la Loi 25.
                </p>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  4. Consentement
                </h2>
                <p>
                  En nous transmettant vos renseignements personnels via notre formulaire de contact, par courriel ou lors d'un appel, vous consentez à ce que nous les utilisions aux fins décrites dans cette politique.
                </p>
                <p className="mt-3">
                  Vous pouvez <strong>retirer votre consentement</strong> à tout moment en nous contactant (voir section 8). Toutefois, cela pourrait limiter notre capacité à vous fournir certains services.
                </p>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  5. Conservation et sécurité
                </h2>
                <p>
                  Vos renseignements personnels sont conservés aussi longtemps que nécessaire pour :
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>Fournir nos services et maintenir notre relation d'affaires</li>
                  <li>Respecter nos obligations légales (ex. : comptabilité, contrats)</li>
                </ul>
                <p className="mt-3">
                  Nous mettons en place des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, perte ou divulgation accidentelle. Cela inclut :
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>Chiffrement des communications (HTTPS)</li>
                  <li>Accès restreint aux données (seules les personnes autorisées y ont accès)</li>
                  <li>Sauvegardes régulières et sécurisées</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  6. Vos droits (Loi 25)
                </h2>
                <p>
                  Conformément à la Loi 25, vous avez les droits suivants concernant vos renseignements personnels :
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>
                    <strong>Droit d'accès :</strong> Vous pouvez demander une copie des renseignements que nous détenons sur vous.
                  </li>
                  <li>
                    <strong>Droit de rectification :</strong> Vous pouvez demander la correction de renseignements inexacts ou incomplets.
                  </li>
                  <li>
                    <strong>Droit à l'effacement :</strong> Vous pouvez demander la suppression de vos données dans certaines circonstances (ex. : consentement retiré, données obsolètes).
                  </li>
                  <li>
                    <strong>Droit à la portabilité :</strong> Vous pouvez demander que vos données vous soient transmises dans un format structuré et couramment utilisé.
                  </li>
                  <li>
                    <strong>Droit de retirer votre consentement :</strong> Vous pouvez retirer votre consentement à tout moment.
                  </li>
                  <li>
                    <strong>Droit de déposer une plainte :</strong> Vous pouvez déposer une plainte auprès de la Commission d'accès à l'information du Québec (CAI) si vous estimez que vos droits n'ont pas été respectés.
                  </li>
                </ul>
                <p className="mt-3">
                  Pour exercer l'un de ces droits, contactez-nous via les coordonnées fournies à la section 8.
                </p>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Cookies et technologies similaires
                </h2>
                <p>
                  Notre site web utilise des cookies et des technologies similaires pour améliorer votre expérience de navigation. Les cookies sont de petits fichiers texte stockés sur votre appareil qui nous aident à :
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>Analyser le trafic et l'utilisation du site (Google Analytics, si activé)</li>
                  <li>Mémoriser vos préférences</li>
                  <li>Sécuriser votre navigation</li>
                </ul>
                <p className="mt-3">
                  Vous pouvez désactiver les cookies via les paramètres de votre navigateur, mais cela pourrait affecter certaines fonctionnalités du site.
                </p>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  8. Nous contacter
                </h2>
                <p>
                  Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits en vertu de la Loi 25, contactez-nous :
                </p>
                <div className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2">Création NOWIS</p>
                  <p className="text-gray-700">
                    📧 <a href="mailto:simonmorin@nowis.store" className="text-primary-600 hover:underline">simonmorin@nowis.store</a>
                  </p>
                  <p className="text-gray-700">
                    📞 <a href="tel:+18193883407" className="text-primary-600 hover:underline">(819) 388-3407</a>
                  </p>
                  <p className="text-gray-700 mt-2">
                    📍 Basé au Québec, Canada
                  </p>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Nous nous engageons à répondre à vos demandes dans un délai raisonnable, conformément aux exigences de la Loi 25.
                </p>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  9. Modifications de cette politique
                </h2>
                <p>
                  Nous pouvons mettre à jour cette politique de confidentialité de temps à autre pour refléter les changements dans nos pratiques ou les exigences légales. La version la plus récente sera toujours disponible sur cette page, avec la date de mise à jour indiquée en haut.
                </p>
                <p className="mt-3">
                  Nous vous encourageons à consulter cette page régulièrement pour rester informé de nos pratiques en matière de protection des renseignements personnels.
                </p>
              </section>

            </div>

            {/* CTA retour */}
            <div className="text-center mt-12">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour à l'accueil
              </Link>
            </div>

          </div>
    </div>
  );
}
