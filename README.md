# MTR — My Academic Search

## Description

Projet full‑stack pour la recherche et l'exploration de livres (backend Django + API REST, frontend React + TypeScript). Fournit des endpoints de recherche (simple, avancée, mise en évidence) et une interface utilisateur pour parcourir et lire des livres.

---

## Table des matières

- Prérequis
- Installation & démarrage (Backend)
- Installation & démarrage (Frontend)
- Endpoints API
- Dépannage rapide

---

## Prérequis

- Python 3.11 (64 bits recommandé)
- Node.js (v18+) et npm
- Docker & docker-compose (pour Postgres en local) — optionnel mais recommandé
- Git

---

## Backend — Mise en place (local)

1. Cloner le repo et se placer dans le dossier du projet.

2. Créer et activer un environnement virtuel depuis le dossier `Backend` :

   - PowerShell & CMD (Windows) :
     ```powershell
     cd Backend
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - Bash (Linux/macOS) :
     ```bash
     python -m venv venv
     source venv/bin/activate
     ```

3. Mettre à jour pip et installer les dépendances :

   ```bash
   python -m pip install --upgrade pip setuptools wheel
   pip install -r requirements.txt
   ```

   Note : si l'installation de `scipy` échoue (wheel manquant), mettre à jour `pip`/`wheel` et retenter. Sur Windows, assurez‑vous d'utiliser un Python 64 bits.

4. Base de données (Postgres) :

   - Option rapide : lancer Postgres avec Docker (depuis la racine ou `Backend` si `docker-compose.yml` s'y trouve) :
     ```bash
     docker-compose up -d
     ```

Configuration : les variables d'environnement importantes (définies dans `docker-compose.yml` ou un fichier `.env`) incluent `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_HOST` et `DB_PORT`. Par défaut, Django tourne sur le port `8000` (`http://localhost:8000`) et le frontend sur `5173` (`npm run dev`).

5. Appliquer les migrations :

   ```bash
   python manage.py migrate
   ```

6. Récupération de données

    ```bash
   python Scripts/fetch_books.py    # Récupère les livres d'un minimum de 10 000 mots
   python Scripts/fetch_index.py    # Construit les index pour la recherche plein‑texte
   python Scripts/fetch_inverse.py  # Génére l'index inversé pour la recherche par mot
   ```

Exécuter les scripts depuis le répertoire `Backend` avec le venv activé.

Remarque : `fetch_books` applique un filtrage des stop‑words (the, and, …). `fetch_index` est optionnel si les index ont déjà été générés.

7. Démarrer le serveur Django :

   ```bash
   python manage.py runserver
   ```

8. Tests backend :

   ```bash
   python manage.py test
   ```

---

## Frontend — Mise en place

1. Se placer dans le dossier `frontend` :

   ```bash
   cd frontend
   npm install
   ```


2. Lancer le serveur de dev :

   ```bash
   npm run dev
   ```


---

## Endpoints API (résumé)

Base : `http://<HOST>:<PORT>/api/`

- GET `/api/books/` — Liste paginée des livres (params : `page`, `page_size`)
- GET `/api/books/<id>/` — Détail d'un livre
- GET `/api/books/search/?q=<query>&page=<n>&page_size=<m>` — Recherche simple par mot‑clé
- GET `/api/books/advanced-search/?q=<query>&page=<n>&page_size=<m>` — Recherche avancée (regex, contenu)
- GET `/api/books/highlight-search/?q=<query>&page=<n>&page_size=<m>` — Recherche avec positions / mise en évidence
- GET `/api/authors/` — Liste des auteurs
- GET `/api/authors/<id>/` — Détail d'un auteur

Paramètres courants : `q`, `page`, `page_size`, `author` (filtrage côté API)

Exemples rapides :
- Recherche simple :
  ```bash
  curl "http://localhost:8000/api/books/search/?q=poe&page=1&page_size=10"
  ```
- Récupérer un livre par ID :
  ```bash
  curl "http://localhost:8000/api/books/123/"
  ```

---

## Dépannage rapide

- Erreur `ModuleNotFoundError: No module named 'scipy'` :
  - Assurez‑vous d'avoir installé les dépendances dans le venv actif :
    ```bash
    python -m pip install --upgrade pip setuptools wheel
    pip install -r requirements.txt
    ```
  - Sur Windows, installez un Python 64 bits et réessayez.

- Erreurs de connexion à la DB : vérifier que Postgres (docker) est bien up (`docker ps`) et que les variables d'environnement correspondent aux valeurs de `docker-compose.yml`.


© Projet MTR — 2026 (CFA INSTA)