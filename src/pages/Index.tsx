import { useState } from "react";
import Icon from "@/components/ui/icon";

type Section = "chats" | "groups" | "contacts" | "profile" | "settings";

const MOCK_CHATS = [
  { id: 1, name: "Алексей Морозов", preview: "Документы отправил", time: "14:32", unread: 2, online: true },
  { id: 2, name: "Мария Ковалёва", preview: "Хорошо, увидимся завтра", time: "13:10", unread: 0, online: true },
  { id: 3, name: "Дмитрий Орлов", preview: "Когда будет готово?", time: "11:45", unread: 5, online: false },
  { id: 4, name: "Анна Белова", preview: "Принято, спасибо!", time: "вчера", unread: 0, online: false },
  { id: 5, name: "Павел Смирнов", preview: "Созвонимся в 17:00", time: "вчера", unread: 1, online: true },
];

const MOCK_GROUPS = [
  { id: 1, name: "Команда разработки", preview: "Игорь: деплой прошёл успешно", time: "15:01", members: 8, unread: 3 },
  { id: 2, name: "Проект Альфа", preview: "Встреча перенесена на пятницу", time: "12:30", members: 5, unread: 0 },
  { id: 3, name: "Маркетинг", preview: "Новый брифинг в папке", time: "вчера", members: 12, unread: 7 },
];

const MOCK_CONTACTS = [
  { id: 1, name: "Алексей Морозов", username: "@alex_m", online: true },
  { id: 2, name: "Анна Белова", username: "@anna_b", online: false },
  { id: 3, name: "Дмитрий Орлов", username: "@dmitry_o", online: false },
  { id: 4, name: "Мария Ковалёва", username: "@maria_k", online: true },
  { id: 5, name: "Павел Смирнов", username: "@pavel_s", online: true },
  { id: 6, name: "Игорь Фёдоров", username: "@igor_f", online: false },
];

const MOCK_MESSAGES = [
  { id: 1, from: "other", text: "Привет! Когда отправишь отчёт?", time: "14:10" },
  { id: 2, from: "me", text: "Добрый день! Готовлю, будет готово через час", time: "14:12" },
  { id: 3, from: "other", text: "Отлично, жду. Не забудь приложить таблицу с данными за квартал", time: "14:15" },
  { id: 4, from: "me", text: "Конечно, всё включу", time: "14:18" },
  { id: 5, from: "other", text: "Документы отправил", time: "14:32" },
];

const Avatar = ({ name, size = "md", online }: { name: string; size?: "sm" | "md" | "lg"; online?: boolean }) => {
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" };
  const dotSizes = { sm: "w-2 h-2", md: "w-2.5 h-2.5", lg: "w-3 h-3" };
  const hue = name.charCodeAt(0) % 360;
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-medium select-none`}
        style={{ background: `hsl(${hue}, 38%, 52%)`, color: "hsl(0,0%,95%)" }}
      >
        {initials}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-2`}
          style={{
            borderColor: "hsl(var(--background))",
            background: online ? "hsl(var(--eco-green))" : "hsl(0,0%,30%)",
          }}
        />
      )}
    </div>
  );
};

const EncryptedBadge = () => (
  <div
    className="flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px]"
    style={{
      color: "hsl(var(--eco-green))",
      background: "hsl(158 64% 52% / 0.08)",
      border: "1px solid hsl(158 64% 52% / 0.2)",
    }}
  >
    <Icon name="Lock" size={9} />
    <span>E2E</span>
  </div>
);

const NavItem = ({
  icon, label, active, badge, onClick,
}: {
  icon: string; label: string; active: boolean; badge?: number; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex flex-col items-center gap-1 py-2.5 px-1 relative group transition-all duration-200"
    style={{ color: active ? "hsl(var(--eco-green))" : "hsl(0,0%,45%)" }}
  >
    <div
      className="relative p-2 rounded-xl transition-all duration-200"
      style={{ background: active ? "hsl(158 64% 52% / 0.12)" : "transparent" }}
    >
      <Icon name={icon} size={18} />
      {badge && badge > 0 ? (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-semibold flex items-center justify-center"
          style={{ background: "hsl(var(--eco-green))", color: "hsl(0,0%,6%)" }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </div>
    <span className="text-[10px] font-medium leading-none">{label}</span>
  </button>
);

export default function Index() {
  const [section, setSection] = useState<Section>("chats");
  const [activeChat, setActiveChat] = useState<number | null>(1);
  const [msgInput, setMsgInput] = useState("");

  const totalUnread = MOCK_CHATS.reduce((acc, c) => acc + c.unread, 0) + MOCK_GROUPS.reduce((acc, g) => acc + g.unread, 0);

  const renderChatList = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "hsl(var(--muted))" }}>
          <Icon name="Search" size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
          <input
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "hsl(var(--foreground))" }}
            placeholder="Поиск чатов..."
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {MOCK_CHATS.map((chat) => (
          <button
            key={chat.id}
            onClick={() => setActiveChat(chat.id)}
            className="w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left"
            style={{
              background: activeChat === chat.id ? "hsl(158 64% 52% / 0.08)" : "transparent",
              borderLeft: activeChat === chat.id ? "2px solid hsl(var(--eco-green))" : "2px solid transparent",
            }}
          >
            <Avatar name={chat.name} online={chat.online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{chat.name}</span>
                <span className="text-[11px] flex-shrink-0 ml-2 font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>{chat.time}</span>
              </div>
              <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{chat.preview}</p>
            </div>
            {chat.unread > 0 && (
              <span
                className="w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--eco-green))", color: "hsl(0,0%,6%)" }}
              >
                {chat.unread}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderGroups = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[hsl(var(--border))] flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>Группы</span>
        <button className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
          <Icon name="Plus" size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {MOCK_GROUPS.map((group) => (
          <button
            key={group.id}
            className="w-full flex items-center gap-3 px-4 py-3 transition-all hover:bg-[hsl(var(--eco-surface-hover))] text-left border-l-2 border-transparent"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(158 64% 52% / 0.12)", border: "1px solid hsl(158 64% 52% / 0.25)" }}
            >
              <Icon name="Users" size={16} style={{ color: "hsl(var(--eco-green))" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{group.name}</span>
                <span className="text-[11px] flex-shrink-0 ml-2 font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>{group.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{group.preview}</p>
                <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: "hsl(var(--muted-foreground))" }}>{group.members} уч.</span>
              </div>
            </div>
            {group.unread > 0 && (
              <span
                className="w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--eco-green))", color: "hsl(0,0%,6%)" }}
              >
                {group.unread}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderContacts = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "hsl(var(--muted))" }}>
          <Icon name="Search" size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
          <input
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "hsl(var(--foreground))" }}
            placeholder="Найти контакт..."
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {MOCK_CONTACTS.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[hsl(var(--eco-surface-hover))] transition-colors cursor-pointer animate-fade-in"
          >
            <Avatar name={c.name} online={c.online} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{c.name}</p>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{c.username}</p>
            </div>
            <button
              className="p-1.5 rounded-lg transition-colors hover:bg-[hsl(var(--muted))]"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              <Icon name="MessageCircle" size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex flex-col items-center gap-4 px-6 py-8 border-b border-[hsl(var(--border))]">
        <Avatar name="Николай Терехов" size="lg" online={true} />
        <div className="text-center">
          <h2 className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>Николай Терехов</h2>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>@nikolay_t</p>
        </div>
        <div className="flex items-center gap-2">
          <EncryptedBadge />
          <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>Ключ актуален</span>
        </div>
      </div>
      <div className="px-4 py-4 space-y-1">
        {[
          { icon: "User", label: "Изменить имя" },
          { icon: "AtSign", label: "Изменить username" },
          { icon: "Phone", label: "Номер телефона" },
          { icon: "Image", label: "Фото профиля" },
          { icon: "Key", label: "Управление ключами E2E" },
        ].map(({ icon, label }) => (
          <button
            key={label}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--muted))] text-left transition-colors"
          >
            <Icon name={icon} size={15} style={{ color: "hsl(var(--eco-green))" }} />
            <span className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{label}</span>
            <Icon name="ChevronRight" size={13} className="ml-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>Настройки</span>
      </div>
      <div className="px-4 py-4 space-y-5">
        {[
          {
            title: "Приватность",
            items: ["Сквозное шифрование", "Двухфакторная аутентификация", "Блокировка приложения", "Скрытие статуса"],
            icons: ["Lock", "ShieldCheck", "Smartphone", "EyeOff"],
          },
          {
            title: "Уведомления",
            items: ["Push-уведомления", "Звуки", "Вибрация"],
            icons: ["Bell", "Volume2", "Vibrate"],
          },
          {
            title: "Данные",
            items: ["Автозагрузка медиа", "Резервная копия", "Очистить кэш"],
            icons: ["Download", "HardDrive", "Trash2"],
          },
        ].map((sec) => (
          <div key={sec.title}>
            <p className="text-[11px] font-medium uppercase tracking-widest px-3 mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{sec.title}</p>
            <div className="rounded-xl overflow-hidden border border-[hsl(var(--border))]">
              {sec.items.map((item, i) => (
                <button
                  key={item}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--muted))] text-left transition-colors"
                  style={{ borderBottom: i < sec.items.length - 1 ? "1px solid hsl(var(--border))" : "none" }}
                >
                  <Icon name={sec.icons[i]} size={15} style={{ color: "hsl(var(--eco-green))" }} />
                  <span className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{item}</span>
                  <Icon name="ChevronRight" size={13} className="ml-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSidebarContent = () => {
    switch (section) {
      case "chats": return renderChatList();
      case "groups": return renderGroups();
      case "contacts": return renderContacts();
      case "profile": return renderProfile();
      case "settings": return renderSettings();
      default: return null;
    }
  };

  const currentChat = MOCK_CHATS.find((c) => c.id === activeChat);

  return (
    <div className="flex h-screen overflow-hidden select-none" style={{ background: "hsl(var(--background))" }}>
      {/* Nav rail */}
      <nav
        className="w-[68px] flex-shrink-0 flex flex-col items-center py-4 border-r border-[hsl(var(--border))]"
        style={{ background: "hsl(0,0%,5%)" }}
      >
        <div className="mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--eco-green))" }}
          >
            <Icon name="Zap" size={16} style={{ color: "hsl(0,0%,6%)" }} />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-0.5 w-full px-2">
          <NavItem icon="MessageSquare" label="Чаты" active={section === "chats"} badge={totalUnread} onClick={() => setSection("chats")} />
          <NavItem icon="Users" label="Группы" active={section === "groups"} onClick={() => setSection("groups")} />
          <NavItem icon="Contact" label="Контакты" active={section === "contacts"} onClick={() => setSection("contacts")} />
        </div>
        <div className="flex flex-col gap-0.5 w-full px-2">
          <NavItem icon="User" label="Профиль" active={section === "profile"} onClick={() => setSection("profile")} />
          <NavItem icon="Settings" label="Настройки" active={section === "settings"} onClick={() => setSection("settings")} />
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className="w-[280px] flex-shrink-0 border-r border-[hsl(var(--border))] flex flex-col"
        style={{ background: "hsl(var(--card))" }}
      >
        {renderSidebarContent()}
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0">
        {section === "chats" && currentChat ? (
          <>
            {/* Chat header */}
            <header
              className="flex items-center gap-3 px-5 py-3.5 border-b border-[hsl(var(--border))]"
              style={{ background: "hsl(var(--background))" }}
            >
              <Avatar name={currentChat.name} online={currentChat.online} />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{currentChat.name}</h2>
                <span
                  className="text-xs"
                  style={{ color: currentChat.online ? "hsl(var(--eco-green))" : "hsl(var(--muted-foreground))" }}
                >
                  {currentChat.online ? "в сети" : "не в сети"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <EncryptedBadge />
                <button className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors ml-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Icon name="Phone" size={16} />
                </button>
                <button className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Icon name="Video" size={16} />
                </button>
                <button className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Icon name="MoreVertical" size={16} />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
              <div className="flex justify-center mb-2">
                <span
                  className="text-[10px] font-mono px-3 py-1 rounded-full"
                  style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted))" }}
                >
                  Сегодня · Сообщения зашифрованы
                </span>
              </div>
              {MOCK_MESSAGES.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[65%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed"
                    style={
                      msg.from === "me"
                        ? { background: "hsl(var(--eco-green))", color: "hsl(0,0%,8%)", borderBottomRightRadius: "4px" }
                        : { background: "hsl(var(--card))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", borderBottomLeftRadius: "4px" }
                    }
                  >
                    {msg.text}
                    <div className="flex items-center gap-1 mt-1 justify-end opacity-50">
                      <span className="text-[10px] font-mono">{msg.time}</span>
                      {msg.from === "me" && <Icon name="CheckCheck" size={11} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div
              className="px-5 py-3.5 border-t border-[hsl(var(--border))]"
              style={{ background: "hsl(var(--background))" }}
            >
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2 border transition-colors"
                style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
              >
                <button className="p-1 transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Icon name="Paperclip" size={16} />
                </button>
                <input
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "hsl(var(--foreground))" }}
                  placeholder="Сообщение..."
                  onKeyDown={(e) => e.key === "Enter" && setMsgInput("")}
                />
                <button className="p-1 transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Icon name="Smile" size={16} />
                </button>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity ml-1"
                  style={{ background: "hsl(var(--eco-green))" }}
                  onClick={() => setMsgInput("")}
                >
                  <Icon name="Send" size={14} style={{ color: "hsl(0,0%,6%)" }} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "hsl(158 64% 52% / 0.1)", border: "1px solid hsl(158 64% 52% / 0.2)" }}
            >
              <Icon name="MessageSquare" size={28} style={{ color: "hsl(var(--eco-green))" }} />
            </div>
            <div>
              <h2 className="text-base font-semibold mb-1" style={{ color: "hsl(var(--foreground))" }}>EcoClient</h2>
              <p className="text-sm max-w-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                Выберите чат для начала переписки. Все сообщения защищены сквозным шифрованием.
              </p>
            </div>
            <EncryptedBadge />
          </div>
        )}
      </main>
    </div>
  );
}
