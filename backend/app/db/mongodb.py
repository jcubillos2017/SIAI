from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import settings
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.computer import Computer
from app.models.import_batch import ImportBatch


async def init_mongodb() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB]
    await init_beanie(database=db, document_models=[User, RefreshToken, Computer, ImportBatch])
