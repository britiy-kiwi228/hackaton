#!/usr/bin/env python3
"""
Генератор криптографически стойкого JWT секрета
"""
import secrets
import base64

def generate_jwt_secret():
    """Генерирует криптографически стойкий JWT секрет"""
    # Генерируем 64 байта случайных данных (512 бит)
    secret_bytes = secrets.token_bytes(64)
    
    # Конвертируем в base64 для удобства использования
    secret_base64 = base64.b64encode(secret_bytes).decode('utf-8')
    
    # Также генерируем hex версию
    secret_hex = secret_bytes.hex()
    
    print("=== НОВЫЙ JWT СЕКРЕТ ===")
    print(f"Base64 (рекомендуется): {secret_base64}")
    print(f"Hex: {secret_hex}")
    print(f"Длина base64: {len(secret_base64)} символов")
    print(f"Длина hex: {len(secret_hex)} символов")
    print(f"Энтропия: {len(secret_bytes) * 8} бит")
    
    return secret_base64

if __name__ == "__main__":
    generate_jwt_secret()