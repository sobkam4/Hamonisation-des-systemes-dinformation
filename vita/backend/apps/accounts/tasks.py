from celery import shared_task
from django.conf import settings


@shared_task
def send_otp_sms(phone: str, code: str) -> None:
    sid = getattr(settings, "TWILIO_ACCOUNT_SID", "") or ""
    token = getattr(settings, "TWILIO_AUTH_TOKEN", "") or ""
    from_num = getattr(settings, "TWILIO_FROM_NUMBER", "") or ""
    if sid and token and from_num:
        from twilio.rest import Client

        client = Client(sid, token)
        client.messages.create(
            body=f"VITA: votre code est {code}. Valide 10 min.",
            from_=from_num,
            to=phone if phone.startswith("+") else f"+{phone.lstrip('0')}",
        )
    elif settings.DEBUG:
        import logging

        logging.getLogger(__name__).warning("OTP (dev, no Twilio): %s -> %s", phone, code)
