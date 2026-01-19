## si vous voulez essayer de zero :
initialiser le projet en creant un dossier de votre choix 
 - ouvrir dans le terminal et taper : npm init -y
 - puis :  npm install express cors body-parser dotenv axios firebase-admin

La web api key est dans le .env et la clé privée firebase dans le fichier ServiceAccountKey.json (à ne pas mettre dans github)

pour faire marcher le server faire : node index.js 

et testez sur postman sur les URL : POST  http://localhost:3000/api/register et  http://localhost:3000/api/login