/* 固定横屏牌桌：始终以 1400 × 789 的比例显示；竖屏只展示横置提示，不参与游戏交互。 */
(function () {
  var GAME_WIDTH = 1400;
  var GAME_HEIGHT = 789;

  function updateFixedLandscape() {
    var width = window.innerWidth || document.documentElement.clientWidth;
    var height = window.innerHeight || document.documentElement.clientHeight;
    var isLandscape = width > height;
    var scale = Math.min(1, width / GAME_WIDTH, height / GAME_HEIGHT);
    document.documentElement.style.setProperty('--fixed-game-scale', String(Math.max(0.1, scale)));
    document.documentElement.classList.toggle('portrait-lock', !isLandscape);
  }

  window.addEventListener('resize', updateFixedLandscape);
  window.addEventListener('orientationchange', updateFixedLandscape);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateFixedLandscape);
  } else {
    updateFixedLandscape();
  }
})();
