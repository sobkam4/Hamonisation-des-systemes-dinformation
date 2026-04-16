from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import ICEContact
from apps.accounts.serializers import ICEContactSerializer, UserMeSerializer, UserProfileUpdateSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserMeSerializer(request.user).data)

    def patch(self, request):
        ser = UserProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(UserMeSerializer(request.user).data)


class ICEContactViewSet(viewsets.ModelViewSet):
    serializer_class = ICEContactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ICEContact.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
