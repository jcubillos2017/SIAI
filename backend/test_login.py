import asyncio
import getpass
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.security import verify_password

async def test_login():
    email = "jcubillos@presidencia.cl"
    password = getpass.getpass("Ingresa la contrasena a probar: ")
    
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    user = await client.siai.users.find_one({"email": email})
    
    if verify_password(password, user["password_hash"]):
        print("\n✅ ¡CONTRASEÑA CORRECTA! El hash coincide perfectamente en la BD.")
        print("   (Si esto sale bien, el problema está en la conexión web/frontend)")
    else:
        print("\n❌ ¡CONTRASEÑA INCORRECTA! El hash NO coincide.")
        print("   (Probablemente hubo un error de tipeo al crear el administrador)")

if __name__ == "__main__":
    asyncio.run(test_login())