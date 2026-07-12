# Déploiement sur Google Cloud Platform

Guide pas à pas à exécuter dans **Cloud Shell** (icône `>_` en haut à droite
de [console.cloud.google.com](https://console.cloud.google.com)). Chaque
bloc est à copier-coller tel quel après avoir renseigné les variables de
l'étape 0.

---

## Étape 0 — Cloner le projet et définir les variables

```bash
git clone https://github.com/Aminezy/techpapy-.git
cd techpapy-

# --- à personnaliser ---
export PROJECT_ID=$(gcloud config get-value project)
export REGION=europe-west1
export DB_PASSWORD="choisis-un-mot-de-passe-fort-ici"
export JWT_ACCESS_SECRET=$(openssl rand -hex 32)
export JWT_REFRESH_SECRET=$(openssl rand -hex 32)

echo "Projet : $PROJECT_ID"
```

## Étape 1 — Activer les services nécessaires

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

## Étape 2 — Créer la base de données (Cloud SQL PostgreSQL)

```bash
gcloud sql instances create techpapy-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password="$DB_PASSWORD"

gcloud sql databases create techpapy --instance=techpapy-db

gcloud sql users create techpapy \
  --instance=techpapy-db \
  --password="$DB_PASSWORD"

export CONNECTION_NAME=$(gcloud sql instances describe techpapy-db --format='value(connectionName)')
echo "Connection name : $CONNECTION_NAME"
```

*(La création de l'instance prend 5 à 10 minutes.)*

## Étape 3 — Créer le dépôt d'images Docker

```bash
gcloud artifacts repositories create techpapy \
  --repository-format=docker \
  --location=$REGION

gcloud auth configure-docker $REGION-docker.pkg.dev
```

## Étape 4 — Construire et déployer l'API

```bash
docker build -f apps/api/Dockerfile \
  -t $REGION-docker.pkg.dev/$PROJECT_ID/techpapy/api:latest .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/techpapy/api:latest

gcloud run deploy techpapy-api \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/techpapy/api:latest \
  --region=$REGION \
  --allow-unauthenticated \
  --session-affinity \
  --add-cloudsql-instances=$CONNECTION_NAME \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=postgresql://techpapy:$DB_PASSWORD@localhost/techpapy?host=/cloudsql/$CONNECTION_NAME,JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET,JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET,ACCESS_TOKEN_TTL=15m,REFRESH_TOKEN_TTL_DAYS=30,CORS_ORIGIN=https://placeholder.temp"

export API_URL=$(gcloud run services describe techpapy-api --region=$REGION --format='value(status.url)')
echo "API déployée : $API_URL"
```

## Étape 5 — Appliquer les migrations de base de données

```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.11.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
./cloud-sql-proxy "$CONNECTION_NAME" &
sleep 5

cd apps/api
npm install
DATABASE_URL="postgresql://techpapy:$DB_PASSWORD@localhost:5432/techpapy" \
  npx prisma migrate deploy --schema prisma/schema.prisma
cd ../..

kill %1   # arrête le proxy Cloud SQL
```

## Étape 6 — Construire et déployer le frontend

```bash
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=$API_URL \
  -t $REGION-docker.pkg.dev/$PROJECT_ID/techpapy/web:latest .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/techpapy/web:latest

gcloud run deploy techpapy-web \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/techpapy/web:latest \
  --region=$REGION \
  --allow-unauthenticated

export WEB_URL=$(gcloud run services describe techpapy-web --region=$REGION --format='value(status.url)')
echo "Frontend déployé : $WEB_URL"
```

## Étape 7 — Reconnecter l'API au vrai domaine du frontend (CORS)

```bash
gcloud run services update techpapy-api \
  --region=$REGION \
  --update-env-vars="CORS_ORIGIN=$WEB_URL"
```

**À ce stade, l'app est en ligne et en HTTPS** (URL du type
`https://techpapy-web-xxxxx-ew.a.run.app`), sans nom de domaine personnalisé.

---

## Étape 8 — Brancher ton nom de domaine (une fois acheté)

```bash
gcloud run domain-mappings create \
  --service=techpapy-web \
  --domain=www.tondomaine.fr \
  --region=$REGION
```

La commande affiche les enregistrements DNS à créer (généralement un
**CNAME** pointant vers `ghs.googlehosted.com`). Va chez ton registrar
(Namecheap, OVH, Porkbun...) et ajoute cet enregistrement dans la zone DNS
de ton domaine. Le certificat HTTPS est généré automatiquement par Google
une fois le DNS propagé (quelques minutes à quelques heures).

Pense aussi à mettre à jour `CORS_ORIGIN` sur l'API avec la nouvelle URL du
domaine (même commande qu'à l'étape 7).

---

## Vérifier que tout fonctionne

```bash
curl $API_URL/health
```

Puis ouvre `$WEB_URL` (ou ton domaine) dans un navigateur et teste
l'inscription/connexion.
