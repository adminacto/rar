"use client"

import { useState, useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import React from "react"

// Интерфейсы
interface User {
  id: string
  username: string
  email: string
  fullName: string
  avatar?: string
  bio?: string
  isOnline: boolean
  lastSeen: Date
  isVerified: boolean
  status: "online" | "away" | "busy" | "offline"
}

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  chatId: string
  timestamp: Date
  type: "text" | "image" | "file" | "audio" | "video"
  fileUrl?: string
  fileName?: string
  fileSize?: number
  isEncrypted: boolean
  reactions?: { emoji: string; userId: string; username: string }[]
  replyTo?: {
    id: string
    content: string
    senderName: string
  }
  isEdited?: boolean
  readBy?: string[]
}

interface Chat {
  id: string
  name: string
  avatar?: string
  description?: string
  lastMessage?: Message
  unreadCount: number
  isGroup: boolean
  participants: User[]
  messageCount: number
  type: "private" | "group" | "channel"
  isEncrypted: boolean
  createdBy: string
  createdAt: Date
  isPinned?: boolean
  isMuted?: boolean
  theme?: string
}

// Языки
const languages = [
  { code: "uz", name: "O'zbek", flag: "🇺🇿" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "en", name: "English", flag: "🇺🇸" },
]

const translations = {
  uz: {
    appName: "ACTOGRAM",
    welcome: "Xush kelibsiz",
    login: "Kirish",
    register: "Ro'yxatdan o'tish",
    email: "Email",
    password: "Parol",
    username: "Foydalanuvchi nomi",
    fullName: "To'liq ism",
    bio: "Haqida",
    online: "Onlayn",
    offline: "Oflayn",
    typing: "yozmoqda...",
    send: "Yuborish",
    search: "Qidirish...",
    newChat: "Yangi chat",
    settings: "Sozlamalar",
    profile: "Profil",
    darkMode: "Tungi rejim",
    notifications: "Bildirishnomalar",
    language: "Til",
    save: "Saqlash",
    cancel: "Bekor qilish",
    delete: "O'chirish",
    edit: "Tahrirlash",
    reply: "Javob berish",
    copy: "Nusxalash",
    forward: "Yuborish",
    pin: "Mahkamlash",
    mute: "Ovozsiz",
    archive: "Arxiv",
    block: "Bloklash",
    report: "Shikoyat",
    logout: "Chiqish",
    connecting: "Ulanmoqda...",
    connected: "Ulandi",
    disconnected: "Uzildi",
    encrypted: "Shifrlangan",
    verified: "Tasdiqlangan",
    members: "a'zolar",
    messages: "xabarlar",
    noMessages: "Xabarlar yo'q",
    startChat: "Suhbatni boshlang",
    searchUsers: "Foydalanuvchilarni qidiring",
    addMembers: "A'zolar qo'shish",
    createGroup: "Guruh yaratish",
    groupName: "Guruh nomi",
    groupDescription: "Guruh tavsifi",
    selectPhoto: "Rasm tanlash",
    takePhoto: "Rasm olish",
    chooseFromGallery: "Galereyadan tanlash",
    uploadFile: "Fayl yuklash",
    recording: "Yozib olish...",
    playback: "Ijro etish",
    fileSize: "Fayl hajmi",
    downloading: "Yuklab olish...",
    uploaded: "Yuklandi",
    failed: "Xatolik",
    retry: "Qayta urinish",
    comingSoon: "Tez orada...",
    beta: "Beta",
    pro: "Pro",
    premium: "Premium",
    free: "Bepul",
  },
  ru: {
    appName: "ACTOGRAM",
    welcome: "Добро пожаловать",
    login: "Войти",
    register: "Регистрация",
    email: "Email",
    password: "Пароль",
    username: "Имя пользователя",
    fullName: "Полное имя",
    bio: "О себе",
    online: "Онлайн",
    offline: "Оффлайн",
    typing: "печатает...",
    send: "Отправить",
    search: "Поиск...",
    newChat: "Новый чат",
    settings: "Настройки",
    profile: "Профиль",
    darkMode: "Темная тема",
    notifications: "Уведомления",
    language: "Язык",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    edit: "Редактировать",
    reply: "Ответить",
    copy: "Копировать",
    forward: "Переслать",
    pin: "Закрепить",
    mute: "Без звука",
    archive: "Архив",
    block: "Заблокировать",
    report: "Пожаловаться",
    logout: "Выйти",
    connecting: "Подключение...",
    connected: "Подключено",
    disconnected: "Отключено",
    encrypted: "Зашифровано",
    verified: "Подтвержден",
    members: "участников",
    messages: "сообщений",
    noMessages: "Нет сообщений",
    startChat: "Начните общение",
    searchUsers: "Поиск пользователей",
    addMembers: "Добавить участников",
    createGroup: "Создать группу",
    groupName: "Название группы",
    groupDescription: "Описание группы",
    selectPhoto: "Выбрать фото",
    takePhoto: "Сделать фото",
    chooseFromGallery: "Выбрать из галереи",
    uploadFile: "Загрузить файл",
    recording: "Запись...",
    playback: "Воспроизведение",
    fileSize: "Размер файла",
    downloading: "Загрузка...",
    uploaded: "Загружено",
    failed: "Ошибка",
    retry: "Повторить",
    comingSoon: "Скоро...",
    beta: "Бета",
    pro: "Про",
    premium: "Премиум",
    free: "Бесплатно",
  },
  en: {
    appName: "ACTOGRAM",
    welcome: "Welcome",
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    username: "Username",
    fullName: "Full Name",
    bio: "Bio",
    online: "Online",
    offline: "Offline",
    typing: "typing...",
    send: "Send",
    search: "Search...",
    newChat: "New Chat",
    settings: "Settings",
    profile: "Profile",
    darkMode: "Dark Mode",
    notifications: "Notifications",
    language: "Language",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    reply: "Reply",
    copy: "Copy",
    forward: "Forward",
    pin: "Pin",
    mute: "Mute",
    archive: "Archive",
    block: "Block",
    report: "Report",
    logout: "Logout",
    connecting: "Connecting...",
    connected: "Connected",
    disconnected: "Disconnected",
    encrypted: "Encrypted",
    verified: "Verified",
    members: "members",
    messages: "messages",
    noMessages: "No messages",
    startChat: "Start chatting",
    searchUsers: "Search users",
    addMembers: "Add members",
    createGroup: "Create group",
    groupName: "Group name",
    groupDescription: "Group description",
    selectPhoto: "Select photo",
    takePhoto: "Take photo",
    chooseFromGallery: "Choose from gallery",
    uploadFile: "Upload file",
    recording: "Recording...",
    playback: "Playback",
    fileSize: "File size",
    downloading: "Downloading...",
    uploaded: "Uploaded",
    failed: "Failed",
    retry: "Retry",
    comingSoon: "Coming soon...",
    beta: "Beta",
    pro: "Pro",
    premium: "Premium",
    free: "Free",
  },
}

// Эмодзи для реакций
const reactionEmojis = ["❤️", "👍", "👎", "😂", "😮", "😢", "😡", "🔥", "👏", "🎉"]

// Темы чата
const chatThemes = [
  { id: "default", name: "Default", colors: ["#3B82F6", "#1E40AF"] },
  { id: "purple", name: "Purple", colors: ["#8B5CF6", "#5B21B6"] },
  { id: "green", name: "Green", colors: ["#10B981", "#047857"] },
  { id: "pink", name: "Pink", colors: ["#EC4899", "#BE185D"] },
  { id: "orange", name: "Orange", colors: ["#F59E0B", "#D97706"] },
]

// Утилиты шифрования
const encryptMessage = (message: string): string => {
  return btoa(unescape(encodeURIComponent(message)))
}

const decryptMessage = (encrypted: string): string => {
  try {
    return decodeURIComponent(escape(atob(encrypted)))
  } catch {
    return encrypted
  }
}

// Основной компонент
export default function ActogramChat() {
  // Состояния
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    bio: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [language, setLanguage] = useState<"uz" | "ru" | "en">("uz")
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [selectedTheme, setSelectedTheme] = useState("default")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    type: "group",
    avatar: null as File | null,
    avatarPreview: "",
  })
  const [groupCreating, setGroupCreating] = useState(false)
  const groupAvatarInputRef = useRef<HTMLInputElement>(null)

  // Refs
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  const t = translations[language]

  // Внутри ActogramChat()
  const isAdmin = currentUser?.username === "@adminstator"
  const [adminTab, setAdminTab] = useState("news")
  const [newsText, setNewsText] = useState("")
  const [newsSending, setNewsSending] = useState(false)
  const [adminSearch, setAdminSearch] = useState("")
  const [adminResults, setAdminResults] = useState<User[]>([])
  const [banLoading, setBanLoading] = useState<string | null>(null)

  const handleSendNews = async () => {
    if (!newsText.trim()) return
    setNewsSending(true)
    setError("")
    try {
      const token = localStorage.getItem("actogram_token")
      const response = await fetch("https://actogr.onrender.com/api/bot-news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newsText }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Ошибка рассылки")
        return
      }
      setSuccess(`Новость отправлена (${data.count} чатов)`)
      setNewsText("")
    } catch (err) {
      setError("Ошибка рассылки")
    } finally {
      setNewsSending(false)
    }
  }

  const handleAdminSearch = async () => {
    if (!adminSearch.trim()) return
    setAdminResults([])
    setError("")
    try {
      const token = localStorage.getItem("actogram_token")
      const response = await fetch(`https://actogr.onrender.com/api/users-search?q=${encodeURIComponent(adminSearch)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok && Array.isArray(data.users)) {
        setAdminResults(data.users)
      } else {
        setError(data.error || "Ошибка поиска")
      }
    } catch {
      setError("Ошибка поиска")
    }
  }

  const handleBanUser = async (userId: string) => {
    setBanLoading(userId)
    setError("")
    try {
      const token = localStorage.getItem("actogram_token")
      const response = await fetch("https://actogr.onrender.com/api/ban-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Ошибка бана")
        return
      }
      setSuccess("Пользователь забанен")
      setAdminResults((prev) => prev.filter((u) => u.id !== userId))
    } catch {
      setError("Ошибка бана")
    } finally {
      setBanLoading(null)
    }
  }

  // Проверка мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setShowSidebar(!mobile)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Загрузка настроек
  useEffect(() => {
    const savedSettings = localStorage.getItem("actogram_settings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setDarkMode(settings.darkMode || false)
      setLanguage(settings.language || "uz")
      setNotifications(settings.notifications !== false)
      setSelectedTheme(settings.theme || "default")
    }

    const savedUser = localStorage.getItem("actogram_user")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      console.log("🔍 Загружен пользователь из localStorage:", user)
      setCurrentUser(user)
      setIsAuthenticated(true)
    }
  }, [])

  // Применение темной темы
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  // Подключение к серверу
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return

    const serverUrl = "https://actogon.onrender.com"
    socketRef.current = io(serverUrl, {
      transports: ["websocket", "polling"],
      auth: {
        token: localStorage.getItem("actogram_token"),
        userId: currentUser.id,
      },
    })

    const socket = socketRef.current

    socket.on("connect", () => {
      setIsConnected(true)
      loadChats()
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    socket.on("new_message", (message: Message) => {
      console.log("📨 Получено новое сообщение:", message)
      if (message.isEncrypted) {
        message.content = decryptMessage(message.content)
        console.log("🔓 Расшифрованное сообщение:", message.content)
      }
      setMessages((prev) => [...prev, message])
      updateChatLastMessage(message)
      if (notifications && message.senderId !== currentUser.id) {
        showNotification(message.senderName, message.content)
      }
    })

    socket.on("message_edited", (message: Message) => {
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)))
    })

    socket.on("message_deleted", (messageId: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    })

    socket.on("user_typing", (data: { userId: string; username: string; chatId: string }) => {
      if (data.chatId === selectedChat?.id && data.userId !== currentUser.id) {
        setTypingUsers((prev) => [...prev.filter((u) => u !== data.username), data.username])
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== data.username))
        }, 3000)
      }
    })

    socket.on("user_stop_typing", (data: { userId: string; chatId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== data.userId))
    })

    socket.on("users_update", (users: User[]) => {
      setActiveUsers(users)
    })

    socket.on("search_results", (results: User[]) => {
      setSearchResults(results)
    })

    socket.on("my_chats", (userChats: Chat[]) => {
      setChats(userChats)
    })

    socket.on("chat_messages", (data: { chatId: string; messages: Message[] }) => {
      if (data.chatId === selectedChat?.id) {
        setMessages(data.messages)
      }
    })

    socket.on("new_private_chat", (chat: Chat) => {
      console.log("🔍 Получен новый приватный чат:", chat)
      setChats((prev) => {
        const existingChat = prev.find((c) => c.id === chat.id)
        if (!existingChat) {
          return [...prev, chat]
        }
        return prev
      })
    })

    return () => {
        socket.disconnect()
      }
  }, [isAuthenticated, currentUser, selectedChat?.id, notifications])

  // Автоскролл
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Функции
  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" })
    }
  }

  const updateChatLastMessage = (message: Message) => {
    setChats((prev) => prev.map((chat) => (chat.id === message.chatId ? { ...chat, lastMessage: message } : chat)))
  }

  const handleAuth = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("https://actogon.onrender.com/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isLoginMode ? "login" : "register",
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error)
        return
      }

      console.log("🔍 Ответ сервера при аутентификации:", data)
      
      const user: User = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        fullName: data.user.fullName,
        avatar: data.user.avatar,
        bio: data.user.bio,
        isOnline: true,
        lastSeen: new Date(),
        isVerified: data.user.isVerified,
        status: "online",
      }

      console.log("🔍 Созданный пользователь:", user)
      
      setCurrentUser(user)
      setIsAuthenticated(true)
      setSuccess(isLoginMode ? "Успешный вход!" : "Регистрация завершена!")

      localStorage.setItem("actogram_user", JSON.stringify(user))
      localStorage.setItem("actogram_token", data.token)

      if ("Notification" in window) {
        Notification.requestPermission()
      }
    } catch (error) {
      setError("Ошибка подключения к серверу")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("actogram_user")
    localStorage.removeItem("actogram_token")
    setCurrentUser(null)
    setIsAuthenticated(false)
    setChats([])
    setMessages([])
    setSelectedChat(null)
    socketRef.current?.disconnect()
  }

  const loadChats = async () => {
    if (!currentUser) return
    
    try {
      // Загружаем чаты через REST API
      const token = localStorage.getItem("actogram_token")
      const response = await fetch("https://actogon.onrender.com/api/chats", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        const chats = await response.json()
        console.log("🔍 Загружены чаты из API:", chats)
        setChats(chats)
      } else {
        console.error("❌ Ошибка загрузки чатов:", response.status)
      }
    } catch (error) {
      console.error("❌ Ошибка загрузки чатов:", error)
    }
    
    // Также запрашиваем через Socket.IO для обновления в реальном времени
    if (socketRef.current && currentUser) {
      socketRef.current.emit("get_my_chats", currentUser.id)
    }
  }

  const loadMessages = async (chatId: string) => {
    if (!currentUser) return
    
    try {
      // Загружаем сообщения через REST API
      const token = localStorage.getItem("actogram_token")
      const response = await fetch(`https://actogon.onrender.com/api/messages/${chatId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        const messages = await response.json()
        console.log("🔍 Загружены сообщения из API:", messages)
        setMessages(messages)
      } else {
        console.error("❌ Ошибка загрузки сообщений:", response.status)
      }
    } catch (error) {
      console.error("❌ Ошибка загрузки сообщений:", error)
    }
    
    // Также запрашиваем через Socket.IO для обновления в реальном времени
    if (socketRef.current && currentUser) {
      socketRef.current.emit("get_messages", { chatId, userId: currentUser.id })
    }
  }

  const sendMessage = () => {
    console.log("🔍 Отладка sendMessage:", {
      currentUser: currentUser,
      currentUserId: currentUser?.id,
      selectedChat: selectedChat,
      newMessage: newMessage.trim(),
      socketRef: !!socketRef.current
    })
    
    if (!newMessage.trim() || !selectedChat || !currentUser || !socketRef.current) {
      console.log("❌ Не удается отправить сообщение:", {
        hasMessage: !!newMessage.trim(),
        hasChat: !!selectedChat,
        hasUser: !!currentUser,
        hasSocket: !!socketRef.current
      })
      return
    }

    console.log("📤 Отправка сообщения:", {
      content: newMessage.trim(),
      chatId: selectedChat.id,
      userId: currentUser.id,
      username: currentUser.username
    })

    const messageData = {
      content: encryptMessage(newMessage.trim()),
      chatId: selectedChat.id,
      type: "text",
      isEncrypted: true,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content,
            senderName: replyingTo.senderName,
          }
        : undefined,
    }

    console.log("📤 Данные сообщения для отправки:", messageData)
    socketRef.current.emit("send_message", messageData)
    setNewMessage("")
    setReplyingTo(null)
    stopTyping()
  }

  const selectChat = (chat: Chat) => {
    setSelectedChat(chat)
    setReplyingTo(null)
    setEditingMessage(null)
    loadMessages(chat.id)
    if (isMobile) setShowSidebar(false)
    if (socketRef.current) {
      socketRef.current.emit("join_chat", chat.id)
    }
  }

  const startTyping = () => {
    if (selectedChat && socketRef.current && currentUser) {
      socketRef.current.emit("typing", {
        chatId: selectedChat.id,
        userId: currentUser.id,
        username: currentUser.username,
      })

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(stopTyping, 1000)
    }
  }

  const stopTyping = () => {
    if (selectedChat && socketRef.current) {
      socketRef.current.emit("stop_typing", { chatId: selectedChat.id })
    }
  }

  const searchUsers = (query: string) => {
    if (!query.trim() || !socketRef.current) {
      setSearchResults([])
      return
    }
    socketRef.current.emit("search_users", query)
  }

  const startPrivateChat = (user: User) => {
    if (!currentUser || !socketRef.current) return

    const chatId = `private_${[currentUser.id, user.id].sort().join("_")}`
    const existingChat = chats.find((chat) => chat.id === chatId)

    if (existingChat) {
      selectChat(existingChat)
      setShowUserSearch(false)
      return
    }

    const newChat: Chat = {
      id: chatId,
      name: user.fullName || user.username,
      avatar: user.avatar,
      isGroup: false,
      participants: [currentUser, user],
      unreadCount: 0,
      messageCount: 0,
      type: "private",
      isEncrypted: true,
      createdBy: currentUser.id,
      createdAt: new Date(),
    }

    setChats((prev) => [...prev, newChat])
    selectChat(newChat)
    setShowUserSearch(false)

    console.log("🔍 Создание приватного чата:", {
      userId: user.id,
      chatId,
      createdBy: currentUser.id,
    })
    
    socketRef.current.emit("create_private_chat", {
      userId: user.id,
      chatId,
      createdBy: currentUser.id,
    })
  }

  const addReaction = (messageId: string, emoji: string) => {
    if (!currentUser || !socketRef.current) return

    socketRef.current.emit("add_reaction", {
      messageId,
      emoji,
      userId: currentUser.id,
      username: currentUser.username,
    })
  }

  const saveSettings = () => {
    const settings = { darkMode, language, notifications, theme: selectedTheme }
    localStorage.setItem("actogram_settings", JSON.stringify(settings))
  }

  // Исправить ошибку с value в handleInputChange
  const handleInputChange = (field: string, value: string) => {
    if (field === "username") {
      let newValue = value.replace(/\s/g, "")
      if (!newValue.startsWith("@")) newValue = "@" + newValue
      if (newValue.length > 21) newValue = newValue.slice(0, 21)
      setFormData((prev) => ({ ...prev, [field]: newValue }))
      setError("")
      return
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleGroupFormChange = (field: string, value: any) => {
    setGroupForm((prev) => ({ ...prev, [field]: value }))
  }
  const handleGroupAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleGroupFormChange("avatar", file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      handleGroupFormChange("avatarPreview", ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }
  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      setError("Введите название группы/канала")
      return
    }
    setGroupCreating(true)
    setError("")
    try {
      const formData = new FormData()
      formData.append("name", groupForm.name.trim())
      formData.append("description", groupForm.description)
      formData.append("type", groupForm.type)
      if (groupForm.avatar) formData.append("avatar", groupForm.avatar)
      // Можно добавить участников позже
      const token = localStorage.getItem("actogram_token")
      const response = await fetch("https://actogon.onrender.com/api/create-group", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Ошибка создания группы/канала")
        return
      }
      setChats((prev) => [...prev, data.chat])
      setShowCreateGroup(false)
      setGroupForm({ name: "", description: "", type: "group", avatar: null, avatarPreview: "" })
      setSuccess("Группа/канал создан!")
    } catch (err) {
      setError("Ошибка создания группы/канала")
    } finally {
      setGroupCreating(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Реализовать загрузку аватара пользователя
  };

  const filteredChats = chats.filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Стили
  const gradientBg = `bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900`
  const cardStyle = `backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/50 shadow-xl`
  const buttonStyle = `transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`
  const inputStyle = `backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400`

  // Проверка домена
  const hostname = typeof window !== "undefined" ? window.location.hostname : ""
  const allowedDomains = ["actogram-uz.vercel.app"]
  const isDomainAllowed = allowedDomains.includes(hostname)

  if (!isDomainAllowed) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 bg-red-50`}> 
        <div className="max-w-md bg-white p-8 rounded-xl shadow-xl border border-red-200 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещён</h1>
          <p>Этот сайт доступен только на <b>actogram-uz.vercel.app</b></p>
          <p className="text-gray-500 mt-2">Проверьте адрес в браузере</p>
        </div>
      </div>
    )
  }

  // Экран аутентификации
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${gradientBg} flex items-center justify-center p-4`}>
        <div className={`w-full max-w-md ${cardStyle} animate-in fade-in-50 duration-500`}>
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-green-600 dark:text-green-400">End-to-End Encrypted</span>
            </div>
          </div>

          <div className="p-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIsLoginMode(true)}
                className={`${buttonStyle} bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700`}
              >
                  {t.login}
              </button>
              <button
                onClick={() => setIsLoginMode(false)}
                className={`${buttonStyle} bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700`}
              >
                  {t.register}
              </button>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </span>
                  {t.email}
                </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={inputStyle}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                    <span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>
                      </svg>
                    </span>
                    {t.password}
                    </label>
                  <div className="relative">
                      <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={`${inputStyle} pr-10`}
                    />
                      <button
                      type="button"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
                      </button>
                  </div>
                </div>
                  </div>
                  </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t.language}</label>
              <div className="flex gap-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as "uz" | "ru" | "en")}
                    className={`${buttonStyle} ${language === lang.code ? "bg-blue-600 text-white" : "bg-white/20 text-white border-0"}`}
                  >
                    {lang.flag}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-600 dark:text-green-400">{success}</p>
              </div>
            )}

            <button
              onClick={handleAuth}
              className={`w-full ${buttonStyle} bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700`}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  {t.connecting}
                </div>
              ) : isLoginMode ? (
                t.login
              ) : (
                t.register
              )}
            </button>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                {isLoginMode ? "Нет аккаунта?" : "Есть аккаунт?"}{" "}
                <button
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {isLoginMode ? t.register : t.login}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Основной интерфейс чата
  return (
    <div className={`h-screen flex ${darkMode ? "dark" : ""}`}>
      <div className={`h-screen flex ${gradientBg} w-full relative overflow-hidden`}>
        {/* Боковая панель */}
        <div
          className={`${
            isMobile ? "fixed inset-y-0 left-0 z-50 w-full" : "w-80 min-w-80"
          } ${cardStyle} border-r flex flex-col transition-all duration-300 ${
            isMobile && !showSidebar ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          {/* Заголовок */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t.appName}</h1>
                  <p className="text-xs text-blue-100">
                    {isConnected ? (
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M23 10a11.5 11.5 0 0 1-23 0"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        {t.connected}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M23 10a11.5 11.5 0 0 1-23 0"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        {t.disconnected}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white border-0 rounded-full px-3 py-1 text-sm font-medium">{currentUser?.username}</span>
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-white hover:bg-white/20 p-2 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2-1H6a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.06.06a2 2 0 0 0 0 2.83l.06.06a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.06-.06a2 2 0 0 0 0-2.83l-.06-.06a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Поиск */}
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"><path d="M19 11a7 7 0 0 1-7 7"/><path d="M11 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>
              <input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${inputStyle}`}
              />
            </div>
            <button
              onClick={() => setShowUserSearch(true)}
              className={`w-full ${buttonStyle}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
                  {t.newChat}
            </button>
            <button
              onClick={() => setShowCreateGroup(true)}
              className={`w-full mt-2 ${buttonStyle}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>
              Создать группу/канал
            </button>
          </div>

          {/* Список чатов */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => {
              // Для приватного чата показывай имя собеседника
              const isPrivate = chat.type === "private"
              const otherUser = isPrivate
                ? chat.participants.find((u) => u.id !== currentUser?.id)
                : null
              const chatDisplayName = isPrivate
                ? otherUser?.fullName || otherUser?.username || "Неизвестно"
                : chat.name
              return (
              <div
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`p-4 border-b cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  selectedChat?.id === chat.id
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-l-4 border-l-blue-500"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
                    {!chat.isGroup && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{chatDisplayName}</h3>
                          {chat.isEncrypted && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-green-500">
                              <path d="M16 3H8a5 5 0 0 0-5 5v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a5 5 0 0 0-5-5z"/>
                              <path d="M16 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                            </svg>
                          )}
                          {chat.isPinned && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-yellow-500">
                              <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
                            </svg>
                          )}
                      </div>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {chat.lastMessage.senderName}: {chat.lastMessage.content}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>
                          {chat.participants.length} {t.members}
                        </span>
                        <span>•</span>
                        <span>
                          {chat.messageCount} {t.messages}
                        </span>
                      </div>
                      {chat.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">{chat.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </div>

        {/* Область чата */}
        <div className={`flex-1 flex flex-col min-w-0 ${isMobile && showSidebar ? "hidden" : "flex"}`}>
          {selectedChat ? (
            <>
              {/* Заголовок чата */}
              <div className={`p-4 ${cardStyle} border-b flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <button
                      onClick={() => setShowSidebar(true)}
                      className="text-white hover:bg-white/20 p-2 rounded-full"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg>
                    </button>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{selectedChat.name}</h2>
                      {selectedChat.isEncrypted && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-500">
                          <path d="M16 3H8a5 5 0 0 0-5 5v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a5 5 0 0 0-5-5z"/>
                          <path d="M16 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {selectedChat.isGroup
                        ? `${selectedChat.participants.length} ${t.members}`
                        : selectedChat.participants
                        .filter((u) => u.id !== currentUser?.id)
                        .map((u) => u.fullName || u.username)
                        .join(", ")}
                    </p>
                  </div>
                </div>
                </div>
              {/* ... здесь остальные элементы области чата ... */}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Выберите чат для начала общения</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}