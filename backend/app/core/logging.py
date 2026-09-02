import logging
import sys


def setup_logging():
    """Configures structured, clean logging for Revora AI."""
    log_format = "%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
