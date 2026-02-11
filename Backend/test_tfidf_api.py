#!/usr/bin/env python3
"""
Script de test pour l'API TF-IDF
"""

import requests
import json
import sys

def test_tfidf_api():
    """Teste l'API TF-IDF avec différents termes de recherche"""
    
    base_url = "http://localhost:8000/api/books/tfidf-search/"
    
    # Termes de test
    test_queries = [
        "love",      # Mot commun qui devrait avoir des résultats
        "science",   # Terme technique
        "adventure", # Terme d'aventure
        "philosophy" # Terme philosophique
    ]
    
    print("🔍 Test de l'API TF-IDF")
    print("=" * 50)
    
    for query in test_queries:
        print(f"\n📖 Recherche pour: '{query}'")
        print("-" * 30)
        
        try:
            response = requests.get(base_url, params={'q': query})
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                
                print(f"✅ Statut: {response.status_code}")
                print(f"📊 Nombre de résultats: {len(results)}")
                
                if results:
                    print("\n🏆 Top 3 résultats:")
                    for i, book in enumerate(results[:3], 1):
                        title = book.get('title', 'Sans titre')
                        tfidf_score = book.get('tfidf_score', 0)
                        tf_score = book.get('tf_score', 0)
                        idf_score = book.get('idf_score', 0)
                        occurrences = book.get('word_occurrences', 0)
                        
                        print(f"  {i}. {title[:50]}...")
                        print(f"     TF-IDF: {tfidf_score:.6f} (TF: {tf_score:.6f}, IDF: {idf_score:.6f})")
                        print(f"     Occurrences: {occurrences}")
                        print()
                else:
                    print("❌ Aucun résultat trouvé")
                    
            else:
                print(f"❌ Erreur HTTP: {response.status_code}")
                print(f"Message: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Impossible de se connecter au serveur Django")
            print("   Vérifiez que le serveur fonctionne sur http://localhost:8000")
            return False
            
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return False
    
    print("\n" + "=" * 50)
    print("✅ Tests terminés")
    return True

def test_traditional_api_comparison():
    """Compare les résultats entre l'API traditionnelle et TF-IDF"""
    
    query = "love"
    
    print(f"\n🔄 Comparaison des APIs pour '{query}'")
    print("=" * 60)
    
    # Test API traditionnelle
    try:
        traditional_response = requests.get(
            "http://localhost:8000/api/books/search/", 
            params={'q': query}
        )
        
        if traditional_response.status_code == 200:
            traditional_data = traditional_response.json()
            traditional_results = traditional_data.get('results', [])
            print(f"📊 API traditionnelle: {len(traditional_results)} résultats")
        else:
            print(f"❌ API traditionnelle erreur: {traditional_response.status_code}")
            
    except Exception as e:
        print(f"❌ Erreur API traditionnelle: {e}")
    
    # Test API TF-IDF
    try:
        tfidf_response = requests.get(
            "http://localhost:8000/api/books/tfidf-search/", 
            params={'q': query}
        )
        
        if tfidf_response.status_code == 200:
            tfidf_data = tfidf_response.json()
            tfidf_results = tfidf_data.get('results', [])
            print(f"📊 API TF-IDF: {len(tfidf_results)} résultats")
            
            if tfidf_results:
                print(f"\n🏆 Premier résultat TF-IDF:")
                top_result = tfidf_results[0]
                print(f"   Titre: {top_result.get('title', '')}")
                print(f"   TF-IDF Score: {top_result.get('tfidf_score', 0):.6f}")
                
        else:
            print(f"❌ API TF-IDF erreur: {tfidf_response.status_code}")
            
    except Exception as e:
        print(f"❌ Erreur API TF-IDF: {e}")

if __name__ == "__main__":
    print("🚀 Démarrage des tests API TF-IDF...")
    
    # Test principal
    success = test_tfidf_api()
    
    if success:
        # Test de comparaison
        test_traditional_api_comparison()
    else:
        print("\n❌ Les tests ont échoué")
        sys.exit(1)