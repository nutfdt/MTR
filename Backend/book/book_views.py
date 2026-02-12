# book/book_views.py - FIXED Regex Search

import re
import logging
import json
import networkx as nx
from fuzzywuzzy import fuzz
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from django.db.models import Q, Count
from .models import Book, Index
from .serializers import BookSerializer
from nltk.tokenize import word_tokenize


class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# Liste des livres avec pagination
class BookListView(generics.ListAPIView):
    queryset = Book.objects.all().order_by('-download_count')  # Tri par popularité
    serializer_class = BookSerializer
    pagination_class = CustomPagination


class BookDetailView(APIView):
    def get(self, request, pk):
        try:
            book = Book.objects.get(pk=pk)
            serializer = BookSerializer(book)
            return Response(serializer.data)
        except Book.DoesNotExist:
            return Response({"detail": "Book not found"}, status=status.HTTP_404_NOT_FOUND)


class BookSearchView(generics.ListAPIView):
    """
    Recherche SIMPLE par mot-clé
    - Utilise l'index inversé
    - Calcule Jaccard + PageRank
    """
    serializer_class = BookSerializer
    pagination_class = CustomPagination  

    def get_queryset(self):
        query = self.request.query_params.get("q", "").strip().lower()
        author = self.request.query_params.get("author", "").strip().lower()
        
        if not query and not author:
            return Book.objects.none()

        # Filtrer par mot-clé dans l'index
        indexed_books = Index.objects.filter(word=query).select_related("book")
        book_ids_by_keyword = indexed_books.values_list("book_id", flat=True).distinct()

        # Filtrer par auteur si spécifié
        if author:
            books_by_author = Book.objects.filter(
                authors__name__icontains=author
            ).values_list("id", flat=True).distinct()
        else:
            books_by_author = Book.objects.values_list("id", flat=True).distinct()

        # Combiner les filtres
        book_ids = set(book_ids_by_keyword) & set(books_by_author)
        
        return Book.objects.filter(id__in=book_ids).order_by("-download_count")

    def jaccard_similarity(self, set1, set2):
        """Calcul de la similarité de Jaccard entre deux ensembles."""
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        return intersection / union if union != 0 else 0

    def get_similar_books_from_graph(self, book, all_books):
        """Retourne les voisins dans le graphe de Jaccard pour un livre donné."""
        similar_books = []
        book_keywords = set(Index.objects.filter(book_id=book.id).values_list('word', flat=True))
        
        # Limiter à 10 livres max pour performance
        for other_book in all_books[:10]:
            if book.id == other_book.id:
                continue
            other_book_keywords = set(Index.objects.filter(book_id=other_book.id).values_list('word', flat=True))
            jaccard_score = self.jaccard_similarity(book_keywords, other_book_keywords)
            
            if jaccard_score > 0.1:
                similar_books.append({
                    "book": BookSerializer(other_book).data,
                    "jaccard_similarity": jaccard_score
                })
        
        return similar_books[:3]  # Max 3 livres similaires

    def list(self, request, *args, **kwargs):
        query = request.query_params.get("q", "").strip().lower()
        author = request.query_params.get("author", "").strip().lower()
        
        if not query and not author:
            return self.get_paginated_response([])

        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        
        if not page:
            return self.get_paginated_response([])

        # Récupération des occurrences
        index_entries = Index.objects.filter(book_id__in=[book.id for book in page])
        occurrences_dict = {}
        for entry in index_entries:
            if entry.book_id not in occurrences_dict:
                occurrences_dict[entry.book_id] = 0
            occurrences_dict[entry.book_id] += entry.occurrences_count

        # Calcul du PageRank (simplifié)
        pagerank_scores = {}
        try:
            pagerank_scores = compute_pagerank(page, index_entries) or {}
        except Exception as e:
            logging.warning(f"PageRank calculation failed: {e}")

        # Construire les résultats
        results = []
        for book in page:
            book_data = BookSerializer(book).data
            book_data["occurrences_count"] = occurrences_dict.get(book.id, 0)
            book_data["pagerank_score"] = pagerank_scores.get(book.id, 0)
            
            # Livres similaires (désactivé pour performance, réactiver si besoin)
            book_data["similar_books"] = []
            # book_data["similar_books"] = self.get_similar_books_from_graph(book, page)
            
            results.append(book_data)

        # Trier par occurrences et PageRank
        results = sorted(
            results, 
            key=lambda x: (x["occurrences_count"], x["pagerank_score"]), 
            reverse=True
        )

        return self.get_paginated_response(results)


class BookAdvancedSearchView(APIView):
    """
    Recherche AVANCÉE avec REGEX
    - Supporte expressions régulières
    - Recherche dans text_content et index
    """
    pagination_class = CustomPagination

    def get(self, request):
        query = self.request.query_params.get("q", "").strip()
        
        if not query:
            return Response(
                {"detail": "No query provided."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Valider le pattern regex
            try:
                re.compile(query)
            except re.error as e:
                return Response(
                    {"detail": f"Invalid regex pattern: {str(e)}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            max_results = 100
            
            # ✅ RECHERCHE 1: Full-text avec icontains (plus rapide)
            books_by_full_text = Book.objects.filter(
                Q(title__icontains=query.replace('[', '').replace(']', '').replace('(', '').replace(')', ''))
            ).distinct()[:max_results]

            # ✅ RECHERCHE 2: Regex dans le contenu (LIMITÉ pour performance)
            # Ne chercher que dans les 50 premiers livres populaires
            books_by_regex = Book.objects.filter(
                Q(text_content__iregex=query)  # iregex = case insensitive
            ).order_by('-download_count').distinct()[:50]

            # ✅ RECHERCHE 3: Dans l'index
            # Chercher les mots qui matchent le pattern
            indexed_books_qs = Index.objects.all()
            matching_words = set()
            
            # Compiler le pattern une fois
            pattern = re.compile(query, re.IGNORECASE)
            
            # Chercher dans les 1000 mots les plus fréquents
            for index_entry in indexed_books_qs[:1000]:
                if pattern.search(index_entry.word):
                    matching_words.add(index_entry.word)
            
            # Récupérer les livres contenant ces mots
            if matching_words:
                indexed_books = Index.objects.filter(
                    word__in=matching_words
                ).values("book_id").annotate(
                    occurrence_count=Count("id")
                )
                book_ids = [entry["book_id"] for entry in indexed_books]
                books_in_index = Book.objects.filter(id__in=book_ids)
            else:
                books_in_index = Book.objects.none()

            # Fusionner les résultats
            books = (books_by_full_text | books_by_regex | books_in_index).distinct()

            # Calculer PageRank
            pagerank_scores = {}
            try:
                if books.count() > 0:
                    index_for_books = Index.objects.filter(book_id__in=[b.id for b in books])
                    pagerank_scores = compute_pagerank(books, index_for_books) or {}
            except Exception as e:
                logging.warning(f"PageRank calculation failed: {e}")

            # Calculer scores
            book_scores = {book.id: pagerank_scores.get(book.id, 0) for book in books}

            # Trier par score
            sorted_books = sorted(
                books, 
                key=lambda book: book_scores.get(book.id, 0), 
                reverse=True
            )

            # Pagination
            paginator = CustomPagination()
            result_page = paginator.paginate_queryset(sorted_books, request)

            if result_page is not None:
                results = []
                for book in result_page:
                    book_data = BookSerializer(book).data
                    book_data["pagerank_score"] = pagerank_scores.get(book.id, 0)
                    book_data["occurrences_count"] = 0  # Peut être calculé si besoin
                    book_data["similar_books"] = []
                    results.append(book_data)
                
                return paginator.get_paginated_response(results)

            return Response(
                {"detail": "No results found."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            logging.error(f"Advanced search error: {str(e)}")
            return Response(
                {"error": f"Search error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BookHighlightSearchView(APIView):
    """
    Recherche avec SURLIGNAGE
    - Retourne highlighted_text avec balises <mark>
    """
    pagination_class = CustomPagination

    def get(self, request):
        query = self.request.query_params.get("q", "").strip().lower()
        
        if not query:
            return Response(
                {"detail": "No query provided."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Chercher dans l'index
            indexed_books = Index.objects.filter(word=query).select_related("book")
            book_ids = indexed_books.values_list("book_id", flat=True).distinct()
            books = Book.objects.filter(id__in=book_ids).order_by('-download_count')

            # Pagination
            paginator = CustomPagination()
            result_page = paginator.paginate_queryset(books, request)
            
            if result_page is not None:
                serialized_books = BookSerializer(result_page, many=True).data
                highlighted_books = self.highlight_words(serialized_books, query)
                return paginator.get_paginated_response(highlighted_books)

            if books:
                serialized_books = BookSerializer(books, many=True).data
                highlighted_books = self.highlight_words(serialized_books, query)
                return Response(highlighted_books)
            else:
                return Response(
                    {"detail": "No results found."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except Exception as e:
            logging.error(f"Highlight search error: {str(e)}")
            return Response(
                {"error": f"Search error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def highlight_words(self, books, query):
        """Ajoute des balises <mark> autour du mot recherché"""
        for book in books:
            try:
                index_entries = Index.objects.filter(book_id=book['id'], word=query)
                positions = []
                
                for entry in index_entries:
                    try:
                        entry_positions = entry.get_positions()
                        positions.extend(entry_positions)
                    except Exception as e:
                        logging.warning(f"Error getting positions: {e}")
                        continue
                
                positions = sorted(set(positions))[:50]  # Max 50 occurrences
                
                text_content = book['text_content']
                highlighted_text = self.apply_highlight(text_content, positions, query)
                book['highlighted_text'] = highlighted_text
                
            except Exception as e:
                logging.warning(f"Error highlighting book {book['id']}: {e}")
                book['highlighted_text'] = book.get('text_content', '')[:500]
        
        return books

    def apply_highlight(self, text, positions, query):
        """Applique les balises <mark> aux positions données"""
        if not positions:
            return text[:500]
        
        highlighted_text = ""
        last_pos = 0
        query_length = len(query)
        
        for pos in positions[:50]:  # Limiter à 50 occurrences
            pos = int(pos)
            
            # Extraire contexte (100 chars avant/après)
            context_start = max(0, pos - 100)
            context_end = min(len(text), pos + query_length + 100)
            
            if last_pos == 0:
                highlighted_text += "..." if context_start > 0 else ""
            
            highlighted_text += text[context_start:pos]
            highlighted_text += "<mark>" + text[pos:pos+query_length] + "</mark>"
            last_pos = pos + query_length
        
        highlighted_text += text[last_pos:last_pos+100] + "..."
        
        return highlighted_text


def compute_pagerank(books, index_entries):
    """Calcule le PageRank basé sur la similarité Jaccard"""
    try:
        G = nx.Graph()

        book_ids = {book.id for book in books}
        for book_id in book_ids:
            G.add_node(book_id)

        # Construire les ensembles de mots
        book_word_sets = {}
        for book_id in book_ids:
            words = set()
            for entry in index_entries:
                if entry.book_id == book_id:
                    words.add(entry.word)
            book_word_sets[book_id] = words

        # Ajouter arêtes basées sur Jaccard
        for book1 in book_ids:
            for book2 in book_ids:
                if book1 < book2:  # Éviter doublons
                    intersection = book_word_sets[book1] & book_word_sets[book2]
                    union = book_word_sets[book1] | book_word_sets[book2]
                    
                    if union:
                        jaccard_similarity = len(intersection) / len(union)
                        if jaccard_similarity > 0.1:  # Seuil
                            G.add_edge(book1, book2, weight=jaccard_similarity)

        # Calculer PageRank
        if G.number_of_nodes() > 0:
            pagerank_scores = nx.pagerank(G, weight='weight')
            return pagerank_scores
        
        return {}
        
    except Exception as e:
        logging.error(f"PageRank error: {e}")
        return {}