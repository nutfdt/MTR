#!/usr/bin/env python3
"""
Test final de l'API TF-IDF directement via Django
"""

import os
import sys
import django
from django.test import RequestFactory

# Configuration Django
sys.path.append(os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mygutenberg.settings')
django.setup()

from book.book_views import BookTFIDFSearchView
from book.models import ForwardIndex

def test_tfidf_view():
    print("🔍 Test direct de la vue TF-IDF")
    print("=" * 40)
    
    # Vérifier qu'on a des données
    total_entries = ForwardIndex.objects.count()
    love_entries = ForwardIndex.objects.filter(word='love').count()
    print(f"📊 Total entrées: {total_entries:,}")
    print(f"📊 Entrées pour 'love': {love_entries}")
    
    if love_entries == 0:
        print("❌ Aucun résultat pour 'love'")
        return
    
    # Créer une requête factice
    factory = RequestFactory()
    request = factory.get('/api/books/tfidf-search/', {'q': 'love'})
    
    # Tester la vue
    view = BookTFIDFSearchView()
    view.request = request
    
    print("\n🧪 Test de la méthode get_queryset...")
    queryset = view.get_queryset()
    print(f"✅ Queryset retourné: {len(queryset)} livres")
    
    if len(queryset) > 0:
        print("\n🏆 Top 3 résultats par TF-IDF:")
        for i, book in enumerate(queryset[:3], 1):
            try:
                forward_entry = ForwardIndex.objects.get(book=book, word='love')
                print(f"  {i}. {book.title[:50]}...")
                print(f"     TF-IDF: {forward_entry.tfidf:.6f}")
                print(f"     TF: {forward_entry.tf:.6f}, IDF: {forward_entry.idf:.6f}")
                print(f"     Occurrences: {forward_entry.occurrences_count}")
                print()
            except ForwardIndex.DoesNotExist:
                print(f"  {i}. {book.title} (pas d'entrée TF-IDF)")
    
    print("🎉 Test terminé avec succès!")

if __name__ == "__main__":
    test_tfidf_view()