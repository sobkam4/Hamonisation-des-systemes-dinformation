from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError("Phone is required")
        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.ADMIN)
        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CITIZEN = "citizen", "Citoyen"
        RESCUER = "rescuer", "Secouriste"
        ENTERPRISE_ADMIN = "enterprise_admin", "Admin entreprise"
        ADMIN = "admin", "Administrateur"

    phone = models.CharField(max_length=20, unique=True, db_index=True)
    email = models.EmailField(blank=True)
    display_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(
        max_length=32, choices=Role.choices, default=Role.CITIZEN, db_index=True
    )
    is_verified_rescuer = models.BooleanField(default=False, db_index=True)
    preferred_language = models.CharField(max_length=10, default="fr")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()

    def __str__(self):
        return self.phone


class PhoneOTPChallenge(models.Model):
    """Stores hashed OTP for phone login (short-lived)."""

    phone = models.CharField(max_length=20, db_index=True)
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    consumed = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["phone", "-created_at"]),
        ]


class ICEContact(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ice_contacts")
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
