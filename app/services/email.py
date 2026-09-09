import os
import smtplib

from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()


SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = os.getenv("SMTP_PORT")
SMTP_USERNAME  = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")

def send_password_reset_email(
    recipient_email : str,
    reset_link : str       
) -> None:
    if not all([
        SMTP_HOST,
        SMTP_USERNAME,
        SMTP_PASSWORD,
        SMTP_FROM_EMAIL
    ]):
        raise RuntimeError(
            "SMTP configuration is incomplete"
        )

    message = EmailMessage()

    message["Subject"] =    "Reset your foodly  password"
    message["From"] = SMTP_FROM_EMAIL
    message["To"] = recipient_email

    message.set_content(
         f"""
Hello,

We received a request to reset your Foodly password.

Click the link below to create a new password:

{reset_link}

This link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
Foodly Team
"""
    )
    with smtplib.SMTP(
        SMTP_HOST,
        SMTP_PORT
    ) as server:

        server.starttls()

        server.login(
            SMTP_USERNAME,
            SMTP_PASSWORD
        )

        server.send_message(message)