from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
import sys
import os
import re
import django
import nltk
import math
from django.db import transaction, connection
from django.db.models import Count, Sum
from django.db import models
from nltk.corpus import stopwords
from collections import Counter

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
    """Extrait les mots et leurs positions, filtre les stopwords"""
    stop_words = load_stopwords(language)
    word_positions = {}
    
    for match in re.finditer(r'\b\w+\b', text):
        word = match.group().lower()
        pos = match.start()
        if word not in stop_words and len(word) > 2:  # Ignorer les mots très courts
            word_positions.setdefault(word, []).append(pos)
    return word_positions

def calculate_tf_idf_for_corpus():
    """Calcule le TF-IDF pour tous les livres dans le corpus"""
    logging.info("Début du calcul TF-IDF pour le corpus...")
    
    # Nettoyer les anciennes données
    logging.info("Nettoyage des anciennes données...")
    Index.objects.all().delete()
    ForwardIndex.objects.all().delete()
    
    # Récupérer tous les livres avec du contenu
    books_with_content = list(Book.objects.filter(text_content__isnull=False))
    total_books = len(books_with_content)
    
    if total_books == 0:
        logging.warning("Aucun livre avec contenu trouvé !")
        return
    
    logging.info(f"Traitement de {total_books} livres...")
    
    # Étape 1: Extraire tous les mots de tous les livres
    logging.info("Étape 1: Extraction des mots de tous les livres...")
    all_book_words = {}  # {book_id: {word: count, ...}, ...}
    all_words_doc_frequency = Counter()  # Compteur de documents contenant chaque mot
    
    for book in books_with_content:
        language = book.language.split(',')[0].strip().lower()
        word_positions_map = extract_words_with_positions(book.text_content, language)
        
        # Stocker les mots du livre
        all_book_words[book.id] = {word: len(positions) for word, positions in word_positions_map.items()}
        
        # Incrémenter le compteur de fréquence documentaire
        for word in word_positions_map.keys():
            all_words_doc_frequency[word] += 1
        
        logging.info(f"Livre traité: {book.title} ({len(word_positions_map)} mots uniques)")
    
    logging.info(f"Total de {len(all_words_doc_frequency)} mots uniques dans le corpus")
    
    # Étape 2: Calculer TF-IDF pour chaque livre
    logging.info("Étape 2: Calcul du TF-IDF...")
    
    for book in books_with_content:
        book_words = all_book_words[book.id]
        total_words_in_book = sum(book_words.values())
        
        if total_words_in_book == 0:
            continue
        
        language = book.language.split(',')[0].strip().lower()
        word_positions_map = extract_words_with_positions(book.text_content, language)
        
        index_entries = []
        forward_index_entries = []
        
        for word, positions in word_positions_map.items():
            # Calcul TF (Term Frequency)
            tf = len(positions) / total_words_in_book
            
            # Calcul IDF (Inverse Document Frequency)
            documents_containing_word = all_words_doc_frequency[word]
            idf = math.log(total_books / documents_containing_word)
            
            # Calcul TF-IDF
            tf_idf = tf * idf
            
            # Créer les entrées d'index
            index_entries.append(Index(
                word=word,
                book=book,
                occurrences_count=len(positions),
                positions=positions
            ))
            
            forward_index_entries.append(ForwardIndex(
                book=book,
                word=word,
                occurrences_count=len(positions),
                positions=positions,
                tf=tf,
                idf=idf,
                tfidf=tf_idf
            ))
        
        # Sauvegarder par lots pour éviter les problèmes de mémoire
        try:
            with transaction.atomic():
                Index.objects.bulk_create(index_entries, ignore_conflicts=True)
                ForwardIndex.objects.bulk_create(forward_index_entries, ignore_conflicts=True)
            
            logging.info(f"TF-IDF calculé pour '{book.title}' ({len(forward_index_entries)} termes)")
            
        except Exception as e:
            logging.error(f"Erreur lors de la sauvegarde du livre '{book.title}': {e}")
            continue
    
    connection.close()
    logging.info("Calcul TF-IDF terminé pour tout le corpus.")

def recompute_tfidf_for_existing_data():
    """Recalcule le TF-IDF pour les données existantes sans réindexer"""
    logging.info("Recalcul du TF-IDF pour les données existantes...")
    
    # Compter le nombre total de documents
    total_books = Book.objects.filter(text_content__isnull=False).count()
    
    if total_books == 0:
        logging.warning("Aucun livre trouvé !")
        return
    
    # Calculer la fréquence documentaire (DF) pour chaque mot
    logging.info("Calcul de la fréquence documentaire...")
    word_document_frequencies = {}
    
    # Compter dans combien de documents chaque mot apparaît
    for word_stats in Index.objects.values('word').annotate(doc_count=Count('book', distinct=True)):
        word_document_frequencies[word_stats['word']] = word_stats['doc_count']
    
    logging.info(f"Fréquence documentaire calculée pour {len(word_document_frequencies)} mots")
    
    # Mettre à jour les scores TF-IDF par livre
    books_with_forward_index = Book.objects.filter(forwardindex__isnull=False).distinct()
    
    for book in books_with_forward_index:
        logging.info(f"Mise à jour TF-IDF pour: {book.title}")
        
        # Calculer le nombre total de mots dans ce livre
        total_words_in_book = ForwardIndex.objects.filter(book=book).aggregate(
            total=Sum('occurrences_count')
        )['total'] or 1
        
        # Mettre à jour chaque terme du livre
        forward_entries = ForwardIndex.objects.filter(book=book)
        
        for entry in forward_entries:
            # Calcul TF
            tf = entry.occurrences_count / total_words_in_book
            
            # Calcul IDF
            documents_containing_word = word_document_frequencies.get(entry.word, 1)
            idf = math.log(total_books / documents_containing_word)
            
            # Calcul TF-IDF
            tf_idf = tf * idf
            
            # Mettre à jour l'entrée
            entry.tf = tf
            entry.idf = idf
            entry.tfidf = tf_idf
            entry.save()
    
    logging.info("Mise à jour TF-IDF terminée.")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Calculer TF-IDF pour le corpus')
    parser.add_argument('--recompute-only', action='store_true', 
                       help='Ne recalculer que le TF-IDF sans réindexer')
    
    args = parser.parse_args()
    
    if args.recompute_only:
        recompute_tfidf_for_existing_data()
    else:
        calculate_tf_idf_for_corpus()