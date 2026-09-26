from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
]
