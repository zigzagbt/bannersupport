import React, { useState } from 'react';
import Header from './components/Header';
import MainMenu from './components/MainMenu';
import ColorGuide from './components/ColorGuide';
import TextColorGuide from './components/TextColorGuide';
import PhraseGuide from './components/PhraseGuide';
import PngGuide from './components/PngGuide';
import TemplateGuide from './components/TemplateGuide';
import FullGuide from './components/FullGuide';
import Chatbot from './components/Chatbot';
import BannerCopyGenerator from './components/BannerCopyGenerator';
import BannerCopyGenerator2 from './components/BannerCopyGenerator2';
import FooterNav from './components/FooterNav';

export type MenuItem = 
  | 'main'
  | 'color'
  | 'text-color'
  | 'png'
  | 'template'
  | 'full-guide'
  | 'banner-image-phrase'
  | 'banner-image-phrase-v2';

function App() {
  const [currentMenu, setCurrentMenu] = useState<MenuItem>('main');
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState('#f9f6f1');
  const [palette, setPalette] = useState<string[]>([]);
  
  const goHome = () => setCurrentMenu('main');

  // Determine onBack for FooterNav
  let onBack: (() => void) | undefined = undefined;
  switch (currentMenu) {
    case 'color':
    case 'png':
    case 'template':
    case 'full-guide':
      onBack = goHome;
      break;
    case 'text-color':
      onBack = () => setCurrentMenu('color');
      break;
    default:
      onBack = undefined;
  }

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
      default:
        return <MainMenu onMenuSelect={setCurrentMenu} />;
    }
  };

  return (
    <div className="App">
      <Header />
      <div className="container">
        {renderContent()}
      </div>
      <Chatbot onNavigate={setCurrentMenu} />
      <FooterNav onHome={goHome} onBack={onBack} />
    </div>
  );
}

export default App; 