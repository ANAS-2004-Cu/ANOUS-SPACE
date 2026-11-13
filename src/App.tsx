import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertProvider } from './shared/context/AlertContext';
import { VaultProvider } from './shared/context/VaultContext';
import { VaultModal } from './shared/ui/VaultModal';
import { CommandPalette } from './shared/ui/CommandPalette';
import { HubHome } from './pages/HubHome';
import { ScratchpadPage } from './projects/scratchpad/ScratchpadPage';
import { TempMailHubPage } from './projects/temp-mail/TempMailHubPage';
import { TempMailInboxPage } from './projects/temp-mail/TempMailInboxPage';
import { GuerrillaInboxPage } from './projects/temp-mail/GuerrillaInboxPage';
import { EmailDetailPage } from './projects/temp-mail/EmailDetailPage';
import { TicTacToePage } from './projects/tic-tac-toe/TicTacToePage';
import { GuessGamePage } from './projects/guess-game/GuessGamePage';

const AppRoutes: React.FC = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<HubHome onOpenCommandPalette={openCommandPalette} />} />
        <Route
          path="/scratchpad"
          element={<ScratchpadPage onOpenCommandPalette={openCommandPalette} />}
        />
        <Route
          path="/temp-mail"
          element={<TempMailHubPage onOpenCommandPalette={openCommandPalette} />}
        />
        <Route
          path="/temp-mail/inbox"
          element={<TempMailInboxPage onOpenCommandPalette={openCommandPalette} />}
        />
        <Route
          path="/temp-mail/guerrilla-inbox"
          element={<GuerrillaInboxPage onOpenCommandPalette={openCommandPalette} />}
        />
        <Route
          path="/temp-mail/detail"
          element={<EmailDetailPage onOpenCommandPalette={openCommandPalette} />}
        />
        <Route
          path="/tic-tac-toe"
          element={<TicTacToePage onOpenCommandPalette={openCommandPalette} />}
        />
        <Route
          path="/tic-tac-toe-3"
          element={<Navigate to="/tic-tac-toe?variant=3-marker" replace />}
        />
        <Route
          path="/guess-game"
          element={<GuessGamePage onOpenCommandPalette={openCommandPalette} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CommandPalette open={commandPaletteOpen} onClose={closeCommandPalette} />
      <VaultModal />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AlertProvider>
        <VaultProvider>
          <AppRoutes />
        </VaultProvider>
      </AlertProvider>
    </BrowserRouter>
  );
};

export default App;
