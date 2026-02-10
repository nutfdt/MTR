from django.contrib import admin
from .models import Author, Book, Index, ForwardIndex  # ajouter toutes les tables ici

# Enregistrement dans l'admin
admin.site.register(Author)
admin.site.register(Book)
admin.site.register(Index)
admin.site.register(ForwardIndex)
