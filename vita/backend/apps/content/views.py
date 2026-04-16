from django.db.models import Max, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.content.models import ContentBundle, Protocol
from apps.content.serializers import (
    ContentBundleSerializer,
    ProtocolDetailSerializer,
    ProtocolListSerializer,
)
from apps.content.tasks import build_content_bundle


class ProtocolViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    serializer_class = ProtocolListSerializer

    def get_queryset(self):
        loc = self.request.query_params.get("locale", "fr")
        pairs = (
            Protocol.objects.filter(is_published=True, locale=loc)
            .values("slug")
            .annotate(v=Max("version"))
        )
        q = Q()
        for row in pairs:
            q |= Q(slug=row["slug"], version=row["v"])
        if not pairs:
            return Protocol.objects.none()
        return Protocol.objects.filter(is_published=True, locale=loc).filter(q)

    def retrieve(self, request, *args, **kwargs):
        slug = kwargs.get("slug")
        loc = request.query_params.get("locale", "fr")
        p = (
            Protocol.objects.filter(slug=slug, locale=loc, is_published=True)
            .order_by("-version")
            .first()
        )
        if not p:
            raise NotFound()
        return Response(ProtocolDetailSerializer(p).data)


class BundleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = ContentBundleSerializer
    queryset = ContentBundle.objects.all()

    @action(detail=False, methods=["get"], url_path="latest")
    def latest(self, request):
        loc = request.query_params.get("locale", "fr")
        b = ContentBundle.objects.filter(locale=loc).order_by("-created_at").first()
        if not b:
            return Response({"detail": "Aucun bundle"}, status=404)
        return Response(ContentBundleSerializer(b).data)

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[IsAuthenticated],
        url_path="build",
    )
    def build(self, request):
        loc = request.data.get("locale", "fr")
        build_content_bundle.delay(loc)
        return Response({"detail": "Génération lancée"})
