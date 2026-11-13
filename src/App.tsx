import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertProvider } from './shared/context/AlertContext';
import { VaultProvider } from './shared/context/VaultContext';
import { VaultModal } from './shared/ui/VaultModal';
import { CommandPalette } from './shared/ui/CommandPalette';
import { PhaseTwoPlaceholder } from './shared/ui/PhaseTwoPlaceholder';
import { HubHome } from './pages/HubHome';
import { ScratchpadPage } from './projects/scratchpad/ScratchpadPage';

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
          path="/temp-mail/*"
          element={
            <PhaseTwoPlaceholder
              title="Temp-Mail Client"
              description="Multi-provider disposable email workspace (Mail.TM, GuerrillaMail, TempMail.lol, and Maildrop.cc) will be migrated in Phase 2."
              onOpenCommandPalette={openCommandPalette}
            />
          }
        />
        <Route
          path="/guess-game"
          element={
            <PhaseTwoPlaceholder
              title="Number Guess (0–99)"
              description="Range-finding numeric deduction game with 10 attempts and proximity telemetry will be migrated in Phase 2."
              onOpenCommandPalette={openCommandPalette}
            />
          }
        />
        <Route
          path="/tic-tac-toe"
          element={
            <PhaseTwoPlaceholder
              title="Classic Tic-Tac-Toe"
              description="Single-player AI and two-player local pass-and-play Tic-Tac-Toe will be migrated in Phase 2."
              onOpenCommandPalette={openCommandPalette}
            />
          }
        />
        <Route
          path="/tic-tac-toe-3"
          element={
            <PhaseTwoPlaceholder
              title="Three-Marker Tic-Tac-Toe"
              description="No-draw FIFO 3-marker tactical variant will be migrated in Phase 2."
              onOpenCommandPalette={openCommandPalette}
            />
          }
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
