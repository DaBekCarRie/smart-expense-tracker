import asyncio
import os
import uuid
import logging
import boto3
from botocore.config import Config
from app.config import settings

logger = logging.getLogger("app.storage")

class StorageService:
    def __init__(self):
        self.use_r2 = bool(
            settings.R2_ACCOUNT_ID and 
            settings.R2_ACCESS_KEY_ID and 
            settings.R2_SECRET_ACCESS_KEY and 
            settings.R2_BUCKET_NAME
        )
        
        if self.use_r2:
            logger.info("Cloudflare R2 storage credentials detected. Using R2 for uploads.")
            # Cloudflare R2 S3-API endpoint format:
            self.endpoint_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
            self.s3_client = boto3.client(
                service_name="s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4")
            )
        else:
            logger.info("Using local filesystem for file uploads (fallback).")

    async def save_receipt(self, file_bytes: bytes) -> str:
        """
        Saves receipt file bytes and returns the URL to access it.
        If Cloudflare R2 is configured, uploads to R2.
        Otherwise, saves to local disk under uploads/.
        """
        filename = f"{uuid.uuid4().hex}.webp"
        
        if self.use_r2:
            # Upload to Cloudflare R2 asynchronously using asyncio.to_thread to avoid blocking
            try:
                await asyncio.to_thread(
                    self.s3_client.put_object,
                    Bucket=settings.R2_BUCKET_NAME,
                    Key=filename,
                    Body=file_bytes,
                    ContentType="image/webp"
                )
                
                # Format public access URL
                public_url = settings.R2_PUBLIC_URL.rstrip("/") if settings.R2_PUBLIC_URL else ""
                if not public_url:
                    # Fallback to local endpoint url if public dev subdomain is not configured
                    public_url = f"{self.endpoint_url}/{settings.R2_BUCKET_NAME}"
                    
                return f"{public_url}/{filename}"
            except Exception as e:
                logger.error("Failed to upload to Cloudflare R2: %s. Falling back to local storage.", e)
                # Fallback to local storage on R2 error
                return self._save_locally(filename, file_bytes)
        else:
            return self._save_locally(filename, file_bytes)

    async def save_icon(self, file_bytes: bytes, original_filename: str) -> str:
        """Save a category icon and return its URL."""
        ext = os.path.splitext(original_filename)[1] or ".jpg"
        filename = f"cat_icon_{uuid.uuid4().hex}{ext}"

        if self.use_r2:
            content_type = "image/jpeg" if ext.lower() in (".jpg", ".jpeg") else f"image/{ext.lstrip('.').lower()}"
            try:
                await asyncio.to_thread(
                    self.s3_client.put_object,
                    Bucket=settings.R2_BUCKET_NAME,
                    Key=filename,
                    Body=file_bytes,
                    ContentType=content_type,
                )
                public_url = settings.R2_PUBLIC_URL.rstrip("/") if settings.R2_PUBLIC_URL else f"{self.endpoint_url}/{settings.R2_BUCKET_NAME}"
                return f"{public_url}/{filename}"
            except Exception as e:
                logger.error("Failed to upload icon to R2: %s. Falling back to local storage.", e)
                return await asyncio.to_thread(self._save_locally, filename, file_bytes)
        else:
            return await asyncio.to_thread(self._save_locally, filename, file_bytes)

    def _save_locally(self, filename: str, file_bytes: bytes) -> str:
        uploads_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        file_path = os.path.join(uploads_dir, filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        return f"/uploads/{filename}"

storage_service = StorageService()
