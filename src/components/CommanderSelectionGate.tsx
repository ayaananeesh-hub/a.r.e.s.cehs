import React, { useState, useEffect } from 'react';
import {
  Rocket,
  User,
  UserCheck,
  UserPlus,
  Coins,
  Clock,
  Trash2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Shield,
  Zap,
  Award,
  ArrowLeft,
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { CharacterProfile } from '../types';
import {
  getAllProfiles,
  isNameRegistered,
  registerNewProfile,
  loginReturningProfile,
  deleteProfile,
  getTierForPointsSpent,
  isAresProfile,
  verifyAresPassword,
  syncProfilesWithServer,
} from '../utils/characterProfiles';

interface CommanderSelectionGateProps {
  isOpen: boolean;
  activeProfile: CharacterProfile | null;
  onCommanderSelected: (profile: CharacterProfile) => void;
  onCancel?: () => void;
  canCancel?: boolean;
}

export const CommanderSelectionGate: React.FC<CommanderSelectionGateProps> = ({
  isOpen,
  activeProfile,
  onCommanderSelected,
  onCancel,
  canCancel = false,
}) => {
  // Mode: null = choice screen ('new' or 'old'), 'new' = new player form, 'old' = returning player list
  const [mode, setMode] = useState<'new' | 'old' | null>(null);
  const [profiles, setProfiles] = useState<CharacterProfile[]>([]);
  const [nameInput, setNameInput] = useState<string>('');
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [confirmPasscodeInput, setConfirmPasscodeInput] = useState<string>('');
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  // Passcode Challenge Modal for Returning Commander
  const [challengeProfile, setChallengeProfile] = useState<CharacterProfile | null>(null);
  const [challengePasscodeInput, setChallengePasscodeInput] = useState<string>('');
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [showChallengePasscode, setShowChallengePasscode] = useState<boolean>(false);

  // A.R.E.S. Password Gate State
  const [aresPromptProfile, setAresPromptProfile] = useState<CharacterProfile | null>(null);
  const [aresPasswordInput, setAresPasswordInput] = useState<string>('');
  const [aresPasswordError, setAresPasswordError] = useState<string | null>(null);

  // Refresh profiles list on open or change and sync with server
  useEffect(() => {
    if (isOpen) {
      const all = getAllProfiles();
      setProfiles(all);
      setErrorMessage(null);
      setSuccessMessage(null);
      setProfileToDelete(null);
      setAresPromptProfile(null);
      setAresPasswordInput('');
      setAresPasswordError(null);
      setChallengeProfile(null);
      setChallengePasscodeInput('');
      setChallengeError(null);
      setNameInput('');
      setPasscodeInput('');
      setConfirmPasscodeInput('');

      // Fetch latest profiles from server (cross-device sync)
      syncProfilesWithServer().then((synced) => {
        setProfiles(synced);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real-time check if name typed in New Player mode is already registered
  const trimmedName = nameInput.trim();
  const isDuplicate = trimmedName.length >= 2 && isNameRegistered(trimmedName);

  const handleRegisterNew = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter a valid call-sign (at least 2 letters).');
      return;
    }

    if (isAresProfile(trimmedName)) {
      setErrorMessage('A.R.E.S. is an immutable system protocol. Please switch to RETURNING PLAYER and enter the security password.');
      return;
    }

    if (isDuplicate) {
      setErrorMessage(
        `The commander name "${trimmedName}" is already registered! Please choose a new unique name, or select "RETURNING PLAYER" to log in.`
      );
      return;
    }

    const trimmedPasscode = passcodeInput.trim();
    if (!trimmedPasscode || trimmedPasscode.length < 3) {
      setErrorMessage('Please create a security passcode (at least 3 characters or digits) to secure your account across devices.');
      return;
    }

    if (trimmedPasscode !== confirmPasscodeInput.trim()) {
      setErrorMessage('Passcodes do not match! Please check and confirm your security passcode.');
      return;
    }

    const res = registerNewProfile(trimmedName, trimmedPasscode);
    if (!res.success || !res.profile) {
      setErrorMessage(res.error || 'Failed to register commander profile.');
      return;
    }

    setSuccessMessage(
      `Welcome to Ares Base, Commander ${res.profile.name}! Account secured with passcode. Initializing fresh mission file.`
    );
    setTimeout(() => {
      onCommanderSelected(res.profile!);
    }, 400);
  };

  const handleSelectReturningProfile = (profile: CharacterProfile) => {
    // If selecting A.R.E.S., require master clearance password
    if (isAresProfile(profile.id) || isAresProfile(profile.name)) {
      setAresPromptProfile(profile);
      setAresPasswordInput('');
      setAresPasswordError(null);
      return;
    }

    // If profile has passcode set, open challenge modal
    const hasPasscode = Boolean(profile.passcode || profile.hasPasscode);
    if (hasPasscode) {
      setChallengeProfile(profile);
      setChallengePasscodeInput('');
      setChallengeError(null);
      return;
    }

    // If legacy profile without passcode, directly log in
    const res = loginReturningProfile(profile.id);
    if (!res.success || !res.profile) {
      setErrorMessage(res.error || 'Failed to load profile.');
      return;
    }

    setSuccessMessage(`Welcome back, Commander ${res.profile.name}! Loading telemetry.`);
    setTimeout(() => {
      onCommanderSelected(res.profile!);
    }, 350);
  };

  const handleVerifyChallengePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeProfile) return;

    const trimmedPasscode = challengePasscodeInput.trim();
    if (!trimmedPasscode) {
      setChallengeError('Please enter your account security passcode.');
      return;
    }

    const res = loginReturningProfile(challengeProfile.id, trimmedPasscode);
    if (!res.success || !res.profile) {
      setChallengeError(res.error || 'ACCESS DENIED: Incorrect security passcode.');
      return;
    }

    setChallengeError(null);
    setSuccessMessage(`Security clearance verified! Welcome back, Commander ${res.profile.name}.`);
    const verifiedProfile = res.profile;
    setChallengeProfile(null);
    setTimeout(() => {
      onCommanderSelected(verifiedProfile);
    }, 350);
  };

  const handleVerifyAresPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyAresPassword(aresPasswordInput)) {
      setAresPasswordError('ACCESS DENIED: Invalid Security Clearance Password. Teleportation Matrix Locked.');
      return;
    }

    setAresPasswordError(null);
    setSuccessMessage('SECURITY CLEARANCE GRANTED: Welcome, Commander A.R.E.S.! Planetary Biome Teleporter Unlocked.');
    const target = aresPromptProfile || profiles.find((p) => isAresProfile(p.id))!;
    setAresPromptProfile(null);
    setTimeout(() => {
      onCommanderSelected(target);
    }, 500);
  };

  const handleReturningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedName) return;

    if (isAresProfile(trimmedName)) {
      const aresP = profiles.find((p) => isAresProfile(p.id));
      if (aresP) {
        setAresPromptProfile(aresP);
        setAresPasswordInput('');
        setAresPasswordError(null);
        return;
      }
    }

    const found = profiles.find((p) => p.name.toLowerCase() === trimmedName.toLowerCase() || p.id === trimmedName.toLowerCase());
    if (found) {
      handleSelectReturningProfile(found);
      return;
    }

    setErrorMessage(
      `Commander "${trimmedName}" was not found in Ares registry. Please check your spelling or register as a NEW PLAYER.`
    );
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAresProfile(id)) {
      setErrorMessage('A.R.E.S. is an immutable system protocol and cannot be deleted.');
      return;
    }
    deleteProfile(id);
    const updated = getAllProfiles();
    setProfiles(updated);
    setProfileToDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-3 sm:p-5 backdrop-blur-lg select-none overflow-y-auto">
      <div className="max-w-2xl w-full glass-panel rounded-3xl p-5 sm:p-8 border-2 border-[#4DD0E1]/80 shadow-[0_0_80px_rgba(77,208,225,0.35)] flex flex-col justify-between my-auto max-h-[96vh]">
        
        {/* Terminal Header */}
        <div className="text-center border-b border-[#4DD0E1]/30 pb-4 mb-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#4DD0E1]/15 border border-[#4DD0E1]/40 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4DD0E1] animate-ping" />
            <span className="text-[10px] sm:text-xs font-orbitron font-bold text-[#4DD0E1] tracking-widest uppercase">
              ARES EXPEDITION • SECURE MISSION CONTROL
            </span>
          </div>

          <h1 className="font-orbitron font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-white via-[#4DD0E1] to-[#E67E22] tracking-wide">
            IDENTIFY COMMANDER STATUS
          </h1>
          <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-lg mx-auto font-rajdhani font-semibold">
            All accounts are persistent and protected with your passcode across any browser and device.
          </p>
        </div>

        {/* STEP 1: INITIAL CHOICE (NEW PLAYER vs RETURNING PLAYER) */}
        {mode === null && (
          <div className="space-y-4 my-auto py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* NEW PLAYER CARD */}
              <button
                type="button"
                onClick={() => {
                  setMode('new');
                  setNameInput('');
                  setPasscodeInput('');
                  setConfirmPasscodeInput('');
                  setErrorMessage(null);
                }}
                className="group p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#2ECC71]/15 to-transparent border-2 border-[#2ECC71]/50 hover:border-[#2ECC71] hover:bg-[#2ECC71]/20 transition-all text-left flex flex-col justify-between cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.99]"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/20 border border-[#2ECC71]/40 flex items-center justify-center text-[#2ECC71] mb-3 group-hover:scale-110 transition-transform">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-orbitron font-bold bg-[#2ECC71]/30 text-[#2ECC71] uppercase">
                      CREATE PASSCODE ACCOUNT
                    </span>
                  </div>
                  <h3 className="font-orbitron font-black text-lg text-white group-hover:text-[#2ECC71] transition-colors">
                    NEW PLAYER
                  </h3>
                  <p className="text-xs text-white/70 mt-1.5 leading-relaxed font-rajdhani font-semibold">
                    Create a fresh Commander Profile with a secure passcode. Always accessible even if you change devices.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2ECC71]/30 flex items-center justify-between text-xs font-orbitron font-bold text-[#2ECC71]">
                  <span>REGISTER & SET PASSCODE</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* RETURNING PLAYER CARD */}
              <button
                type="button"
                onClick={() => {
                  setMode('old');
                  setNameInput('');
                  setErrorMessage(null);
                }}
                className="group p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#4DD0E1]/15 to-transparent border-2 border-[#4DD0E1]/50 hover:border-[#4DD0E1] hover:bg-[#4DD0E1]/20 transition-all text-left flex flex-col justify-between cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.99]"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#4DD0E1]/20 border border-[#4DD0E1]/40 flex items-center justify-center text-[#4DD0E1] mb-3 group-hover:scale-110 transition-transform">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-orbitron font-bold bg-[#4DD0E1]/30 text-[#4DD0E1] uppercase">
                      REGISTERED PILOTS ({profiles.length})
                    </span>
                  </div>
                  <h3 className="font-orbitron font-black text-lg text-white group-hover:text-[#4DD0E1] transition-colors">
                    OLD / RETURNING PLAYER
                  </h3>
                  <p className="text-xs text-white/70 mt-1.5 leading-relaxed font-rajdhani font-semibold">
                    Enter your passcode to log into your commander account. Restores exact coins, upgrades, and progress.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#4DD0E1]/30 flex items-center justify-between text-xs font-orbitron font-bold text-[#4DD0E1]">
                  <span>ENTER PASSCODE & LOG IN</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* Quick summary of registered profiles */}
            {profiles.length > 0 && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs text-white/60 font-orbitron">
                <div className="flex items-center space-x-2">
                  <Lock className="w-3.5 h-3.5 text-[#4DD0E1]" />
                  <span>Cloud Synced Profiles:</span>
                  <strong className="text-white">
                    {profiles.map((p) => p.name).join(', ')}
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: NEW PLAYER REGISTRATION FORM WITH PASSCODE */}
        {mode === 'new' && (
          <form onSubmit={handleRegisterNew} className="space-y-3.5 my-auto">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode(null);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-orbitron text-[#4DD0E1] hover:text-white flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>BACK TO CHOICE</span>
              </button>
              <span className="text-[11px] font-orbitron text-emerald-400 font-bold uppercase">
                NEW COMMANDER REGISTRATION
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-[#2ECC71]/40 text-left space-y-3">
              {/* Call-Sign Input */}
              <div>
                <label className="block text-xs font-orbitron font-bold text-[#2ECC71] uppercase mb-1">
                  1. Commander Call-Sign Name:
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-[#2ECC71]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Enter unique call-sign (e.g. Ayaan, Muflih, Adrith)..."
                    maxLength={22}
                    autoFocus
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/80 border-2 font-orbitron font-bold text-xs sm:text-sm tracking-wide text-white placeholder-white/30 focus:outline-none transition-all ${
                      isDuplicate
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500/50'
                        : trimmedName.length >= 2
                        ? 'border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71]/40'
                        : 'border-white/20 focus:border-[#2ECC71]'
                    }`}
                  />
                </div>
              </div>

              {/* Passcode Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-orbitron font-bold text-[#4DD0E1] uppercase mb-1 flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>2. Account Passcode / PIN:</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      value={passcodeInput}
                      onChange={(e) => {
                        setPasscodeInput(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="Enter secret passcode..."
                      maxLength={20}
                      className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-black/80 border border-[#4DD0E1]/60 font-mono text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#4DD0E1]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode((p) => !p)}
                      className="absolute right-2.5 text-white/50 hover:text-white"
                    >
                      {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-orbitron font-bold text-[#4DD0E1] uppercase mb-1 flex items-center space-x-1">
                    <KeyRound className="w-3 h-3" />
                    <span>Confirm Passcode:</span>
                  </label>
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={confirmPasscodeInput}
                    onChange={(e) => {
                      setConfirmPasscodeInput(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Confirm passcode..."
                    maxLength={20}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/80 border border-[#4DD0E1]/60 font-mono text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#4DD0E1]"
                  />
                </div>
              </div>

              {/* Security guarantee note */}
              <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-200 font-rajdhani font-semibold flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Your passcode allows you to log in securely from any device or browser with your points preserved.</span>
              </div>

              {/* Duplicate Name Warning Indicator */}
              {isDuplicate && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/80 text-xs font-orbitron text-red-200 flex items-start space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-red-300 uppercase block">NAME ALREADY REGISTERED!</strong>
                    <span>
                      The name <strong className="text-white font-mono font-bold">"{trimmedName}"</strong> is already in use. Please choose a new name or switch to <button type="button" onClick={() => setMode('old')} className="underline text-cyan-300 font-bold hover:text-white">RETURNING PLAYER</button> to enter your passcode.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Error / Success Alerts */}
            {errorMessage && !isDuplicate && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500 text-xs font-orbitron text-red-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-blue-950/80 border border-[#4DD0E1] text-xs font-orbitron text-[#4DD0E1] flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#4DD0E1] animate-spin" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron text-xs cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={isDuplicate || trimmedName.length < 2 || passcodeInput.trim().length < 3}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2ECC71] to-[#4DD0E1] text-black font-orbitron font-black text-xs sm:text-sm tracking-wider shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-2"
              >
                <Rocket className="w-4 h-4" />
                <span>CREATE ACCOUNT & ENTER</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: OLD / RETURNING PLAYER SELECTION */}
        {mode === 'old' && (
          <div className="space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode(null);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-orbitron text-[#4DD0E1] hover:text-white flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>BACK TO CHOICE</span>
              </button>
              <span className="text-[11px] font-orbitron text-[#4DD0E1] font-bold uppercase">
                SELECT PROFILE • PASSCODE PROTECTED
              </span>
            </div>

            {/* Manual Name Input / Search Form */}
            <form onSubmit={handleReturningSubmit} className="relative">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Search or enter registered call-sign..."
                className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-black/60 border border-[#4DD0E1]/40 text-white placeholder-white/30 font-orbitron text-xs focus:outline-none focus:border-[#4DD0E1]"
              />
              <button
                type="submit"
                disabled={!trimmedName}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-[#4DD0E1] text-black font-orbitron font-bold text-xs hover:bg-[#2ECC71] disabled:opacity-30 cursor-pointer"
              >
                LOG IN
              </button>
            </form>

            {/* Registered Commander Profiles List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-left">
              {profiles.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                  <p className="text-xs text-white/60 font-orbitron">
                    No commander profiles found. Register your first account!
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('new')}
                    className="px-4 py-1.5 rounded-xl bg-[#2ECC71] text-black font-orbitron font-bold text-xs"
                  >
                    REGISTER AS NEW PLAYER
                  </button>
                </div>
              ) : (
                profiles.map((p) => {
                  const isAres = isAresProfile(p.id) || isAresProfile(p.name);
                  const hasPasscode = Boolean(p.passcode || p.hasPasscode || isAres);
                  const pointsCount = isAres ? 99999 : (p.coins ?? p.rover?.coins ?? p.rover?.dust ?? 0);
                  const spentCount = isAres ? 9999 : (p.pointsSpent ?? p.rover?.pointsSpent ?? 0);
                  const tier = getTierForPointsSpent(spentCount);
                  const isConfirmingDelete = profileToDelete === p.id;
                  const isActive = activeProfile?.id === p.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectReturningProfile(p)}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                        isAres
                          ? 'border-amber-400/80 bg-gradient-to-r from-amber-950/40 via-black/80 to-cyan-950/30 shadow-[0_0_20px_rgba(241,196,15,0.2)] hover:border-amber-300'
                          : isActive
                          ? 'bg-[#4DD0E1]/20 border-[#4DD0E1] shadow-[0_0_20px_rgba(77,208,225,0.3)]'
                          : 'bg-black/60 border-white/15 hover:border-[#4DD0E1] hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-orbitron font-black text-base flex-shrink-0 ${
                            isAres ? 'border-2 border-amber-400 bg-amber-400/20 text-amber-300 shadow-[0_0_15px_rgba(241,196,15,0.4)]' : ''
                          }`}
                          style={!isAres ? { backgroundColor: `${tier.color}33`, color: tier.color, border: `1px solid ${tier.color}66` } : undefined}
                        >
                          {isAres ? <KeyRound className="w-5 h-5 text-amber-400" /> : p.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="truncate">
                          <div className="flex items-center space-x-2">
                            <span className={`font-orbitron font-black text-sm ${isAres ? 'text-amber-300' : 'text-white group-hover:text-[#4DD0E1]'} transition-colors`}>
                              {p.name}
                            </span>
                            {hasPasscode && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-orbitron font-bold border border-cyan-400/60 bg-cyan-400/15 text-cyan-300 flex items-center space-x-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>SECURE</span>
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          {/* Points & Stats Bar */}
                          <div className="flex items-center space-x-3 text-[11px] font-mono mt-1 text-white/70">
                            {isAres ? (
                              <span className="text-amber-300 text-[10px] font-orbitron flex items-center space-x-1">
                                <Zap className="w-3 h-3 text-cyan-400" />
                                <span>ALL BIOMES UNLOCKED • MASTER PROTOCOL</span>
                              </span>
                            ) : (
                              <>
                                <span className="flex items-center space-x-1 text-[#F1C40F]">
                                  <Coins className="w-3.5 h-3.5 text-[#F1C40F]" />
                                  <strong>{pointsCount.toLocaleString()} Pts</strong>
                                </span>
                                <span>•</span>
                                <span className="text-white/60">
                                  Spent: <strong className="text-[#FF9800]">{spentCount.toLocaleString()}</strong>
                                </span>
                                <span>•</span>
                                <span className="text-[#4DD0E1]">
                                  Level {p.currentLevelNum || 1}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isAres ? (
                          <div className="p-1.5 text-amber-400/80" title="Core protocol cannot be deleted">
                            <Lock className="w-4 h-4" />
                          </div>
                        ) : isConfirmingDelete ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => handleDeleteProfile(p.id, e)}
                              className="px-2 py-1 rounded bg-[#FF3D00] text-white text-[10px] font-orbitron font-bold hover:bg-red-700"
                            >
                              DELETE
                            </button>
                            <button
                              onClick={() => setProfileToDelete(null)}
                              className="px-1.5 py-1 rounded bg-white/10 text-white text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setProfileToDelete(p.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/40 hover:text-[#FF3D00] hover:bg-white/10 transition-all cursor-pointer"
                            title="Delete profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSelectReturningProfile(p)}
                          className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs flex items-center space-x-1 transition-all ${
                            isAres
                              ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-[0_0_15px_rgba(241,196,15,0.4)]'
                              : 'bg-[#4DD0E1]/20 group-hover:bg-[#4DD0E1] text-[#4DD0E1] group-hover:text-black'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span>LOG IN</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Error / Success Alerts */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500 text-xs font-orbitron text-red-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-blue-950/80 border border-[#4DD0E1] text-xs font-orbitron text-[#4DD0E1] flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#4DD0E1] animate-spin" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Bar */}
        <div className="pt-3 border-t border-white/10 flex justify-between items-center text-[11px] text-white/50 font-orbitron">
          <span className="flex items-center space-x-1">
            <Lock className="w-3 h-3 text-[#4DD0E1]" />
            <span>Secure Server Persistence Active</span>
          </span>
          {canCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-white/80 hover:text-white underline cursor-pointer"
            >
              Continue to Main Menu
            </button>
          )}
        </div>

      </div>

      {/* Passcode Challenge Modal for Returning Commander */}
      {challengeProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full glass-panel rounded-3xl p-6 border-2 border-[#4DD0E1] shadow-[0_0_50px_rgba(77,208,225,0.4)] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#4DD0E1]/20 border-2 border-[#4DD0E1] text-[#4DD0E1] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(77,208,225,0.5)]">
              <Lock className="w-8 h-8 animate-pulse text-[#4DD0E1]" />
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#4DD0E1]/20 border border-[#4DD0E1] text-[10px] font-orbitron font-bold text-[#4DD0E1] tracking-widest uppercase mb-1">
                SECURE ACCESS • COMMANDER VERIFICATION
              </div>
              <h2 className="font-orbitron font-black text-xl text-white">
                ENTER PASSCODE FOR "{challengeProfile.name}"
              </h2>
              <p className="text-xs text-white/70 mt-1 font-rajdhani font-semibold">
                Please enter your security passcode to decrypt and resume your mission files:
              </p>
            </div>

            <form onSubmit={handleVerifyChallengePasscode} className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-orbitron font-bold text-[#4DD0E1] uppercase mb-1">
                  Account Passcode:
                </label>
                <div className="relative">
                  <input
                    type={showChallengePasscode ? 'text' : 'password'}
                    value={challengePasscodeInput}
                    onChange={(e) => {
                      setChallengePasscodeInput(e.target.value);
                      setChallengeError(null);
                    }}
                    placeholder="Enter account passcode..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-black/80 border-2 border-[#4DD0E1]/80 font-mono text-cyan-200 placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#4DD0E1]/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowChallengePasscode((p) => !p)}
                    className="absolute right-3 top-3.5 text-white/50 hover:text-white"
                  >
                    {showChallengePasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {challengeError && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500 text-xs font-orbitron text-red-300 flex items-center space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{challengeError}</span>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setChallengeProfile(null);
                    setChallengePasscodeInput('');
                    setChallengeError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron text-xs font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={!challengePasscodeInput.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#2ECC71] to-[#4DD0E1] text-black font-orbitron font-black text-xs tracking-wider shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-40 cursor-pointer flex items-center justify-center space-x-1"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>UNLOCK & LOG IN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* A.R.E.S. Password Security Clearance Modal */}
      {aresPromptProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full glass-panel rounded-3xl p-6 border-2 border-amber-400 shadow-[0_0_50px_rgba(241,196,15,0.4)] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(241,196,15,0.5)]">
              <KeyRound className="w-8 h-8 animate-pulse text-amber-300" />
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-[10px] font-orbitron font-bold text-amber-300 tracking-widest uppercase mb-1">
                TOP SECRET • QUANTUM BIOME TELEPORTER
              </div>
              <h2 className="font-orbitron font-black text-xl text-white">
                A.R.E.S. SECURITY CLEARANCE
              </h2>
              <p className="text-xs text-white/70 mt-1">
                Enter the confidential clearance password to unlock the immortal <strong className="text-amber-300">A.R.E.S.</strong> protocol and grant instant planetary teleportation:
              </p>
            </div>

            <form onSubmit={handleVerifyAresPassword} className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-orbitron font-bold text-amber-400 uppercase mb-1">
                  Security Passcode:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={aresPasswordInput}
                    onChange={(e) => {
                      setAresPasswordInput(e.target.value);
                      setAresPasswordError(null);
                    }}
                    placeholder="Enter clearance password..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-black/80 border-2 border-amber-400/80 font-mono text-amber-200 placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                </div>
              </div>

              {aresPasswordError && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500 text-xs font-orbitron text-red-300 flex items-center space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{aresPasswordError}</span>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAresPromptProfile(null);
                    setAresPasswordInput('');
                    setAresPasswordError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron text-xs font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={!aresPasswordInput.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#E67E22] text-black font-orbitron font-black text-xs tracking-wider shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-40 cursor-pointer flex items-center justify-center space-x-1"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>ENGAGE A.R.E.S.</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

