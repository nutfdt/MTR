#!/usr/bin/env python3
"""
Script de diagnostic pour l'index TF-IDF
"""

import os
import sys
import django
from django.db import models

# Configuration Django
sys.path.append(os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mygutenberg.settings')
django.setup()

from book.models import ForwardIndex, Book

def main():
    print("🔍 Diagnostic de l'index TF-IDF")
    print("=" * 50)
    
    # Vérifier le nombre total d'entrées
    total_entries = ForwardIndex.objects.count()
    print(f"📊 Total entrées ForwardIndex: {total_entries:,}")
    
    # Vérifier combien ont des scores TF-IDF non nuls
    tfidf_entries = ForwardIndex.objects.filter(tfidf__gt=0).count()
    print(f"📊 Entrées avec TF-IDF > 0: {tfidf_entries:,}")
    
    if tfidf_entries == 0:
        print("❌ Aucune entrée avec TF-IDF calculé !")
        print("💡 Suggestion: Exécutez le script fetch_tfidf.py pour calculer les scores")
        return
    
    # Quelques exemples de mots avec les meilleurs scores TF-IDF
    print("\n🏆 Top 5 mots par score TF-IDF:")
    print("-" * 40)
    top_words = ForwardIndex.objects.filter(tfidf__gt=0).order_by('-tfidf')[:5]
    for i, entry in enumerate(top_words, 1):
        print(f"  {i}. '{entry.word}' | TF-IDF: {entry.tfidf:.6f} | Livre: {entry.book.title[:40]}...")
    
    # Tester quelques mots communs
    test_words = ['love', 'time', 'man', 'woman', 'life', 'death', 'war', 'peace']
    print(f"\n🔍 Test mots communs:")
    print("-" * 30)
    
    for word in test_words:
        count = ForwardIndex.objects.filter(word=word).count()
        if count > 0:
            max_tfidf = ForwardIndex.objects.filter(word=word).order_by('-tfidf').first()
            print(f"  '{word}': {count} livres, max TF-IDF: {max_tfidf.tfidf:.6f}")
        else:
            print(f"  '{word}': non trouvé")
    
    # Statistiques générales
    print(f"\n📈 Statistiques:")
    print("-" * 20)
    avg_tfidf = ForwardIndex.objects.filter(tfidf__gt=0).aggregate(
        avg=models.Avg('tfidf')
    )['avg'] or 0
    
    max_tfidf = ForwardIndex.objects.filter(tfidf__gt=0).aggregate(
        max=models.Max('tfidf')
    )['max'] or 0
    
    print(f"  Score TF-IDF moyen: {avg_tfidf:.6f}")
    print(f"  Score TF-IDF maximum: {max_tfidf:.6f}")
    
    # Nombre de livres avec index
    books_with_index = Book.objects.filter(forwardindex__isnull=False).distinct().count()
    total_books = Book.objects.count()
    print(f"  Livres indexés: {books_with_index}/{total_books}")

if __name__ == "__main__":
    main()