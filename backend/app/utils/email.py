import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


def _send_email_sync(to_email: str, subject: str, body_html: str, body_text: str) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP parameters are not fully configured. Email was not sent.")
        return False

    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER

    # Create message container
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email

    # Attach plain-text and HTML parts
    msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    try:
        # Connect to SMTP
        if settings.SMTP_PORT == 587:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.starttls()
        elif settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)

        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        logger.info("Email successfully sent to %s", to_email)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


async def send_reset_password_email(to_email: str, token: str) -> bool:
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    subject = "Reset Your Password - Smart Expense Tracker"
    
    body_text = (
        f"Hello,\n\n"
        f"You requested a password reset for your Smart Expense Tracker account.\n"
        f"Please click the link below to reset your password:\n"
        f"{reset_link}\n\n"
        f"This link will expire in 15 minutes.\n\n"
        f"If you did not make this request, you can safely ignore this email."
    )
    
    body_html = f"""
    <html>
      <body style="font-family: sans-serif; background-color: #f2ede0; padding: 20px; margin: 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 2px solid #000000; border-radius: 8px; box-shadow: 4px 4px 0px 0px rgba(0,0,0,1); padding: 30px;">
          <h2 style="color: #000000; margin-top: 0; font-size: 24px; border-bottom: 2px dashed #000000; padding-bottom: 10px;">Reset Your Password</h2>
          <p style="font-size: 16px; color: #333333; font-weight: bold;">Hello,</p>
          <p style="font-size: 16px; color: #333333;">You requested a password reset for your Smart Expense Tracker account.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="{reset_link}" style="background-color: #bae6fd; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 16px; text-decoration: none; border: 2px solid #000000; border-radius: 4px; box-shadow: 4px 4px 0px 0px rgba(0,0,0,1); display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666666;">If you cannot click the button above, copy and paste this URL into your browser:</p>
          <p style="font-size: 14px; color: #000000; word-break: break-all; background-color: #faf8f5; padding: 10px; border: 1.5px solid #000000; border-radius: 4px; font-family: monospace;">{reset_link}</p>
          <p style="font-size: 12px; color: #999999; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 10px;">This link will expire in 15 minutes. If you did not make this request, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
    """
    
    # Run in a separate thread so SMTP network I/O doesn't block the async event loop
    return await asyncio.to_thread(_send_email_sync, to_email, subject, body_html, body_text)
