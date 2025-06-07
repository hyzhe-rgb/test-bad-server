import { useState } from "react";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import Modals from "./Modals";
import { useTelegram } from "@/hooks/useTelegram";

export default function MainApp() {
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [showPremium, setShowPremium] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [callData, setCallData] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { user } = useTelegram();

  const openChat = (chat: any) => {
    setCurrentChat(chat);
  };

  const handleBack = () => {
    setCurrentChat(null);
  };

  const handleStartCall = async (type: "voice" | "video") => {
    if (!currentChat) return;

    try {
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("telegram_session")}`,
        },
        body: JSON.stringify({
          receiverId: currentChat.id,
          type,
          status: "initiated"
        }),
      });

      if (response.ok) {
        toast({
          title: `${type === "voice" ? "Голосовой" : "Видео"} звонок`,
          description: `Звоним ${currentChat.name}...`,
        });
      } else {
        throw new Error("Не удалось совершить звонок");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось совершить звонок",
        variant: "destructive",
      });
    }
  };

  const handleShowProfile = (user: any) => {
    setProfileUser(user);
    setShowProfile(true);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark", !isDarkMode);
  };

  return (
    <div className="h-screen flex flex-col sm:flex-row bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className={`${currentChat ? 'hidden sm:block' : 'block'} sm:flex-shrink-0`}>
        <Sidebar
          onOpenChat={openChat}
          currentChat={currentChat}
          onShowMenu={() => setShowMenu(true)}
          onShowSettings={() => setShowSettings(true)}
        />
      </div>

      <div className={`${currentChat ? 'block' : 'hidden sm:block'} flex-1`}>
        <ChatArea
          currentChat={currentChat}
          onStartCall={handleStartCall}
          onBack={isMobile ? () => setCurrentChat(null) : undefined}
          onShowProfile={handleShowProfile}
        />
      </div>

      <Modals
        showMenu={showMenu}
        onCloseMenu={() => setShowMenu(false)}
        showSettings={showSettings}
        onCloseSettings={() => setShowSettings(false)}
        showProfileEdit={showProfileEdit}
        onCloseProfileEdit={() => setShowProfileEdit(false)}
        showCreateGroup={showCreateGroup}
        onCloseCreateGroup={() => setShowCreateGroup(false)}
        showCreateChannel={showCreateChannel}
        onCloseCreateChannel={() => setShowCreateChannel(false)}
        showProfile={showProfile}
        onCloseProfile={() => setShowProfile(false)}
        profileUser={profileUser}
        showPremium={showPremium}
        onClosePremium={() => setShowPremium(false)}
        showCall={showCall}
        onCloseCall={() => setShowCall(false)}
        callData={callData}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onShowProfile={() => {
          setShowMenu(false);
          setShowProfile(true);
        }}
        onShowCreateGroup={() => {
          setShowMenu(false);
          setShowCreateGroup(true);
        }}
        onShowPremium={() => {
          setShowSettings(false);
          setShowPremium(true);
        }}
        user={user}
      />
    </div>
  );
}