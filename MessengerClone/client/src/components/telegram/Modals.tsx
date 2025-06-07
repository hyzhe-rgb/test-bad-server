import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, Users, Megaphone, BookMarked, Phone, Settings, 
  Moon, Sun, X, PhoneOff, Mic, MicOff, Video, VideoOff, Star,
  Upload, Zap, Palette, Heart 
} from "lucide-react";
import { useTelegram } from "@/hooks/useTelegram";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ModalsProps {
  showMenu: boolean;
  onCloseMenu: () => void;
  showSettings: boolean;
  onCloseSettings: () => void;
  showProfile: boolean;
  onCloseProfile: () => void;
  showCreateGroup: boolean;
  onCloseCreateGroup: () => void;
  showPremium: boolean;
  onClosePremium: () => void;
  showCall: boolean;
  onCloseCall: () => void;
  callData: any;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onShowProfile: () => void;
  onShowCreateGroup: () => void;
  onShowPremium: () => void;
  user: any;
}

export default function Modals({
  showMenu,
  onCloseMenu,
  showSettings,
  onCloseSettings,
  showProfile,
  onCloseProfile,
  showCreateGroup,
  onCloseCreateGroup,
  showPremium,
  onClosePremium,
  showCall,
  onCloseCall,
  callData,
  isDarkMode,
  onToggleTheme,
  onShowProfile,
  onShowCreateGroup,
  onShowPremium,
  user,
}: ModalsProps) {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupUsername, setGroupUsername] = useState("");
  const [isChannel, setIsChannel] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState("");
  const [showPhone, setShowPhone] = useState(user?.showPhone || false);

  const { updateUser, logout } = useTelegram();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      const sessionId = localStorage.getItem("telegram_session");
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionId}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      return response.json();
    },
    onSuccess: (newChat) => {
      toast({
        title: "Успешно",
        description: isChannel ? "Канал создан" : "Группа создана",
      });

      // Принудительно обновляем данные
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });

      // Обновляем сразу
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/chats"] });
        queryClient.refetchQueries({ queryKey: ["/api/users"] });
      }, 100);

      onCloseCreateGroup();
      setGroupName("");
      setGroupDescription("");
      setGroupUsername("");
      setIsChannel(false);
    },
    onError: (error: any) => {
      let errorMessage = "Не удалось создать группу";
      if (error.message?.includes("Username already taken")) {
        errorMessage = "Имя пользователя уже занято";
      }
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название группы",
        variant: "destructive",
      });
      return;
    }

    createGroupMutation.mutate({
      name: groupName,
      description: groupDescription,
      username: groupUsername || undefined,
      type: isChannel ? "channel" : "group",
    });
  };

  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      toast({
        title: "Профиль обновлен",
        description: "Изменения сохранены",
      });

      // Обновляем данные пользователя
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });

      onCloseProfile();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить изменения",
        variant: "destructive",
      });
    },
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    updateUserMutation.mutate({
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      username: formData.get("username") as string,
      showPhone: formData.get("showPhone") === "on",
    });
  };

  const getAvatarFallback = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const activatePremium = async () => {
    try {
      const sessionId = localStorage.getItem("telegram_session");
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionId}`,
        },
        body: JSON.stringify({
          isPremium: true,
        }),
      });

      if (response.ok) {
        toast({
          title: "Поздравляем!",
          description: "Quickgram Premium активирован бесплатно!",
        });
        onClosePremium();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error("Failed to activate premium");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось активировать Premium",
        variant: "destructive",
      });
    }
  };

  // Menu Overlay
  if (showMenu) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onCloseMenu}>
        <div 
          className="w-80 h-full bg-white dark:bg-gray-800 shadow-xl slide-in-left" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.avatar} alt={user?.firstName} />
                <AvatarFallback className="telegram-blue text-white text-lg">
                  {getAvatarFallback(`${user?.firstName} ${user?.lastName || ""}`)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName || ""}
                  </h3>
                  {user?.isPremium && (
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.phone}
                </p>
              </div>
            </div>
          </div>

          <div className="py-2">
            <button
              onClick={onShowProfile}
              className="w-full px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
            >
              <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <span className="text-gray-900 dark:text-white">Мой профиль</span>
            </button>

            <button
              onClick={onShowCreateGroup}
              className="w-full px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
            >
              <Users className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <span className="text-gray-900 dark:text-white">Новая группа</span>
            </button>

            <button 
              onClick={() => {
                onCloseMenu();
                setGroupName("");
                setGroupDescription("");
                setGroupUsername("");
                setIsChannel(true);
                onShowCreateGroup();
              }}
              className="w-full px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
            >
              <Megaphone className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <span className="text-gray-900 dark:text-white">Новый канал</span>
            </button>

            <button className="w-full px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3">
              <BookMarked className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <span className="text-gray-900 dark:text-white">Избранное</span>
            </button>

            <button className="w-full px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <span className="text-gray-900 dark:text-white">Звонки</span>
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

            <div className="px-6 py-3">
              <button
                onClick={() => {
                  onToggleTheme();
                  onCloseMenu();
                }}
                className="w-full flex items-center justify-between py-2 text-gray-900 dark:text-white"
              >
                <div className="flex items-center space-x-3">
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span className="text-gray-900 dark:text-white">
                    {isDarkMode ? "Светлая тема" : "Тёмная тема"}
                  </span>
                </div>
              </button>

              <button
                onClick={async () => {
                  await logout();
                  onCloseMenu();
                }}
                className="w-full flex items-center space-x-3 py-2 text-red-600 dark:text-red-400"
              >
                <X className="h-5 w-5" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={onCloseSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Настройки
              <Button variant="ghost" size="icon" onClick={onCloseSettings}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Аккаунт</h3>

              <button
                onClick={() => {
                  onCloseSettings();
                  onShowProfile();
                }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
              >
                <User className="h-4 w-4" />
                <span>Редактировать профиль</span>
              </button>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Номер телефона</span>
                  <span className="text-sm text-gray-500">{user?.phone}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Изменить номер
                </Button>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Безопасность</h3>

              <div className="space-y-2">
                <span className="text-sm">Пароль для входа</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    const password = prompt("Введите новый пароль (минимум 4 символа):");
                    if (password && password.length >= 4) {
                      // Save password to localStorage for specific phone
                      localStorage.setItem(`account_password_${user?.phone}`, password);
                      toast({
                        title: "Пароль установлен",
                        description: "Теперь для входа потребуется пароль",
                      });
                    } else if (password) {
                      toast({
                        title: "Ошибка",
                        description: "Пароль должен содержать минимум 4 символа",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  {localStorage.getItem(`account_password_${user?.phone}`) ? "Изменить пароль" : "Установить пароль"}
                </Button>
                {localStorage.getItem(`account_password_${user?.phone}`) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      localStorage.removeItem(`account_password_${user?.phone}`);
                      toast({
                        title: "Пароль удален",
                        description: "Пароль для входа больше не требуется",
                      });
                    }}
                  >
                    Удалить пароль
                  </Button>
                )}
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Конфиденциальность</h3>

              <div className="flex items-center justify-between">
                <span className="text-sm">Показывать номер телефона</span>
                <Switch defaultChecked={user?.showPhone} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Последнее посещение</span>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Чтение сообщений</span>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Уведомления</h3>

              <div className="flex items-center justify-between">
                <span className="text-sm">Уведомления</span>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Автозагрузка медиа</span>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <Button
                onClick={onShowPremium}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                <Star className="h-4 w-4 mr-2" />
                Quickgram Premium
              </Button>

              <Button
                onClick={onToggleTheme}
                variant="outline"
                className="w-full"
              >
                {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {isDarkMode ? "Светлая тема" : "Тёмная тема"}
              </Button>

              <Button
                onClick={async () => {
                  await logout();
                  onCloseSettings();
                }}
                variant="destructive"
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Выйти из аккаунта
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={showProfile} onOpenChange={onCloseProfile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.avatar} alt={user?.firstName} />
                  <AvatarFallback className="telegram-blue text-white text-xl">
                    {getAvatarFallback(`${user?.firstName} ${user?.lastName || ""}`)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // TODO: Implement avatar upload
                      toast({
                        title: "Функция в разработке",
                        description: "Загрузка аватара будет доступна в следующем обновлении",
                      });
                    }
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Нажмите для изменения фото
              </p>
            </div>

            <div>
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user?.firstName}
                required
              />
            </div>

            <div>
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={user?.lastName}
              />
            </div>

            <div>
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                name="username"
                defaultValue={user?.username}
                placeholder="@username"
              />
            </div>

            <div>
              <Label htmlFor="bio">О себе</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Расскажите о себе..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="showPhone"
                name="showPhone"
                defaultChecked={user?.showPhone}
              />
              <Label htmlFor="showPhone">Показывать номер телефона</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCloseProfile}>
                Отмена
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "Сохранение..." : "Применить"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Group Modal */}
      <Dialog open={showCreateGroup} onOpenChange={onCloseCreateGroup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isChannel ? "Создать канал" : "Создать группу"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isChannel"
                checked={isChannel}
                onCheckedChange={setIsChannel}
              />
              <Label htmlFor="isChannel">Создать канал</Label>
            </div>

            <div>
              <Label htmlFor="groupName">Название {isChannel ? "канала" : "группы"}</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={`Введите название ${isChannel ? "канала" : "группы"}`}
                required
              />
            </div>

            <div>
              <Label htmlFor="groupDescription">Описание (необязательно)</Label>
              <Textarea
                id="groupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Описание..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="groupUsername">Публичная ссылка (необязательно)</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  t.me/
                </span>
                <Input
                  id="groupUsername"
                  value={groupUsername}
                  onChange={(e) => setGroupUsername(e.target.value)}
                  placeholder="username"
                  className="rounded-l-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCloseCreateGroup}
              >
                Отмена
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? "Создание..." : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Premium Modal */}
      <Dialog open={showPremium} onOpenChange={onClosePremium}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Quickgram Premium</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Получите больше возможностей</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Увеличенные лимиты, эксклюзивные стикеры и многое другое
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Upload className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Загрузка файлов до 4 ГБ</span>
              </div>
              <div className="flex items-center space-x-3">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="text-sm">Эксклюзивные стикеры</span>
              </div>
              <div className="flex items-center space-x-3">
                <Palette className="h-5 w-5 text-purple-500" />
                <span className="text-sm">Персонализация интерфейса</span>
              </div>
            </div>

            <Button 
              onClick={activatePremium}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              Активировать Quickgram Premium БЕСПЛАТНО
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Modal */}
      <Dialog open={showCall} onOpenChange={onCloseCall}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center space-y-6">
            <div>
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={callData?.avatar} alt={callData?.name} />
                <AvatarFallback className="telegram-blue text-white text-2xl">
                  {callData?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{callData?.name}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {callData?.type === "video" ? "Видеозвонок" : "Звонок"}
              </p>
            </div>

            <div className="flex justify-center space-x-8">
              <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>

              {callData?.type === "video" && (
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                >
                  {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                </Button>
              )}

              <Button
                variant="destructive"
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={onCloseCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```