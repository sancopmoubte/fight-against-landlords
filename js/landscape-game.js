/* 横屏操作：优先锁定设备横屏；受限时将固定牌桌向左旋转，保持完整可玩画面。 */
(function () {
	var GAME_WIDTH = 1400;
	var GAME_HEIGHT = 789;
	var feedbackTimer = null;
	var landscapeRequested = false;
	var settleTimer = null;

	function getViewportSize() {
		var viewport = window.visualViewport;
		return {
			width: (viewport && viewport.width) || window.innerWidth || document.documentElement.clientWidth,
			height: (viewport && viewport.height) || window.innerHeight || document.documentElement.clientHeight
		};
	}

	function isPortraitViewport(size) {
		return size.height > size.width;
	}

	function updateFixedCanvas() {
		var size = getViewportSize();
		var useLeftRotation = landscapeRequested && isPortraitViewport(size);
		var designWidth = useLeftRotation ? GAME_HEIGHT : GAME_WIDTH;
		var designHeight = useLeftRotation ? GAME_WIDTH : GAME_HEIGHT;
		var scale = Math.min(1, size.width / designWidth, size.height / designHeight);
		var root = document.documentElement;

		root.style.setProperty('--fixed-game-scale', String(Math.max(0.1, scale)));
		root.style.setProperty('--fixed-game-rotation', useLeftRotation ? '-90deg' : '0deg');
		root.classList.toggle('landscape-requested', landscapeRequested);
		root.classList.toggle('landscape-left-fallback', useLeftRotation);
	}

	window.addEventListener('resize', updateFixedCanvas);
	window.addEventListener('orientationchange', updateFixedCanvas);
	if (window.visualViewport) {
		window.visualViewport.addEventListener('resize', updateFixedCanvas);
	}

	function scheduleCanvasUpdates() {
		window.clearTimeout(settleTimer);
		updateFixedCanvas();
		settleTimer = window.setTimeout(updateFixedCanvas, 460);
	}

	function showLandscapeFeedback(message) {
		var feedback = document.getElementById('landscapeFeedback');
		if (!feedback) return;
		feedback.textContent = message;
		feedback.classList.add('is-visible');
		window.clearTimeout(feedbackTimer);
		feedbackTimer = window.setTimeout(function () {
			feedback.classList.remove('is-visible');
		}, 3200);
	}

	function bindLandscapeButton() {
		var button = document.getElementById('landscapeToggle');
		if (!button) return;

		/* 横屏只调整本页画布，避免部分移动浏览器在全屏/方向锁定时重建页面。 */
		button.addEventListener('pointerdown', function (event) {
			event.stopPropagation();
		});

		button.addEventListener('click', function (event) {
			event.preventDefault();
			event.stopImmediatePropagation();
			button.disabled = true;
			landscapeRequested = true;
			scheduleCanvasUpdates();
			window.setTimeout(function () {
				var stillPortrait = isPortraitViewport(getViewportSize());
				if (stillPortrait) {
					showLandscapeFeedback('已切换左转横屏牌桌；当前对局会保持不变');
				} else {
					showLandscapeFeedback('已切换横屏牌桌；当前对局会保持不变');
				}
				button.disabled = false;
			}, 280);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function () {
			updateFixedCanvas();
			bindLandscapeButton();
		});
	} else {
		updateFixedCanvas();
		bindLandscapeButton();
	}
})();
