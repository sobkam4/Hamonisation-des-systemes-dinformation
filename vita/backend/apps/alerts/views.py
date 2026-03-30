from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import AllowAny

from apps.alerts.models import GeoAlert
from apps.alerts.serializers import GeoAlertSerializer


def haversine_km(lat1, lon1, lat2, lon2):
    from math import asin, cos, radians, sin, sqrt

    r = 6371
    p1, p2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dl = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(p1) * cos(p2) * sin(dl / 2) ** 2
    return 2 * r * asin(sqrt(min(1, a)))


class NearbyAlertsView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = GeoAlertSerializer

    def get_queryset(self):
        now = timezone.now()
        lat = self.request.query_params.get("lat")
        lon = self.request.query_params.get("lon")
        qs = GeoAlert.objects.filter(
            is_active=True, starts_at__lte=now, ends_at__gte=now
        )
        if lat and lon:
            try:
                la, lo = float(lat), float(lon)
            except ValueError:
                return qs.none()
            matched = []
            for a in qs:
                d = haversine_km(la, lo, float(a.latitude), float(a.longitude))
                if d <= float(a.radius_km):
                    matched.append(a.id)
            return GeoAlert.objects.filter(id__in=matched)
        return qs
