from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
import sys
import os
import re
import django
import nltk
from django.db import transaction, connection
from nltk.corpus import stopwords

# Configurer Django
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mygutenberg.settings')
django.setup()

from book.models import Book, Index, ForwardIndex

# Logging
logging.basicConfig(level=logging.INFO)

# Télécharger les ressources nécessaires
nltk.download('stopwords')
nltk.download('punkt')

LANGUAGE_MAPPING = {
    'en': 'english',
    'fr': 'french',
    'es': 'spanish',
    'de': 'german',
    'it': 'italian',
}

def load_stopwords(language):
    nltk_language = LANGUAGE_MAPPING.get(language, 'english')
    return set(stopwords.words(nltk_language)) if nltk_language in stopwords.fileids() else set()

def extract_words_with_positions(text, language='english'):
    stop_words = load_stopwords(language)
    word_positions = {}
    
    for match in re.finditer(r'\b\w+\b', text):
        word = match.group().lower()
        pos = match.start()
        if word not in stop_words:
            word_positions.setdefault(word, []).append(pos)
    return word_positions

def index_book(book):
    if not book.text_content:
        logging.warning(f"Aucun texte pour {book.title} (ID: {book.id})")
        return

    language = book.language.split(',')[0].strip().lower()
    word_positions_map = extract_words_with_positions(book.text_content, language)

    # Créer les entrées pour Index (inversé) et ForwardIndex (direct)
    index_entries = []
    forward_entries = []
    for word, positions in word_positions_map.items():
        index_entries.append(Index(word=word, book=book, occurrences_count=len(positions), positions=positions))
        forward_entries.append(ForwardIndex(book=book, word=word, occurrences_count=len(positions), positions=positions))

    with transaction.atomic():
        Index.objects.bulk_create(index_entries, ignore_conflicts=True)
        ForwardIndex.objects.bulk_create(forward_entries, ignore_conflicts=True)

    connection.close()
    logging.info(f"Indexation du livre '{book.title}' terminée.")

def index_books_concurrently():
    logging.info("Début de l'indexation...")
    books_to_index = Book.objects.filter(text_content__isnull=False)
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(index_book, book): book for book in books_to_index}
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                book = futures[future]
                logging.error(f"Erreur sur {book.title}: {e}")
    logging.info("Indexation terminée.")

if __name__ == "__main__":
    index_books_concurrently()
