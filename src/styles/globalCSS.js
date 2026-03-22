export const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --sat: env(safe-area-inset-top, 0px); --sab: env(safe-area-inset-bottom, 0px); }
  html, body { background: #0D1117; height: 100%; overflow: hidden; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body { overscroll-behavior-y: contain; touch-action: manipulation; }
  #root { height: 100%; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
  @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes doctorWalk { from{background-position-x:0} to{background-position-x:-400%} }
  @keyframes petalFall {
    0%   { transform: translateY(-30px) rotate(0deg) scale(1.1); opacity: 0; }
    8%   { opacity: 1; }
    85%  { opacity: 0.7; }
    100% { transform: translateY(108vh) rotate(680deg) scale(0.6); opacity: 0; }
  }
  @keyframes petalSway {
    0%   { margin-left: 0px; }
    20%  { margin-left: 22px; }
    50%  { margin-left: -8px; }
    75%  { margin-left: 26px; }
    100% { margin-left: 0px; }
  }
  @keyframes sakuraGlow {
    0%,100% { opacity: 0.6; transform: scale(1); }
    50%     { opacity: 1;   transform: scale(1.08); }
  }
  @keyframes pinkPulse {
    0%,100% { box-shadow: 0 0 0 0 #E8186A00; }
    50%     { box-shadow: 0 0 16px 4px #E8186A30; }
  }
  .anim  { animation: fadeUp 0.28s ease both; }
  .fade  { animation: fadeIn 0.2s ease both; }
  .tab-in { animation: tabFadeIn 0.18s ease both; }
  @keyframes tabFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
  .press { transition: transform 0.1s, opacity 0.1s; -webkit-tap-highlight-color: transparent; cursor: pointer; user-select: none; }
  .press:active { transform: scale(0.96); opacity: 0.82; }
  ::-webkit-scrollbar { width: 0; }
  .theme-pink .sakura-font { font-family: 'Georgia', 'Palatino', serif !important; }
  .petal {
    position: fixed; pointer-events: none; z-index: 999;
    animation: petalFall linear infinite, petalSway ease-in-out infinite;
    user-select: none;
    will-change: transform;
    backface-visibility: hidden;
  }
  @keyframes bubbleRise {
    0%   { transform: translateY(0) scale(1); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 0.6; }
    100% { transform: translateY(-110vh) scale(0.5); opacity: 0; }
  }
  @keyframes bubbleSway {
    0%,100% { margin-left: 0px; }
    33%     { margin-left: 18px; }
    66%     { margin-left: -12px; }
  }
  @keyframes auroraShift1 {
    0%   { transform: translate(0%,0%) scale(1); }
    100% { transform: translate(8%,12%) scale(1.2); }
  }
  @keyframes auroraShift2 {
    0%   { transform: translate(0%,0%) scale(1.1); }
    100% { transform: translate(-10%,8%) scale(0.9); }
  }
  @keyframes auroraShift3 {
    0%   { transform: translate(0%,0%) scale(0.9); }
    100% { transform: translate(6%,-10%) scale(1.15); }
  }
  @keyframes fireflyFloat {
    0%,100% { transform: translate(0,0) scale(1); opacity: 0.15; }
    25%     { transform: translate(12px,-18px) scale(1.3); opacity: 0.9; }
    50%     { transform: translate(-8px,-8px) scale(0.8); opacity: 0.5; }
    75%     { transform: translate(16px,-24px) scale(1.1); opacity: 0.8; }
  }
  @keyframes emberRise {
    0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
    10%  { opacity: 1; }
    80%  { opacity: 0.6; }
    100% { transform: translateY(-90vh) scale(0.2) rotate(360deg); opacity: 0; }
  }
  @keyframes neonPulseA {
    0%,100% { opacity: 0.6; transform: scale(1); }
    50%     { opacity: 1;   transform: scale(1.15); }
  }
  @keyframes neonPulseB {
    0%,100% { opacity: 0.4; transform: scale(1.1); }
    50%     { opacity: 0.9; transform: scale(0.9); }
  }
  @keyframes popIn {
    0%   { opacity:0; transform: translate(-50%,-50%) scale(0.88); }
    100% { opacity:1; transform: translate(-50%,-50%) scale(1); }
  }
  @keyframes rainFall {
    0%   { transform: translateY(-5vh) translateX(0px); opacity: 0; }
    8%   { opacity: 1; }
    85%  { opacity: 0.6; }
    100% { transform: translateY(112vh) translateX(-20px); opacity: 0; }
  }
  @keyframes lightningFlashA {
    0%,93%,100% { opacity: 0; }
    94%   { opacity: 0.85; }
    95%   { opacity: 0; }
    95.5% { opacity: 0.5; }
    96.5% { opacity: 0; }
  }
  @keyframes lightningFlashB {
    0%,91%,100% { opacity: 0; }
    92%   { opacity: 0.7; }
    92.8% { opacity: 0; }
    93.2% { opacity: 0.45; }
    94%   { opacity: 0; }
  }
  @keyframes lightningFlashC {
    0%,88%,100% { opacity: 0; }
    89%   { opacity: 0.6; }
    89.5% { opacity: 0.1; }
    90%   { opacity: 0.75; }
    90.8% { opacity: 0; }
  }
  @keyframes boltStrike {
    0%,92%,100% { opacity: 0; transform: scaleY(0.7); }
    93%   { opacity: 1; transform: scaleY(1); }
    94%   { opacity: 0.15; transform: scaleY(1); }
    94.5% { opacity: 0.8; transform: scaleY(1.02); }
    96%   { opacity: 0; transform: scaleY(1); }
  }
  @keyframes cloudDrift1 {
    0%   { transform: translateX(-8%) scaleX(1); }
    100% { transform: translateX(8%) scaleX(1.05); }
  }
  @keyframes cloudDrift2 {
    0%   { transform: translateX(6%); }
    100% { transform: translateX(-10%); }
  }
  @keyframes windGust {
    0%,100% { transform: rotate(4deg); }
    40%     { transform: rotate(8deg); }
    70%     { transform: rotate(2deg); }
  }
  @keyframes gridScroll {
    0%   { background-position: 0 0; }
    100% { background-position: 0 80px; }
  }
  @keyframes sunSink {
    0%   { transform: translateX(-50%) translateY(0); }
    100% { transform: translateX(-50%) translateY(12px); }
  }
  @keyframes starPop {
    0%,100% { opacity: 0.3; transform: scale(1); }
    50%     { opacity: 1; transform: scale(1.5); }
  }
  @keyframes glitchJolt {
    0%,90%,100% { transform: translateX(0); clip-path: inset(0); }
    92%  { transform: translateX(-8px); clip-path: inset(10% 0 80% 0); }
    93%  { transform: translateX(12px); clip-path: inset(40% 0 30% 0); }
    94%  { transform: translateX(-4px); clip-path: inset(70% 0 5% 0); }
    95%  { transform: translateX(0); clip-path: inset(0); }
  }
  @keyframes glitchJoltB {
    0%,85%,100% { transform: translateX(0); clip-path: inset(0); }
    87%  { transform: translateX(10px); clip-path: inset(5% 0 70% 0); }
    88%  { transform: translateX(-14px); clip-path: inset(45% 0 25% 0); }
    89%  { transform: translateX(6px); clip-path: inset(75% 0 10% 0); }
    90%  { transform: translateX(0); clip-path: inset(0); }
  }
  @keyframes corruptBlock {
    0%,88%,96%,100% { opacity: 0; }
    90% { opacity: 0.8; }
    92% { opacity: 0.15; }
    93% { opacity: 0.65; }
    95% { opacity: 0; }
  }
  @keyframes corruptBlockB {
    0%,82%,92%,100% { opacity: 0; }
    84% { opacity: 0.7; }
    86% { opacity: 0; }
    87% { opacity: 0.55; }
    90% { opacity: 0; }
  }
  @keyframes scanlineFlicker {
    0%   { opacity: 0.04; }
    50%  { opacity: 0.08; }
    100% { opacity: 0.04; }
  }
  @keyframes neonFlicker {
    0%,100% { opacity: 1; }
    92%     { opacity: 1; }
    93%     { opacity: 0.2; }
    94%     { opacity: 0.9; }
    95%     { opacity: 0.1; }
    96%     { opacity: 1; }
  }
`;
