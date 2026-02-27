import asyncio
import getpass

from app.db.mongodb import init_mongodb
from app.models.user import User, Role
from app.core.security import get_password_hash


async def main():
    await init_mongodb()

    existing = await User.find_one(User.role == Role.ADMIN)
    if existing:
        print("Ya existe un administrador:", existing.email)
        return

    email = input("Email admin: ").strip().lower()
    password = getpass.getpass("Password admin: ").strip()

    admin = User(
        email=email,
        full_name="Administrador",
        role=Role.ADMIN,
        allowed_modules=["*"],
        is_active=True,
        must_change_password=False,
        password_hash=get_password_hash(password),
    )
    await admin.insert()
    print("Admin creado OK.")


if __name__ == "__main__":
    asyncio.run(main())
