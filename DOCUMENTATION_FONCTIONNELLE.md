# Documentation fonctionnelle — TechPapy

## Sommaire

1. [Présentation](#1-présentation)
2. [Public cible et rôles](#2-public-cible-et-rôles)
3. [Parcours utilisateur](#3-parcours-utilisateur)
4. [Fonctionnalités](#4-fonctionnalités)
5. [Périmètre non couvert](#5-périmètre-non-couvert)

---

## 1. Présentation

**TechPapy** est une plateforme d'échange de compétences intergénérationnel :
elle met en relation des jeunes et des seniors autour d'un principe simple —
chacun a un savoir à transmettre et un besoin d'aide.

**Mission :** lutter contre l'isolement et favoriser la transmission de
savoirs entre générations, quel que soit le domaine (numérique, bricolage,
cuisine, langues, etc.).

**Modèle d'échange :** une heure de compétence transmise équivaut à un point
d'échange. Ces points ne se dépensent pas — ils mesurent la contribution de
chacun à la communauté.

## 2. Public cible et rôles

| Rôle | Description |
|---|---|
| **Utilisateur (USER)** | Peut créer un profil, déclarer des compétences, être mis en relation, planifier des sessions, cumuler des points. |
| **Administrateur (ADMIN)** | Accès en plus aux journaux d'audit et à la liste des utilisateurs (modération, supervision). |

## 3. Parcours utilisateur

1. **Inscription** — création de compte (nom, email, mot de passe)
2. **Déclaration de compétences** — l'utilisateur indique ce qu'il **offre**
   (ex. "Excel") et ce qu'il **recherche** (ex. "Cuisine")
3. **Découverte de la communauté** — parcourir les compétences proposées ou
   recherchées par les autres membres
4. **Mise en relation ("matching")** — proposer un échange à un autre membre
   à partir d'une compétence qui l'intéresse
5. **Planification d'une session** — choisir une date/heure pour l'échange
6. **Session en visioconférence** — rejoindre l'appel vidéo intégré au moment
   convenu
7. **Clôture de la session** — une fois la session terminée, chaque
   participant reçoit un point d'échange
8. **Suivi** — consultation du tableau de bord : points cumulés, sessions à
   venir, historique

## 4. Fonctionnalités

### 4.1 Gestion des compétences
Ajouter, consulter et supprimer ses compétences, classées en deux
catégories : **offertes** et **recherchées**.

### 4.2 Matching
Parcourir les compétences proposées par la communauté et initier une mise
en relation avec un autre membre.

### 4.3 Sessions et calendrier
Planifier une session avec un membre déjà mis en relation, à une date et
heure choisies. Une session peut être marquée comme terminée.

### 4.4 Points d'échange
Chaque session terminée crédite un point à chacun des deux participants.
Un historique détaillé (date, raison) est consultable à tout moment.

### 4.5 Visioconférence intégrée
Chaque session dispose d'un lien direct vers un appel vidéo intégré à la
plateforme (caméra, micro, coupure du son/image, fin d'appel) — aucune
application tierce à installer.

### 4.6 Tableau de bord
Vue d'ensemble personnelle : points cumulés, nombre de sessions à venir,
badges obtenus, gestion des compétences, communauté et matchs, historique
des points.

## 5. Périmètre non couvert

À ce stade du projet, deux fonctionnalités prévues au cahier des charges
ne sont pas encore livrées :

- **Base de connaissances collaborative** (FAQ, tutoriels partagés)
- **Badges de progression** (attribution automatique selon l'activité)

Le détail technique de ce qui est livré ou non se trouve dans la
[documentation technique](DOCUMENTATION_TECHNIQUE.md).
