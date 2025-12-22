import logging

from django.core.mail import send_mail
from django.conf import settings


logger = logging.getLogger(__name__)


def send_notification_email(user, subject: str, message: str) -> bool:
    """Send a simple notification email to a user.

    Returns True if send attempted (may still fail silently depending on backend), False if no recipient.
    """
    recipient = getattr(user, "email", None)
    if not recipient:
        logger.debug("User has no email address; skipping notification: %s", getattr(user, "id", None))
        return False

    try:
        res = send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@localhost"),
            recipient_list=[recipient],
            fail_silently=False,
        )
        logger.info(
            "Notification email sent to %s; subject=%s; send_mail_result=%s",
            recipient,
            subject,
            res,
        )
        return True
    except Exception:
        logger.exception("send_notification_email error for %s", recipient)
        return False
