from rest_framework import serializers

from apps.accounts.models import ICEContact, User


class ICEContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ICEContact
        fields = ("id", "name", "phone", "sort_order")


class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "phone",
            "email",
            "display_name",
            "role",
            "is_verified_rescuer",
            "preferred_language",
        )
        read_only_fields = fields


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("email", "display_name", "preferred_language")
