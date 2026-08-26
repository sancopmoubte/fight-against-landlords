/* 操作引导：不介入斗地主牌型与 AI 逻辑，仅提示玩家当前可执行操作。 */
(function () {
  function createGuide() {
    var guide = document.createElement('aside');
    guide.id = 'gameGuide';
    guide.setAttribute('aria-live', 'polite');
    guide.innerHTML = '<span class="guide-label">游戏提示</span><span class="guide-message">点击中间牌堆开始发牌</span>';
    document.querySelector('.content').appendChild(guide);
    return guide;
  }

  function setGuide(guide, message, mode) {
    guide.className = mode ? 'guide-' + mode : '';
    guide.querySelector('.guide-message').textContent = message;
  }

  function isVisible(selector) {
    var element = document.querySelector(selector);
    return element && window.getComputedStyle(element).display !== 'none';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var guide = createGuide();
    var gameStarted = false;
    var promptTimer = null;

    document.body.addEventListener('click', function (event) {
      if (event.target.closest('.all_poker li') && !gameStarted) {
        gameStarted = true;
        setGuide(guide, '正在洗牌并发牌，请稍候…', 'dealing');

        promptTimer = window.setInterval(function () {
          if (isVisible('.mid_end .qdz')) {
            setGuide(guide, '轮到你叫地主：选择“抢地主”或“不抢”', 'turn');
            window.clearInterval(promptTimer);
          }
        }, 500);
      }

      if (event.target.closest('.mid_end .qdz input')) {
        setGuide(guide, '已完成叫地主，等待牌局开始…', 'dealing');
      }

      if (event.target.closest('.play_2 li')) {
        setGuide(guide, '已选中手牌，点击“出牌”确认', 'turn');
      }

      if (event.target.closest('.mid_end .play')) {
        setGuide(guide, '已出牌，等待其他玩家行动…', 'dealing');
      }

      if (event.target.closest('.mid_end .pass')) {
        setGuide(guide, '本回合选择不出，等待下一回合…', 'dealing');
      }
    });
  });
})();
