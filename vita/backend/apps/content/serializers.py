from rest_framework import serializers

from apps.content.models import ContentBundle, MediaAsset, Protocol, ProtocolStep


class MediaAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaAsset
        fields = ("id", "storage_key", "mime_type")


class ProtocolStepSerializer(serializers.ModelSerializer):
    image = MediaAssetSerializer(read_only=True)

    class Meta:
        model = ProtocolStep
        fields = ("id", "order", "title", "body", "audio_text", "image")


class ProtocolListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Protocol
        fields = ("id", "slug", "title", "locale", "version", "summary", "updated_at")


class ProtocolDetailSerializer(serializers.ModelSerializer):
    steps = ProtocolStepSerializer(many=True, read_only=True)

    class Meta:
        model = Protocol
        fields = (
            "id",
            "slug",
            "title",
            "locale",
            "version",
            "summary",
            "steps",
            "updated_at",
        )


class ContentBundleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentBundle
        fields = ("version", "locale", "manifest_json", "storage_key", "created_at")
