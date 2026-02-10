import json
from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=200)
    birth_year = models.IntegerField(null=True, blank=True)
    death_year = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        app_label = 'book'


class Book(models.Model):
    title = models.CharField(max_length=200)
    authors = models.ManyToManyField(Author)
    language = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    subjects = models.TextField(null=True, blank=True)
    bookshelves = models.TextField(null=True, blank=True)
    cover_image = models.URLField(null=True, blank=True)
    download_count = models.IntegerField(default=0)
    copyright = models.BooleanField(default=False)
    text_content = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.title

    class Meta:
        app_label = 'book'


class Index(models.Model):
    """Index inversé : mot -> livres"""
    word = models.CharField(max_length=255, db_index=True)
    book = models.ForeignKey(Book, on_delete=models.CASCADE, db_index=True)
    occurrences_count = models.IntegerField()
    positions = models.JSONField(default=list, blank=True)

    class Meta:
        unique_together = ('word', 'book')

    def __str__(self):
        return f"{self.word} in {self.book.title}"

    def get_positions(self):
        return self.positions or []


class ForwardIndex(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, db_index=True)
    word = models.CharField(max_length=255)
    occurrences_count = models.IntegerField(default=0)  # <-- ajouter default ici
    positions = models.JSONField(default=list, blank=True)


    class Meta:
        unique_together = ('book', 'word')

    def __str__(self):
        return f"{self.book.title} -> {self.word}"

    def get_positions(self):
        return self.positions or []
