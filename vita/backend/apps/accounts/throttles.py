from rest_framework.throttling import SimpleRateThrottle


class OTPRequestThrottle(SimpleRateThrottle):
    scope = "otp_request"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        phone = (request.data or {}).get("phone") or ""
        return self.cache_format % {"scope": self.scope, "ident": f"{ident}:{phone}"}


class OTPVerifyThrottle(SimpleRateThrottle):
    scope = "otp_verify"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        phone = (request.data or {}).get("phone") or ""
        return self.cache_format % {"scope": self.scope, "ident": f"{ident}:{phone}"}
