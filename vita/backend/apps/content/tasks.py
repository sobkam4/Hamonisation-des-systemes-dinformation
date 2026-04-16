import hashlib
import json
from datetime import datetime, timezone as dt_timezone

import boto3
from celery import shared_task
from django.conf import settings

from apps.content.models import ContentBundle, Protocol
from apps.content.serializers import ProtocolDetailSerializer


@shared_task
def build_content_bundle(locale: str = "fr") -> str:
    slugs = (
        Protocol.objects.filter(is_published=True, locale=locale)
        .values_list("slug", flat=True)
        .distinct()
    )
    items = []
    for slug in slugs:
        p = (
            Protocol.objects.filter(
                slug=slug, is_published=True, locale=locale
            )
            .order_by("-version")
            .first()
        )
        if not p:
            continue
        data = ProtocolDetailSerializer(p).data
        raw = json.dumps(data, sort_keys=True, ensure_ascii=False)
        items.append(
            {
                "slug": p.slug,
                "hash": hashlib.sha256(raw.encode()).hexdigest(),
                "data": data,
            }
        )
    version = datetime.now(dt_timezone.utc).strftime("%Y%m%d.%H%M%S")
    manifest = {"version": version, "locale": locale, "protocols": items}
    body = json.dumps(manifest, ensure_ascii=False).encode()
    key = f"bundles/{locale}/{version}.json"
    bucket = getattr(settings, "VITA_EXPORTS_BUCKET", "vita-exports")
    if settings.AWS_S3_ENDPOINT_URL and settings.AWS_ACCESS_KEY_ID:
        boto3.client(
            "s3",
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        ).put_object(Bucket=bucket, Key=key, Body=body, ContentType="application/json")
    ContentBundle.objects.create(
        version=version,
        locale=locale,
        manifest_json=manifest,
        storage_key=key if settings.AWS_S3_ENDPOINT_URL else "",
    )
    return version
