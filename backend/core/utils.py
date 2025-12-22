import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def send_notification_email(user, subject: str, message: str) -> bool:
    """Send a simple notification email to a user via SendGrid API.

    Returns True if sent successfully (status code 200/201/202), False otherwise.
    """
    recipient = getattr(user, "email", None)
    if not recipient:
        logger.debug("User has no email address; skipping notification: %s", getattr(user, "id", None))
        return False

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        sg = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        email = Mail(
            from_email=settings.DEFAULT_FROM_EMAIL,
            to_emails=recipient,
            subject=subject,
            plain_text_content=message,
        )
        response = sg.send(email)
        logger.info(
            "Notification email sent to %s; subject=%s; status_code=%s",
            recipient,
            subject,
            response.status_code,
        )
        return response.status_code in [200, 201, 202]
    except Exception:
        logger.exception("send_notification_email error for %s", recipient)
        return False
