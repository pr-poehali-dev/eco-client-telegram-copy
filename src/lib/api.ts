const AUTH_URL = "https://functions.poehali.dev/0e68532a-7bad-4967-9a8a-2c8e7cefba4e";
const CHAT_URL = "https://functions.poehali.dev/16cb355e-8286-4938-b33b-b42266294e35";

function getToken() {
  return localStorage.getItem("eco_token") || "";
}

function authHeaders() {
  return { "Content-Type": "application/json", "X-Session-Id": getToken() };
}

async function post(url: string, path: string, body: object, withAuth = false) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (withAuth) headers["X-Session-Id"] = getToken();
  const res = await fetch(url + path, { method: "POST", headers, body: JSON.stringify(body) });
  return res.json();
}

async function get(url: string, path: string) {
  const res = await fetch(url + path, { headers: authHeaders() });
  return res.json();
}

export const api = {
  register: (name: string, username: string, password: string) =>
    post(AUTH_URL, "/register", { name, username, password }),

  login: (username: string, password: string) =>
    post(AUTH_URL, "/login", { username, password }),

  me: () => get(AUTH_URL, "/me"),

  searchUsers: (q: string) => get(CHAT_URL, `/users/search?q=${encodeURIComponent(q)}`),

  dialogs: () => get(CHAT_URL, "/dialogs"),

  messages: (withId: number) => get(CHAT_URL, `/messages?with=${withId}`),

  sendMessage: (to_user_id: number, text: string) =>
    post(CHAT_URL, "/messages", { to_user_id, text }, true),
};
