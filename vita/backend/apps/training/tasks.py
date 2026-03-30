from celery import shared_task
from django.contrib.auth import get_user_model

User = get_user_model()


@shared_task
def send_spaced_revision_nudges():
    """Weekly nudge placeholder — extend with per-user quiz error analysis."""
    # In production: filter users with low scores in last attempts
    for u in User.objects.filter(is_active=True)[:100]:
        pass  # hook: push notification / email
    return "ok"
