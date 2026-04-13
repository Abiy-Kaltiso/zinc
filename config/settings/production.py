"""Production settings for Fly.io + Neon + Cloudflare R2."""
from .base import *  # noqa: F401, F403
from .base import env, BASE_DIR  # noqa: F401

DEBUG = False

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------
# Fly.io terminates TLS at its edge proxy and forwards HTTP internally.
# Trust the X-Forwarded-Proto header so Django treats requests as secure.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

# -----------------------------------------------------------------------------
# Static files (served by WhiteNoise)
# -----------------------------------------------------------------------------
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# -----------------------------------------------------------------------------
# Media files (Cloudflare R2, via django-storages S3 backend)
# -----------------------------------------------------------------------------
# R2 is S3-compatible. You provision an R2 bucket + API token in the
# Cloudflare dashboard and set these env vars on Fly.
AWS_ACCESS_KEY_ID = env("R2_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = env("R2_SECRET_ACCESS_KEY", default="")
AWS_STORAGE_BUCKET_NAME = env("R2_BUCKET_NAME", default="")
AWS_S3_ENDPOINT_URL = env("R2_ENDPOINT_URL", default="")  # https://<acct>.r2.cloudflarestorage.com
AWS_S3_REGION_NAME = "auto"
AWS_S3_ADDRESSING_STYLE = "virtual"
AWS_S3_SIGNATURE_VERSION = "s3v4"
# Uploaded files are private by default; we generate signed URLs on access.
AWS_DEFAULT_ACL = None
AWS_QUERYSTRING_AUTH = True
AWS_QUERYSTRING_EXPIRE = 3600  # 1 hour signed URL lifetime
AWS_S3_FILE_OVERWRITE = False

# Optional public custom domain (e.g. files.yourhoa.com). If unset, the SDK
# builds signed URLs pointing at the R2 endpoint directly.
R2_CUSTOM_DOMAIN = env("R2_CUSTOM_DOMAIN", default="")
if R2_CUSTOM_DOMAIN:
    AWS_S3_CUSTOM_DOMAIN = R2_CUSTOM_DOMAIN

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# -----------------------------------------------------------------------------
# Logging — write to stdout so Fly captures it
# -----------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": env("DJANGO_LOG_LEVEL", default="INFO"),
            "propagate": False,
        },
    },
}
