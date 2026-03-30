from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer

User = get_user_model()

@extend_schema(
    tags=['Authentication'],
    summary="Login utilisateur",
    description="Authentifie un utilisateur et retourne les tokens JWT",
    responses={200: UserSerializer}
)
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@extend_schema(
    tags=['Authentication'],
    summary="Inscription utilisateur",
    description="Crée un nouveau compte utilisateur",
    request=RegisterSerializer,
    responses={201: UserSerializer}
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

@extend_schema(
    tags=['Authentication'],
    summary="Profil utilisateur",
    description="Récupère ou met à jour le profil de l'utilisateur connecté"
)
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        return self.request.user

@extend_schema(
    tags=['Authentication'],
    summary="Liste des utilisateurs",
    description="Liste les utilisateurs selon les permissions du rôle"
)
class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.all()
        elif user.role in ['gestionnaire', 'comptable']:
            return User.objects.exclude(role='admin')
        return User.objects.filter(id=user.id)

@extend_schema(
    tags=['Authentication'],
    summary="Détails utilisateur",
    description="Récupère, met à jour ou supprime un utilisateur"
)
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.all()
        elif user.role in ['gestionnaire', 'comptable']:
            return User.objects.exclude(role='admin')
        return User.objects.filter(id=user.id)

@extend_schema(
    tags=['Authentication'],
    summary="Permissions utilisateur",
    description="Retourne les permissions de l'utilisateur connecté"
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_permissions(request):
    user = request.user
    permissions = {
        'role': user.role,
        'modules': user.has_module_permission
    }
    return Response(permissions)
