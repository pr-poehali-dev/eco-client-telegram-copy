"""
Аутентификация: регистрация и вход пользователей EcoClient.
POST /register — создать аккаунт (name, username, password)
POST /login    — войти (username, password) → session token
GET  /me       — получить профиль по токену
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def ok(data: dict, status: int = 200) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data)}

def err(msg: str, status: int = 400) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Некорректный JSON")

    conn = get_conn()
    cur = conn.cursor()

    # --- REGISTER ---
    if path.endswith("/register") and method == "POST":
        name = (body.get("name") or "").strip()
        username = (body.get("username") or "").strip().lower().lstrip("@")
        password = body.get("password") or ""

        if not name or not username or not password:
            conn.close()
            return err("Заполните имя, username и пароль")
        if len(username) < 3:
            conn.close()
            return err("Username должен быть не менее 3 символов")
        if len(password) < 6:
            conn.close()
            return err("Пароль должен быть не менее 6 символов")

        pw_hash = hash_password(password)
        token = secrets.token_hex(32)
        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.eco_users (name, username, password_hash) VALUES (%s, %s, %s) RETURNING id",
                (name, username, pw_hash)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
        except psycopg2.errors.UniqueViolation:
            conn.close()
            return err("Username уже занят", 409)

        conn.close()
        return ok({"token": f"{user_id}:{token}", "user": {"id": user_id, "name": name, "username": username}}, 201)

    # --- LOGIN ---
    if path.endswith("/login") and method == "POST":
        username = (body.get("username") or "").strip().lower().lstrip("@")
        password = body.get("password") or ""

        if not username or not password:
            conn.close()
            return err("Введите username и пароль")

        pw_hash = hash_password(password)
        cur.execute(
            f"SELECT id, name, username FROM {SCHEMA}.eco_users WHERE username = %s AND password_hash = %s",
            (username, pw_hash)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return err("Неверный username или пароль", 401)

        user_id, name, uname = row
        token = secrets.token_hex(32)
        return ok({"token": f"{user_id}:{token}", "user": {"id": user_id, "name": name, "username": uname}})

    # --- ME (GET profile by token) ---
    if path.endswith("/me") and method == "GET":
        token_header = event.get("headers", {}).get("X-Session-Id", "")
        if not token_header or ":" not in token_header:
            conn.close()
            return err("Не авторизован", 401)
        user_id = token_header.split(":")[0]
        if not user_id.isdigit():
            conn.close()
            return err("Не авторизован", 401)

        cur.execute(
            f"SELECT id, name, username FROM {SCHEMA}.eco_users WHERE id = %s",
            (int(user_id),)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return err("Пользователь не найден", 404)
        return ok({"user": {"id": row[0], "name": row[1], "username": row[2]}})

    conn.close()
    return err("Не найдено", 404)
