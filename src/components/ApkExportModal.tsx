import React, { useState } from 'react';
import { Smartphone, Download, Terminal, CheckCircle2, ShieldCheck, ExternalLink, X, Copy, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'webapk' | 'bubblewrap' | 'capacitor' | 'manifest'>('webapk');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const bubblewrapCommands = `# 1. Install Bubblewrap CLI (Google's official PWA to APK tool)
npm install -g @bubblewrap/cli

# 2. Generate the Android APK project from your live app URL
bubblewrap init --manifest="${window.location.origin}/manifest.webmanifest"

# 3. Build signed Android APK and AAB for Google Play Store
bubblewrap build

# Result: app-release-signed.apk ready to sideload or submit!`;

  const capacitorCommands = `# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize Android Project
npx cap init "Mars Rover Mission" "com.marsrover.mission" --web-dir=dist

# 3. Build web assets and add Android Studio project
npm run build
npx cap add android

# 4. Open in Android Studio to build debug/release APK
npx cap open android`;

  const manifestJsonString = JSON.stringify(
    {
      id: '/',
      name: 'Mars Rover Mission',
      short_name: 'MarsRover',
      description: 'An interplanetary scientific Mars rover simulator and APK-ready mission game.',
      theme_color: '#080F1E',
      background_color: '#080F1E',
      display: 'standalone',
      orientation: 'any',
      start_url: '/',
      scope: '/',
      categories: ['games', 'simulation', 'education'],
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-maskable-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    null,
    2
  );

  const downloadManifest = () => {
    const blob = new Blob([manifestJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border-2 border-[#4DD0E1] space-y-4 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#4DD0E1]/30 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#4DD0E1]/15 text-[#4DD0E1] border border-[#4DD0E1]/40">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-lg text-[#4DD0E1]">
                ANDROID APK & PACKAGING HUB
              </h2>
              <p className="text-xs text-[#F4F7FA]/70">
                Install directly on Android or package into a standalone signed .APK file.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-orbitron font-bold">
          <button
            onClick={() => setActiveTab('webapk')}
            className={`py-2 px-2.5 rounded-xl border transition-all text-center ${
              activeTab === 'webapk'
                ? 'bg-[#4DD0E1] text-black border-[#4DD0E1]'
                : 'glass-panel text-white/80 border-white/10 hover:border-[#4DD0E1]/50'
            }`}
          >
            ⚡ Direct WebAPK
          </button>
          <button
            onClick={() => setActiveTab('bubblewrap')}
            className={`py-2 px-2.5 rounded-xl border transition-all text-center ${
              activeTab === 'bubblewrap'
                ? 'bg-[#E67E22] text-black border-[#E67E22]'
                : 'glass-panel text-white/80 border-white/10 hover:border-[#E67E22]/50'
            }`}
          >
            📦 Google Bubblewrap
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`py-2 px-2.5 rounded-xl border transition-all text-center ${
              activeTab === 'capacitor'
                ? 'bg-[#2ECC71] text-black border-[#2ECC71]'
                : 'glass-panel text-white/80 border-white/10 hover:border-[#2ECC71]/50'
            }`}
          >
            ⚙️ Capacitor Studio
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`py-2 px-2.5 rounded-xl border transition-all text-center ${
              activeTab === 'manifest'
                ? 'bg-[#F1C40F] text-black border-[#F1C40F]'
                : 'glass-panel text-white/80 border-white/10 hover:border-[#F1C40F]/50'
            }`}
          >
            📄 Manifest Config
          </button>
        </div>

        {/* Tab 1: WebAPK (Instant Native Android Install) */}
        {activeTab === 'webapk' && (
          <div className="space-y-4 text-xs">
            <div className="glass-panel p-4 rounded-xl border border-[#4DD0E1]/40 space-y-3">
              <div className="flex items-center space-x-2 text-[#4DD0E1] font-orbitron font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Instant Android WebAPK Installation</span>
              </div>
              <p className="text-[#F4F7FA]/80 leading-relaxed">
                Modern Android devices (Google Chrome, Samsung Internet, Edge, Brave) convert compliant PWA web applications into <strong>native Android APK packages (WebAPK)</strong> automatically signed by Google Play Services.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] flex-shrink-0 mt-0.5" />
                  <span>Adds standalone icon to Android Home Screen and App Drawer</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] flex-shrink-0 mt-0.5" />
                  <span>Runs in full-screen standalone mode with no browser address bar</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] flex-shrink-0 mt-0.5" />
                  <span>Offline cache enabled via service workers</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71] flex-shrink-0 mt-0.5" />
                  <span>Full hardware touch, audio, and orientation support</span>
                </div>
              </div>

              {/* Install Action Button */}
              <div className="pt-2">
                {isInstalled ? (
                  <div className="p-3 rounded-xl bg-[#2ECC71]/20 border border-[#2ECC71] text-[#2ECC71] font-orbitron font-bold text-center flex items-center justify-center space-x-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>APP ALREADY INSTALLED AS STANDALONE APK</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={install}
                    className="w-full py-3 rounded-xl font-orbitron font-bold text-sm bg-gradient-to-r from-[#2ECC71] to-[#4DD0E1] text-black hover:opacity-90 shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <Smartphone className="w-5 h-5" />
                    <span>INSTALL MARS ROVER APK ON THIS DEVICE NOW</span>
                  </button>
                ) : isAndroid ? (
                  <div className="p-3 rounded-xl bg-[#E67E22]/15 border border-[#E67E22] text-[#E67E22] space-y-1">
                    <p className="font-bold font-orbitron">To install on your Android browser:</p>
                    <p className="text-[11px] text-white/90">
                      Tap the <strong>three dots menu (⋮)</strong> in Chrome or Samsung Internet, then tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>
                ) : isIOS ? (
                  <div className="p-3 rounded-xl bg-[#4DD0E1]/15 border border-[#4DD0E1] text-[#4DD0E1] space-y-1">
                    <p className="font-bold font-orbitron">To install on iOS / Safari:</p>
                    <p className="text-[11px] text-white/90">
                      Tap the <strong>Share</strong> button (box with up arrow), then scroll down and tap <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/20 text-white/80 flex items-center justify-between">
                    <span>Open this URL on an Android device or use the CLI packaging options below to build a standalone .apk binary.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Bubblewrap (Official Google Play APK / AAB) */}
        {activeTab === 'bubblewrap' && (
          <div className="space-y-3 text-xs">
            <div className="glass-panel p-3.5 rounded-xl border border-[#E67E22]/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-orbitron font-bold text-[#E67E22] flex items-center space-x-2">
                  <Terminal className="w-4 h-4" />
                  <span>Google Bubblewrap CLI (Official TWA to APK)</span>
                </span>
                <button
                  onClick={() => copyToClipboard(bubblewrapCommands, 'bubblewrap')}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#E67E22]/20 hover:bg-[#E67E22]/30 text-[#E67E22] font-orbitron font-semibold text-[10px]"
                >
                  {copiedText === 'bubblewrap' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'bubblewrap' ? 'COPIED!' : 'COPY COMMANDS'}</span>
                </button>
              </div>
              <p className="text-[#F4F7FA]/70 text-[11px]">
                Google's official Bubblewrap tool converts this PWA manifest directly into a verified Android Studio project producing a production-ready <code>.apk</code> and <code>.aab</code> for Google Play Store distribution.
              </p>
              <pre className="bg-[#040811] p-3 rounded-lg text-[11px] text-[#2ECC71] overflow-x-auto font-mono border border-white/10">
                {bubblewrapCommands}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Capacitor (Android Studio Native APK) */}
        {activeTab === 'capacitor' && (
          <div className="space-y-3 text-xs">
            <div className="glass-panel p-3.5 rounded-xl border border-[#2ECC71]/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-orbitron font-bold text-[#2ECC71] flex items-center space-x-2">
                  <Terminal className="w-4 h-4" />
                  <span>Capacitor Native Android Studio Project</span>
                </span>
                <button
                  onClick={() => copyToClipboard(capacitorCommands, 'capacitor')}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#2ECC71]/20 hover:bg-[#2ECC71]/30 text-[#2ECC71] font-orbitron font-semibold text-[10px]"
                >
                  {copiedText === 'capacitor' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'capacitor' ? 'COPIED!' : 'COPY COMMANDS'}</span>
                </button>
              </div>
              <p className="text-[#F4F7FA]/70 text-[11px]">
                Wrap this web app inside a native Android Studio container to build and debug an APK file with Gradle:
              </p>
              <pre className="bg-[#040811] p-3 rounded-lg text-[11px] text-[#4DD0E1] overflow-x-auto font-mono border border-white/10">
                {capacitorCommands}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: Manifest Config */}
        {activeTab === 'manifest' && (
          <div className="space-y-3 text-xs">
            <div className="glass-panel p-3.5 rounded-xl border border-[#F1C40F]/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-orbitron font-bold text-[#F1C40F] flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Web App Manifest Configuration</span>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(manifestJsonString, 'manifest')}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-orbitron text-[10px]"
                  >
                    {copiedText === 'manifest' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'manifest' ? 'COPIED' : 'COPY'}</span>
                  </button>
                  <button
                    onClick={downloadManifest}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#F1C40F] text-black font-orbitron font-bold text-[10px] hover:bg-[#E67E22]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DOWNLOAD JSON</span>
                  </button>
                </div>
              </div>
              <pre className="bg-[#040811] p-3 rounded-lg text-[10px] text-amber-200 overflow-x-auto font-mono max-h-52 border border-white/10">
                {manifestJsonString}
              </pre>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-white/60">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span>
            <span>All Android icons (192px, 512px, Maskable) ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 font-orbitron font-bold text-xs text-white"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
