from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'role', 'telephone', 'date_creation', 'password']
        read_only_fields = ['id', 'date_creation']
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 
                 'role', 'telephone', 'password', 'password_confirm']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializerWithPermissions(UserSerializer):
    def to_representation(self, instance):
        """Custom serialization to handle permissions"""
        data = super().to_representation(instance)
        
        # Convert permissions to dict instead of method
        if hasattr(instance, 'has_module_permission'):
            data['permissions'] = {
                'modules': {
                    'authentication': instance.has_module_permission('authentication'),
                    'biens': instance.has_module_permission('biens'),
                    'clients': instance.has_module_permission('clients'),
                    'contrats': instance.has_module_permission('contrats'),
                    'paiements': instance.has_module_permission('paiements'),
                    'depenses': instance.has_module_permission('depenses'),
                    'analytics': instance.has_module_permission('analytics'),
                },
                'role': instance.role
            }
        
        return data

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'username'  # Explicitly set username field
    
    def validate(self, attrs):
        # Get username and password
        username = attrs.get('username')
        password = attrs.get('password')
        
        # Authenticate user
        from django.contrib.auth import authenticate
        user = authenticate(
            request=self.context.get('request'),
            username=username,
            password=password
        )
        
        if not user:
            from rest_framework_simplejwt.exceptions import AuthenticationFailed
            raise AuthenticationFailed(
                'Aucun compte actif n\'a été trouvé avec les identifiants fournis.',
                code='no_active_account',
            )
        
        if not user.is_active:
            from rest_framework_simplejwt.exceptions import AuthenticationFailed
            raise AuthenticationFailed(
                'Ce compte utilisateur est désactivé.',
                code='user_inactive',
            )
        
        # Set user for token generation
        self.user = user
        
        # Generate tokens using parent class
        refresh = self.get_token(user)
        
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        
        # Add user info to response with permissions
        user_data = UserSerializerWithPermissions(user).data
        data.update({
            'user': user_data,
            'permissions': {
                'role': user.role,
                'modules': {
                    'authentication': user.has_module_permission('authentication'),
                    'biens': user.has_module_permission('biens'),
                    'clients': user.has_module_permission('clients'),
                    'contrats': user.has_module_permission('contrats'),
                    'paiements': user.has_module_permission('paiements'),
                    'depenses': user.has_module_permission('depenses'),
                    'analytics': user.has_module_permission('analytics'),
                }
            }
        })
        
        return data
