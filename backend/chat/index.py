"""
Чат EcoClient:
GET  /users/search?q=username — поиск пользователей по username/имени
GET  /messages?with=user_id   — загрузить переписку с пользователем
POST /messages                — отправить сообщение {to_user_id, text}
GET  /dialogs                 — список диалогов (последнее сообщение + собеседник)
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def get_current_user_id(event: dict):
    token = event.get("headers", {}).get("X-Session-Id", "")
    if not token or ":" not in token:
        return None
    uid = token.split(":")[0]
    return int(uid) if uid.isdigit() else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Некорректный JSON")

    me = get_current_user_id(event)
    if me is None:
        return err("Не авторизован", 401)

    conn = get_conn()
    cur = conn.cursor()

    # --- SEARCH USERS ---
    if path.endswith("/users/search") and method == "GET":
        q = (params.get("q") or "").strip().lower().lstrip("@")
        if len(q) < 1:
            conn.close()
            return ok({"users": []})
        like = f"%{q}%"
        cur.execute(
            f"SELECT id, name, username FROM {SCHEMA}.eco_users WHERE (LOWER(username) LIKE %s OR LOWER(name) LIKE %s) AND id != %s LIMIT 20",
            (like, like, me)
        )
        rows = cur.fetchall()
        conn.close()
        return ok({"users": [{"id": r[0], "name": r[1], "username": r[2]} for r in rows]})

    # --- DIALOGS ---
    if path.endswith("/dialogs") and method == "GET":
        cur.execute(f"""
            SELECT DISTINCT ON (other_id)
                other_id,
                u.name,
                u.username,
                m.text,
                m.created_at,
                m.from_user_id
            FROM (
                SELECT
                    CASE WHEN from_user_id = %s THEN to_user_id ELSE from_user_id END AS other_id,
                    id, text, created_at, from_user_id
                FROM {SCHEMA}.eco_messages
                WHERE from_user_id = %s OR to_user_id = %s
            ) m
            JOIN {SCHEMA}.eco_users u ON u.id = m.other_id
            ORDER BY other_id, m.created_at DESC
        """, (me, me, me))
        rows = cur.fetchall()

        # unread counts
        cur.execute(f"""
            SELECT from_user_id, COUNT(*) FROM {SCHEMA}.eco_messages
            WHERE to_user_id = %s
            GROUP BY from_user_id
        """, (me,))
        unread_map = {r[0]: r[1] for r in cur.fetchall()}
        conn.close()

        dialogs = []
        for r in rows:
            other_id, name, username, text, ts, from_uid = r
            dialogs.append({
                "user": {"id": other_id, "name": name, "username": username},
                "last_message": {"text": text, "time": ts, "is_mine": from_uid == me},
                "unread": unread_map.get(other_id, 0),
            })
        dialogs.sort(key=lambda d: d["last_message"]["time"], reverse=True)
        return ok({"dialogs": dialogs})

    # --- GET MESSAGES ---
    if path.endswith("/messages") and method == "GET":
        with_id = params.get("with")
        if not with_id or not with_id.isdigit():
            conn.close()
            return err("Укажите with=user_id")
        with_id = int(with_id)
        cur.execute(f"""
            SELECT id, from_user_id, to_user_id, text, created_at
            FROM {SCHEMA}.eco_messages
            WHERE (from_user_id = %s AND to_user_id = %s)
               OR (from_user_id = %s AND to_user_id = %s)
            ORDER BY created_at ASC
            LIMIT 100
        """, (me, with_id, with_id, me))
        rows = cur.fetchall()
        conn.close()
        return ok({"messages": [
            {"id": r[0], "from_user_id": r[1], "to_user_id": r[2], "text": r[3], "time": r[4]}
            for r in rows
        ]})

    # --- SEND MESSAGE ---
    if path.endswith("/messages") and method == "POST":
        to_id = body.get("to_user_id")
        text = (body.get("text") or "").strip()
        if not to_id or not text:
            conn.close()
            return err("Укажите to_user_id и text")
        cur.execute(
            f"INSERT INTO {SCHEMA}.eco_messages (from_user_id, to_user_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
            (me, int(to_id), text)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({"message": {"id": row[0], "from_user_id": me, "to_user_id": to_id, "text": text, "time": row[1]}}, 201)

    conn.close()
    return err("Не найдено", 404)
