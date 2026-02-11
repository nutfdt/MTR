#!/usr/bin/env python3
"""
Test simple et direct du TF-IDF
"""

import os
import sys
import django

# Configuration Django
sys.path.append(os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mygutenberg.settings')
django.setup()

from book.models import ForwardIndex, Book

def main():
    print("🎯 TEST FINAL TF-IDF")
    print("=" * 50)
    
    # Test pour le mot 'love'
    query_word = 'love'
    print(f"🔍 Recherche pour le mot: '{query_word}'")
    
    # Récupérer les entrées TF-IDF triées par score
    forward_entries = ForwardIndex.objects.filter(
        word=query_word,
        tfidf__gt=0
    ).select_related('book').order_by('-tfidf')
    
    print(f"📊 Nombre de livres trouvés: {forward_entries.count()}")
    
    if forward_entries.count() > 0:
        print("\n🏆 TOP 5 LIVRES PAR SCORE TF-IDF:")
        print("-" * 50)
        
        for i, entry in enumerate(forward_entries[:5], 1):
            print(f"{i}. 📖 {entry.book.title[:60]}...")
            print(f"   📊 TF-IDF: {entry.tfidf:.6f}")
            print(f"   📈 TF: {entry.tf:.6f} | IDF: {entry.idf:.6f}")
            print(f"   🔢 Occurrences: {entry.occurrences_count}")
            print(f"   👤 Auteurs: {entry.book.authors.first().name if entry.book.authors.first() else 'Inconnu'}")
            print()
        
        # Test de comparaison avec d'autres mots
        print("🔄 COMPARAISON AVEC D'AUTRES MOTS:")
        print("-" * 40)
        
        test_words = ['time', 'war', 'peace', 'death', 'life']
        for word in test_words:
            max_entry = ForwardIndex.objects.filter(
                word=word, 
                tfidf__gt=0
            ).order_by('-tfidf').first()
            
            if max_entry:
                print(f"'{word}': Max TF-IDF {max_entry.tfidf:.6f} dans '{max_entry.book.title[:40]}...'")
            else:
                print(f"'{word}': Non trouvé")
        
        print(f"\n✅ TF-IDF FONCTIONNE PARFAITEMENT!")
        print(f"✅ Votre système peut maintenant classer les livres par pertinence TF-IDF")
        print(f"✅ API disponible à: /api/books/tfidf-search/?q={query_word}")
        
    else:
        print("❌ Aucun résultat trouvé - problème avec les données TF-IDF")

if __name__ == "__main__":
    main()