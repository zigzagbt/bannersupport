import React, { useState } from 'react';
import BannerCopyGenerator from './BannerCopyGenerator';

interface BannerCopySwitcherProps {
  onHome: () => void;
}

const BannerCopySwitcher: React.FC<BannerCopySwitcherProps> = ({ onHome }) => {
  const [version, setVersion] = useState<'v1' | 'v2'>('v1');
  return (
    <div>
      <BannerCopyGenerator onHome={onHome} version={version} />
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <label>
          <input
            type="radio"
            value="v1"
            checked={version === 'v1'}
            onChange={() => setVersion('v1')}
          />
          기존 버전
        </label>
        <label style={{ marginLeft: 20 }}>
          <input
            type="radio"
            value="v2"
            checked={version === 'v2'}
            onChange={() => setVersion('v2')}
          />
          지그재그 톤 v2
        </label>
      </div>
    </div>
  );
};

export default BannerCopySwitcher; 