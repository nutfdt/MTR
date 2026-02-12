from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory
from rest_framework.response import Response
from types import SimpleNamespace
from unittest.mock import patch

from book.book_views import BookSearchView, BookHighlightSearchView, BookAdvancedSearchView

# Sérialiseur factice pour ne pas toucher à la BDD pendant les tests
class FakeBookSerializer:
    def __init__(self, instance, many=False):
        if many:
            self.data = [self._serialize(obj) for obj in instance]
        else:
            self.data = self._serialize(instance)

    def _serialize(self, obj):
        if isinstance(obj, dict):
            return obj
        return {
            'id': getattr(obj, 'id', None),
            'title': getattr(obj, 'title', ''),
            'text_content': getattr(obj, 'text_content', ''),
        }

# Utilitaires
def make_book(id, title, text=''):
    return SimpleNamespace(id=id, title=title, text_content=text)

class FakeQuerySet:
    def __init__(self, items):
        self._items = list(items)
    def select_related(self, *args, **kwargs):
        return self
    def order_by(self, *args, **kwargs):
        # Pour les tests, on n'a pas besoin d'un vrai tri
        return self
    def values_list(self, *args, **kwargs):
        class ValList:
            def __init__(self, vals):
                self._vals = vals
            def distinct(self):
                return self._vals
        return ValList([item for item in (getattr(it, 'book_id', None) for it in self._items) if item is not None])
    def __iter__(self):
        return iter(self._items)

class FakeIndexEntry:
    def __init__(self, book_id, occurrences_count=1, positions=None):
        self.book_id = book_id
        self.occurrences_count = occurrences_count
        self._positions = positions or []
    def get_positions(self):
        return self._positions

class FakeBookQuerySet(FakeQuerySet):
    def filter(self, *args, **kwargs):
        return self
    def distinct(self):
        return self
    def __getitem__(self, item):
        if isinstance(item, slice):
            return FakeBookQuerySet(self._items[item])
        return self._items[item]
    def __or__(self, other):
        seen = set()
        combined = []
        for it in list(self._items) + list(getattr(other, '_items', [])):
            bid = getattr(it, 'id', None)
            if bid not in seen:
                seen.add(bid)
                combined.append(it)
        return FakeBookQuerySet(combined)

class LabeledTestCase(SimpleTestCase):
    # Affiche l'intitulé des tests réalisés
    _results = []

    def run(self, result):
        before_failures = len(result.failures)
        before_errors = len(result.errors)
        title = self._testMethodDoc or self.id()
        print(f"Intitulé: {title} ... ", end="", flush=True)
        super().run(result)
        #Est ce que le test a échoué
        failed = (len(result.failures) > before_failures) or (len(result.errors) > before_errors)
        status = 'FAIL' if failed else 'ok'
        print(status)
        self.__class__._results.append((title, status))

    @classmethod
    def tearDownClass(cls):
        # Affiche un résumé concis par classe de test
        if hasattr(cls, '_results') and cls._results:
            print(f"\nRésumé pour {cls.__name__} :")
            for title, status in cls._results:
                print(f"- {title}: {status}")
            cls._results = []
        super().tearDownClass()


class SearchEndpointTests(LabeledTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.book1 = make_book(1, 'Cat Tales', 'cat in the house cat')
        self.book2 = make_book(2, 'Dog Stories', 'dog and cat play')

    @patch('book.book_views.BookSerializer', FakeBookSerializer)
    @patch('book.book_views.compute_pagerank', return_value={1: 0.7, 2: 0.3})
    @patch('book.book_views.Index')
    @patch.object(BookSearchView, 'get_queryset', return_value=[make_book(1, 'Cat Tales'), make_book(2, 'Dog Stories')])
    def test_simple_search(self, mocked_get_queryset, mock_index_model, mock_compute_pagerank):
        # Recherche simple
        mock_index_model.objects.filter.return_value = [FakeIndexEntry(book_id=1, occurrences_count=2), FakeIndexEntry(book_id=2, occurrences_count=1)]

        # Simule la pagination et capture la réponse
        with patch.object(BookSearchView, 'paginate_queryset', return_value=[self.book1, self.book2]):
            def fake_get_paginated_response(self, data):
                return Response({'results': data})
            with patch.object(BookSearchView, 'get_paginated_response', new=fake_get_paginated_response):
                # Évite l'appel à get_similar_books_from_graph pendant le test
                with patch.object(BookSearchView, 'get_similar_books_from_graph', return_value=[]):
                    request = self.factory.get('/api/books/search/', {'q': 'cat'})
                    response = BookSearchView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        results = response.data['results']
        ids = {r['id'] for r in results}
        self.assertIn(1, ids)
        for r in results:
            if r['id'] == 1:
                self.assertEqual(r.get('occurrences_count'), 2)
                self.assertAlmostEqual(r.get('pagerank_score'), 0.7)
                break
        else:
            self.fail('book1 not present in results')

    @patch('book.book_views.BookSerializer', FakeBookSerializer)
    def test_search_no_query(self):
        # Recherche vide
        with patch.object(BookSearchView, 'paginate_queryset', return_value=[]):
            def fake_get_paginated_response(self, data):
                return Response({'results': data})
            with patch.object(BookSearchView, 'get_paginated_response', new=fake_get_paginated_response):
                request = self.factory.get('/api/books/search/')
                response = BookSearchView.as_view()(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'], [])

    @patch('book.book_views.BookSerializer', FakeBookSerializer)
    @patch('book.book_views.CustomPagination.paginate_queryset', lambda self, books, request: books)
    @patch('book.book_views.CustomPagination.get_paginated_response', lambda self, data: Response({'results': data}))
    @patch('book.book_views.Index')
    @patch('book.book_views.Book')
    def test_highlight_search(self, mock_book_model, mock_index_model):
        # Simule les entrées d'index avec positions
        full_index = FakeQuerySet([FakeIndexEntry(book_id=1, positions=[0, 10])])
        # Si book_id en param, renvoie les positions correspondantes
        def index_filter_side_effect(*args, **kwargs):
            if 'book_id' in kwargs:
                return [FakeIndexEntry(book_id=kwargs['book_id'], positions=[0, 10])]
            return full_index
        mock_index_model.objects.filter.side_effect = index_filter_side_effect

        # Book.objects.filter renvoie les livres correspondants
        mock_book_model.objects.filter.return_value = FakeQuerySet([self.book1])

        request = self.factory.get('/api/books/highlight-search/', {'q': 'cat'})
        response = BookHighlightSearchView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        results = response.data['results']
        self.assertTrue(any('highlighted_text' in r for r in results))

    @patch('book.book_views.BookSerializer', FakeBookSerializer)
    @patch('book.book_views.CustomPagination.paginate_queryset', lambda self, books, request: books)
    @patch('book.book_views.CustomPagination.get_paginated_response', lambda self, data: Response({'results': data}))
    @patch('book.book_views.compute_pagerank', return_value={1: 0.9, 2: 0.1})
    @patch('book.book_views.Index')
    @patch('book.book_views.Book')
    def test_advanced_search(self, mock_book_model, mock_index_model, mock_compute):
        # Recherche avancée
        class FakeValues:
            def __init__(self, data):
                self._data = data
            def annotate(self, **kwargs):
                return self._data

        class FakeIndexFilter:
            def __init__(self, data):
                self._data = data
            def values(self, *args, **kwargs):
                return FakeValues(self._data)

        def index_filter_side_effect(*args, **kwargs):
            if 'word__regex' in kwargs or (args and 'word__regex' in str(args[0])):
                return FakeIndexFilter([{'book_id': 1, 'occurrence_count': 3}, {'book_id': 2, 'occurrence_count': 1}])
            if 'book_id__in' in kwargs:
                return FakeQuerySet([FakeIndexEntry(book_id=1, occurrences_count=3), FakeIndexEntry(book_id=2, occurrences_count=1)])
            return FakeIndexFilter([{'book_id': 1, 'occurrence_count': 3}, {'book_id': 2, 'occurrence_count': 1}])

        mock_index_model.objects.filter.side_effect = index_filter_side_effect

        
        mock_book_model.objects.filter.return_value = FakeBookQuerySet([self.book1, self.book2])

        request = self.factory.get('/api/books/advanced-search/', {'q': 'cat'})
        response = BookAdvancedSearchView.as_view()(request)
        self.assertIn(response.status_code, (200, 404))