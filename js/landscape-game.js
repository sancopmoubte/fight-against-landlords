/* 固定横向牌桌：始终以 1400 × 789 的比例直接显示；仅等比例缩放，不根据设备方向遮罩或重排。 */
(function () {
  var GAME_WIDTH = 1400;
  var GAME_HEIGHT = 789;

  function updateFixedCanvas() {
    var width = window.innerWidth || document.documentElement.clientWidth;
    var height = window.innerHeight || document.documentElement.clientHeight;
    var scale = Math.min(1, width / GAME_WIDTH, height / GAME_HEIGHT);
    document.documentElement.style.setProperty('--fixed-game-scale', String(Math.max(0.1, scale)));
  }

  window.addEventListener('resize', updateFixedCanvas);
  window.addEventListener('orientationchange', updateFixedCanvas);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateFixedCanvas);
  } else {
    updateFixedCanvas();
  }
})();
