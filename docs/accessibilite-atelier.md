# Checklist UX - Atelier (mobile et personnes agees)

## Objectif
Rendre le parcours atelier clair, lisible et simple sur telephone, y compris pour des personnes peu habituees au numerique.

## Regles UI
- Boutons principaux: hauteur minimale `56px` (ideal `64px`), libelles explicites.
- Contraste texte/fond: viser au minimum WCAG AA (`4.5:1` pour texte normal).
- Taille de police: minimum `16px` pour contenu principal sur mobile.
- Une action principale par ecran: `Choisir mon rendez-vous`.
- Textes courts: phrases simples, sans jargon technique.
- Formulaire en sections: type dossier, contact, atelier, prix, notes.
- Labels explicites: pas d'abreviations ambiguës.
- Erreurs humaines: message clair et action concrete (ex: "Le titre est obligatoire").
- CTA visible: bouton principal fixe en bas dans le formulaire admin atelier.

## Verification mobile
- Tester largeur `320px`, `375px`, `390px`.
- Verifier que chaque champ reste lisible sans zoom.
- Verifier que les CTA restent accessibles sans scroll excessif.
- Verifier les liens tel/mail/Google Calendar sur smartphone reel.

## Parcours simplifie
1. Admin ouvre `Creer un atelier`.
2. Remplit les sections dans l'ordre.
3. Sauvegarde.
4. Copie le lien client et le lien de planification.
5. Client ouvre la page atelier, clique `Choisir mon rendez-vous`.

## Test utilisateur recommande
- Tester avec une personne peu a l'aise avec le numerique.
- Observer sans guider pendant 5 minutes.
- Noter les blocages: comprehension, lecture, clic, validation.
- Corriger en priorite les points qui bloquent la prise de rendez-vous.
