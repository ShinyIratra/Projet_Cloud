explqiue moi ce que ces guide veut qu'on fasse, on est un groupe de 3 personnes"


Module Authentification
• Ci-dessous les fonctionnalités minimales
– Durée de vie des sessions
– Limite des nombres ( paramétrable, par défaut 3 ) 
de tentatives de connexion pour un compte
• Un API REST peut réinitialiser le blocage pour un 
utilisateur donné 
– Documentation API via Swagger

Module Cartes
• Installer un serveur de carte Offline sur Docker
• Télécharger la ville d’Antananarivo avec les 
rues
• Utiliser leaflet pour afficher/manipuler la carte 
dans l’application web

Module Web
• C’est une application qui permet de signaler et 
de suivre les travaux routiers sur la ville 
d’Antananarivo

Module Web
• Utiliser l’API Rest Authentification pour se 
logguer et créer un compte
• 3 profils
– Visiteur (sans compte)
– Utilisateur ( création de compte )
– Manager (compte à créer par défaut )

Module Web
• Visiteurs
– Voir la carte avec les différents points 
représentants les problèmes routiers

Module Web
• Visiteurs
– Lorsqu’on survole un point, on doit voir les infos 
sur le problème ( date, status (nouveau, en cours, 
terminé), surface en m2, budget, entreprise 
concerné)
– Voir le tableau de récapitulation actuel ( Nb de 
point, total surface, avancement en %, total 
budget)

Module Web
• Manager
– Bouton synchronisation
• Récupérer les signalements en ligne (firebase)
• Envoi les données nécessaires en ligne (firebase) pour 
un affichage sur mobile
– gestion des infos nécessaires sur chaque 
signalement (surface en m2, budget, entreprise 
concerné, ...)
– Modifier les statuts de chaque signalement

Module Mobile
• Utilisateurs 
– Se loguer sur firebase en ligne
– Signaler les problèmes routiers à partir du map 
(utiliser leaflet et openstreetmap en ligne)
• Localisation 
– Afficher la carte et recap (cf fonctionnalités 
visiteurs)
– Mettre un filtre : afficher mes signalements 
uniquement

Notes
• Fonctionnalités
• Code
– Dans github ou gitlab public
• Design
• Suivi des taches
• APK pour mobile
• Documentation technique
• Aléa possible

Contenu Documentation Technique 
• Projet
– Mettre le MCD
– Présenter les scénarios d’utilisations avec copie d’
écrans
• Liste des membres
– Nom et prénoms et NumETU
