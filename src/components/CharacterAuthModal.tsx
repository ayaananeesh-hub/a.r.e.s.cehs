import React from 'react';
import { CharacterProfile } from '../types';
import { CommanderSelectionGate } from './CommanderSelectionGate';

interface CharacterAuthModalProps {
  isOpen: boolean;
  activeProfile: CharacterProfile | null;
  onSelectOrRegister: (profile: CharacterProfile) => void;
  onClose?: () => void;
  canCancel?: boolean;
}

export const CharacterAuthModal: React.FC<CharacterAuthModalProps> = ({
  isOpen,
  activeProfile,
  onSelectOrRegister,
  onClose,
  canCancel = false,
}) => {
  return (
    <CommanderSelectionGate
      isOpen={isOpen}
      activeProfile={activeProfile}
      onCommanderSelected={onSelectOrRegister}
      onCancel={onClose}
      canCancel={canCancel}
    />
  );
};
