import logging
import sys
from alembic import command
from alembic.config import Config

def run_migrations():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    try:
        logger.info("Starting database migrations...")

        # Load Alembic configuration
        alembic_cfg = Config("alembic.ini")

        # Run migrations
        command.upgrade(alembic_cfg, "head")

        logger.info("Database migrations completed successfully.")
        return True
    except Exception as e:
        logger.error(f"Error during database migrations: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)
