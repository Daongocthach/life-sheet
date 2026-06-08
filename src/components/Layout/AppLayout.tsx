import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChatbotAI } from './ChatbotAI';
import { useWindowSize } from '../../hooks/useWindowSize';
import { MessageSquare } from 'lucide-react';

interface AppLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExportExcel: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  onExportExcel,
  children,
}) => {
  const { isMobile } = useWindowSize();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--background)',
      }}
    >
      {/* Mobile Top Bar */}
      {isMobile && (
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
        />
      )}

      {/* Left Column: Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportExcel={onExportExcel}
        isOpen={!isMobile || isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Overlay background for Mobile Sidebar Drawer */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(2, 6, 23, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
          }}
        />
      )}

      {/* Middle Column: Central Content */}
      <main
        style={{
          flex: 1,
          height: isMobile ? 'calc(100vh - 64px)' : '100vh',
          overflowY: 'auto',
          padding: isMobile ? '16px' : '32px',
          backgroundColor: 'var(--background)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>

      {/* Right Column: Chatbot */}
      <ChatbotAI isOpen={!isMobile || isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Overlay background for Mobile Chat Drawer */}
      {isMobile && isChatOpen && (
        <div
          onClick={() => setIsChatOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(2, 6, 23, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 94,
          }}
        />
      )}

      {/* Floating Action Button (FAB) for Mobile Chatbot */}
      {isMobile && !isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: '1.6rem',
            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
            zIndex: 80,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MessageSquare size={24} color="white" />
        </button>
      )}
    </div>
  );
};
