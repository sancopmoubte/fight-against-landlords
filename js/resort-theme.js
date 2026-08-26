/* 视觉方向：非裸露成年夏日度假卡牌主题；仅装饰牌背与牌面角标，不改变斗地主玩法。 */
// 牌面视觉：仅生成简洁的上下对角索引，避免重复的 JOKER/花色装饰破坏传统牌面留白。
(function () {
  var variants = ['resort-back-01', 'resort-back-02', 'resort-back-03', 'resort-back-04'];
  var cursor = 0;
  var rankMap = {
    1: '3', 2: '4', 3: '5', 4: '6', 5: '7', 6: '8', 7: '9', 8: '10',
    9: 'J', 10: 'Q', 11: 'K', 12: 'A', 13: '2', 14: '小王', 15: '大王'
  };
  var suitMap = [
    { symbol: '♦', color: 'red' },
    { symbol: '♣', color: 'black' },
    { symbol: '♥', color: 'red' },
    { symbol: '♠', color: 'black' }
  ];

  function decorateCard(card) {
    if (!card || card.dataset.resortBack) return;
    var variant = variants[cursor % variants.length];
    cursor += 1;
    card.classList.add(variant);
    card.dataset.resortBack = variant;
  }

  function buildIndex(position, rank, suit, color, isJoker) {
    var index = document.createElement('i');
    index.className = 'card-readable-index card-readable-index--' + position +
      ' card-readable-index--' + color + (isJoker ? ' card-readable-index--joker' : '');
    index.setAttribute('aria-hidden', 'true');

    var rankNode = document.createElement('b');
    rankNode.className = 'card-readable-index__rank';
    rankNode.textContent = rank;
    index.appendChild(rankNode);

    if (suit) {
      var suitNode = document.createElement('b');
      suitNode.className = 'card-readable-index__suit';
      suitNode.textContent = suit;
      index.appendChild(suitNode);
    }
    return index;
  }

  function decorateFace(card) {
    if (!card || card.dataset.readableIndex || card.classList.contains('back')) return;
    var value = card.getAttribute('data');
    if (!value) return;

    var parts = value.split('_');
    var rankValue = Number(parts[0]);
    var suitValue = Number(parts[1]);
    var rank = rankMap[rankValue];
    if (!rank) return;

    var isJoker = rankValue === 14 || rankValue === 15;
    var suit = isJoker ? '' : (suitMap[suitValue] || suitMap[0]).symbol;
    var color = isJoker ? (rankValue === 15 ? 'red' : 'black') : (suitMap[suitValue] || suitMap[0]).color;
    card.classList.add('card-with-readable-index');
    card.dataset.readableIndex = 'true';
    card.appendChild(buildIndex('top', rank, suit, color, isJoker));
    card.appendChild(buildIndex('bottom', rank, suit, color, isJoker));
  }

  function decorateWithin(root) {
    if (!root) return;
    if (root.nodeType === 1 && root.matches && root.matches('.back')) decorateCard(root);
    if (root.nodeType === 1 && root.matches && root.matches('li[data]')) decorateFace(root);
    if (root.querySelectorAll) {
      root.querySelectorAll('.back').forEach(decorateCard);
      root.querySelectorAll('li[data]').forEach(decorateFace);
    }
  }

  function begin() {
    decorateWithin(document);
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) decorateWithin(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', begin);
  } else {
    begin();
  }
})();
