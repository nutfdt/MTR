from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import sys
import requests
import django
import logging
import time
from tqdm import tqdm
from django.db import transaction
from requests.exceptions import RequestException, ConnectionError, Timeout
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logging.basicConfig(level=logging.INFO)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mygutenberg.settings')
django.setup()

from book.models import Book, Author

# Configuration de la session avec retry automatique
session = requests.Session()
retry_strategy = Retry(
    total=3,
    backoff_factor=2,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET"]
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session.mount("http://", adapter)
session.mount("https://", adapter)

MAX_RETRIES = 5  # Réduire le nombre de tentatives
BACKOFF_FACTOR = 2  # Facteur de backoff exponentiel (attente doublée à chaque tentative)
TIMEOUT = 30  # Réduire le timeout initial en secondes

def make_api_request(url, max_retries=3):
    """Faire une requête API avec gestion d'erreur et retry"""
    for attempt in range(max_retries):
        try:
            logging.info(f"Tentative {attempt + 1}/{max_retries} pour : {url}")
            response = session.get(url, timeout=TIMEOUT)
            if response.status_code == 200:
                return response
            else:
                logging.warning(f"Status code {response.status_code} pour {url}")
                
        except (RequestException, ConnectionError, Timeout) as e:
            wait_time = min(60, BACKOFF_FACTOR ** (attempt + 1))  # Max 60s d'attente
            logging.error(f"Erreur requête (tentative {attempt + 1}/{max_retries}): {e}")
            
            if attempt < max_retries - 1:  # Ne pas attendre à la dernière tentative
                logging.info(f"Nouvelle tentative dans {wait_time}s...")
                time.sleep(wait_time)
            
    logging.error(f"Échec de la requête après {max_retries} tentatives : {url}")
    return None

def fetch_book_text(book_data):
    text_url = None
    possible_formats = ['text/plain', 'text/plain; charset=utf-8', 'text/plain; charset=iso-8859-1', 'text/plain; charset=us-ascii']

    for fmt in possible_formats:
        if fmt in book_data['formats']:
            text_url = book_data['formats'][fmt]
            break

    if not text_url:
        logging.warning(f"Aucun texte disponible pour le livre ID {book_data['id']}.")
        return None, 0

    response = make_api_request(text_url, max_retries=3)
    if response:
        text_content = response.text.strip()
        if not text_content:
            logging.warning(f"Le livre ID {book_data['id']} semble vide.")
            return None, 0
        word_count = len(text_content.split())
        return text_content[:100000], word_count
    
    logging.error(f"Échec du téléchargement du livre {book_data['id']}.")
    return None, 0


def process_book(book_data):
    try:
        book_text, word_count = fetch_book_text(book_data)

        if not book_text or word_count < 10000:
            logging.info(f"Livre ignoré : {book_data['title']} (ID: {book_data['id']}), {word_count} mots.")
            return None

        with transaction.atomic():
            book, created = Book.objects.get_or_create(
                id=book_data['id'],
                defaults={  # Defaults pour un nouveau livre
                    'title': book_data['title'],
                    'language': ', '.join(book_data['languages']),
                    'description': book_data.get('summaries', [''])[0] if book_data.get('summaries') else '',
                    'subjects': ', '.join(book_data.get('subjects', [])),
                    'bookshelves': ', '.join(book_data.get('bookshelves', [])),
                    'cover_image': book_data['formats'].get('image/jpeg', ''),
                    'download_count': book_data['download_count'],
                    'copyright': book_data.get('copyright', False),
                    'text_content': book_text
                }
            )

            if created:
                logging.info(f"Livre importé : {book.title} (ID: {book.id}) - {word_count} mots.")

            for author_data in book_data.get('authors', []):
                author, _ = Author.objects.get_or_create(
                    name=author_data['name'],
                    defaults={
                        'birth_year': author_data.get('birth_year'),
                        'death_year': author_data.get('death_year')
                    }
                )
                book.authors.add(author)

        return book

    except Exception as e:
        logging.error(f"Erreur lors de l'insertion du livre ID {book_data['id']}: {e}")
        return None

def fetch_and_insert_books(max_books=50, workers=2):
    logging.info("Début de l'importation des livres...")
    url = "https://gutendex.com/books/"
    total_books_fetched = 0
    
    # Requête initiale avec retry
    response = make_api_request(url)
    if not response:
        logging.error("Impossible de récupérer la première page de l'API.")
        return
        
    data = response.json()
    total_books_to_fetch = data.get('count', 0)
    logging.info(f"Total de livres disponibles : {total_books_to_fetch}")

    with tqdm(total=min(total_books_to_fetch, max_books), desc="Importing books") as pbar:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            while url and total_books_fetched < max_books:
                logging.info(f"Récupération des livres depuis {url}")
                
                # Utiliser la fonction avec retry
                response = make_api_request(url)
                if not response:
                    logging.error(f"Échec de récupération de la page : {url}")
                    break

                data = response.json()
                books_data = data.get('results', [])

                # Traitement des livres de cette page
                futures = {executor.submit(process_book, book_data): book_data for book_data in books_data}

                # Attendre que chaque future se termine
                for future in as_completed(futures):
                    try:
                        book = future.result()
                        if book:
                            pbar.update(1)
                            total_books_fetched += 1
                    except Exception as e:
                        logging.error(f"Erreur lors du traitement d'un livre : {e}")

                url = data.get('next')
                logging.info(f"URL suivante : {url}")
                logging.info(f"Livres récupérés jusqu'ici : {total_books_fetched}")
                
                # Pause plus longue entre les pages
                if url:
                    logging.info("Pause de 5 secondes avant la page suivante...")
                    time.sleep(5)

    logging.info(f"Importation terminée. Total de livres traités : {total_books_fetched}")


# Réduire considérablement le nombre de livres et de workers pour tester
fetch_and_insert_books(max_books=100, workers=2)  # Commencer avec moins de livres et moins de workers