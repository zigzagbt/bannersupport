import React, { useState } from 'react';
import Header from './components/Header';
import MainMenu from './components/MainMenu';
import ColorGuide from './components/ColorGuide';
import TextColorGuide from './components/TextColorGuide';
import PngGuide from './components/PngGuide';
import TemplateGuide from './components/TemplateGuide';
import FullGuide from './components/FullGuide';
import Chatbot from './components/Chatbot';
import BannerCopyGenerator from './components/BannerCopyGenerator';
import BannerCopyGenerator2 from './components/BannerCopyGenerator2';
import SearchBannerGenerator from './components/SearchBannerGenerator';
import SearchBannerGeneratorNoImage from './components/SearchBannerGeneratorNoImage';
import BannerColorChecker from './components/BannerColorChecker';
import SplashHelper from './components/SplashHelper';
import MainBannerHelper from './components/MainBannerHelper';
import BacklogMenu from './components/BacklogMenu';
import UsageStats from './components/UsageStats';
import FooterNav from './components/FooterNav';

export type MenuItem = 
  | 'main'
  | 'color'
  | 'text-color'
  | 'png'
  | 'template'
  | 'full-guide'
  | 'banner-image-phrase'
  | 'banner-image-phrase-v2'
  | 'search-banner'
  | 'banner-color-checker'
  | 'search-banner-no-image'
  | 'splash-helper'
  | 'main-banner-helper'
  | 'usage-stats'
  | 'backlog';

function App() {
  const [currentMenu, setCurrentMenu] = useState<MenuItem>('main');
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState('#f9f6f1');
  const [palette, setPalette] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  
  const goHome = () => setCurrentMenu('main');

  // Determine onBack for FooterNav
  let onBack: (() => void) | undefined = undefined;
  switch (currentMenu) {
    case 'color':
    case 'png':
    case 'template':
    case 'full-guide':
    case 'search-banner':
    case 'search-banner-no-image':
    case 'banner-color-checker':
    case 'splash-helper':
    case 'main-banner-helper':
    case 'usage-stats':
    case 'backlog':
      onBack = goHome;
      break;
    case 'text-color':
      onBack = () => setCurrentMenu('color');
      break;
    default:
      onBack = undefined;
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  };

  const handleMenuSelect = (menu: MenuItem) => {
    if (menu === 'template' || menu === 'full-guide') {
      showToast('준비중이에요');
      return;
    }
    setCurrentMenu(menu);
  };

  const renderContent = () => {
    switch (currentMenu) {
      case 'color':
        return <ColorGuide 
          onBack={goHome} 
          onHome={goHome} 
          onNextStep={(color, paletteArr) => {
            setSelectedBackgroundColor(color);
            setPalette(paletteArr);
            setCurrentMenu('text-color');
          }}
          palette={palette}
          setPalette={setPalette}
          selectedColor={selectedBackgroundColor}
          setSelectedColor={setSelectedBackgroundColor}
        />;
      case 'text-color':
        return <TextColorGuide 
          onBack={() => setCurrentMenu('color')} 
          onHome={goHome}
          initialBackgroundColor={selectedBackgroundColor}
          palette={palette}
          setBackgroundColor={setSelectedBackgroundColor}
        />;
      case 'png':
        return <PngGuide onBack={goHome} onHome={goHome} />;
      case 'template':
        return <TemplateGuide onBack={goHome} onHome={goHome} />;
      case 'full-guide':
        return <FullGuide onBack={goHome} onHome={goHome} />;
      case 'banner-image-phrase':
        return <BannerCopyGenerator onHome={goHome} />;
      case 'banner-image-phrase-v2':
        return <BannerCopyGenerator2 onHome={goHome} onBack={goHome} />;
      case 'search-banner':
        return <SearchBannerGenerator onHome={goHome} onBack={goHome} />;
      case 'search-banner-no-image':
        return <SearchBannerGeneratorNoImage onHome={goHome} onBack={goHome} />;
      case 'banner-color-checker':
        return <BannerColorChecker onHome={goHome} onBack={goHome} />;
      case 'splash-helper':
        return <SplashHelper onHome={goHome} onBack={goHome} />;
      case 'main-banner-helper':
        return <MainBannerHelper onHome={goHome} onBack={goHome} />;
      case 'usage-stats':
        return <UsageStats onHome={goHome} onBack={goHome} />;
      case 'backlog':
        return <BacklogMenu onHome={goHome} onBack={goHome} onMenuSelect={handleMenuSelect} />;
      default:
        return <MainMenu onMenuSelect={handleMenuSelect} />;
    }
  };

  return (
    <div className="App">
      <Header />
      <div className="container">
        {renderContent()}
      </div>
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#222',
          color: '#fff',
          padding: '14px 32px',
          borderRadius: 12,
          fontSize: '1.1rem',
          zIndex: 9999,
          boxShadow: '0 2px 12px #0002',
          opacity: 0.95
        }}>
          {toast}
        </div>
      )}
      {/* <Chatbot onNavigate={setCurrentMenu} /> */}
      <FooterNav onHome={goHome} onBack={onBack} />
    </div>
  );
}

export default App; 