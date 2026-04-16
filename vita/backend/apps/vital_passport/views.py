from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditLog
from apps.vital_passport.models import VitalPassport
from apps.vital_passport.serializers import VitalPassportSerializer


class VitalPassportDetailView(APIView):
    def get_object(self):
        obj, _ = VitalPassport.objects.get_or_create(user=self.request.user)
        return obj

    def get(self, request):
        obj = self.get_object()
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.Action.PASSPORT_READ,
            target_type="VitalPassport",
            target_id=str(request.user.id),
            ip_address=self._client_ip(request),
        )
        return Response(VitalPassportSerializer(obj).data)

    def patch(self, request):
        obj = self.get_object()
        ser = VitalPassportSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        p = obj.get_health_payload()
        for k in ("blood_group", "allergies", "conditions", "medications", "directives"):
            if k in data:
                p[k] = data[k]
        if "organ_donor" in data:
            obj.organ_donor = data["organ_donor"]
        obj.set_health_payload(p)
        obj.save()
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.Action.PASSPORT_UPDATE,
            target_type="VitalPassport",
            target_id=str(request.user.id),
            ip_address=self._client_ip(request),
        )
        return Response(VitalPassportSerializer(obj).data)

    def put(self, request):
        obj = self.get_object()
        ser = VitalPassportSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        payload = {
            "blood_group": data.get("blood_group", ""),
            "allergies": data.get("allergies", []),
            "conditions": data.get("conditions", []),
            "medications": data.get("medications", []),
            "directives": data.get("directives", ""),
        }
        obj.organ_donor = data.get("organ_donor")
        obj.set_health_payload(payload)
        obj.save()
        AuditLog.objects.create(
            actor=request.user,
            action=AuditLog.Action.PASSPORT_UPDATE,
            target_type="VitalPassport",
            target_id=str(request.user.id),
            ip_address=self._client_ip(request),
        )
        return Response(VitalPassportSerializer(obj).data)

    @staticmethod
    def _client_ip(request):
        x = request.META.get("HTTP_X_FORWARDED_FOR")
        if x:
            return x.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
