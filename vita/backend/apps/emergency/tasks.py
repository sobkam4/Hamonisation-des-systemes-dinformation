from urllib.parse import quote

from celery import shared_task
from django.conf import settings

from apps.accounts.models import ICEContact
from apps.emergency.models import SOSEvent


@shared_task
def notify_ice_for_sos(event_id: int) -> None:
    try:
        ev = SOSEvent.objects.select_related("user").get(pk=event_id)
    except SOSEvent.DoesNotExist:
        return
    contacts = ICEContact.objects.filter(user=ev.user)[:5]
    lat = ev.latitude or ""
    lon = ev.longitude or ""
    maps = f"https://www.google.com/maps?q={quote(str(lat))},{quote(str(lon))}"
    body = f"Urgence VITA — position approximative: {maps}"
    sid = getattr(settings, "TWILIO_ACCOUNT_SID", "") or ""
    token = getattr(settings, "TWILIO_AUTH_TOKEN", "") or ""
    from_num = getattr(settings, "TWILIO_FROM_NUMBER", "") or ""
    if sid and token and from_num:
        from twilio.rest import Client

        client = Client(sid, token)
        for c in contacts:
            to = c.phone if c.phone.startswith("+") else f"+{c.phone.lstrip('0')}"
            try:
                client.messages.create(body=body, from_=from_num, to=to)
            except Exception:
                pass
    ev.ice_notified = True
    ev.save(update_fields=["ice_notified"])
