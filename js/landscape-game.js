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

	function waitForViewportSettle() {
		return new Promise(function (resolve) {
			window.setTimeout(function () {
				scheduleCanvasUpdates();
				resolve();
			}, 460);
		});
	}

	function isFullscreenActive() {
		return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
	}

	function requestPageFullscreen(root) {
		var request = root.requestFullscreen || root.webkitRequestFullscreen;
		if (!isFullscreenActive() && request) {
			return Promise.resolve(request.call(root));
		}
		return Promise.resolve();
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

		button.addEventListener('click', async function () {
			button.disabled = true;
			landscapeRequested = true;
			scheduleCanvasUpdates();
			var fullscreenSucceeded = false;
			var lockSucceeded = false;
			try {
				var root = document.documentElement;
				await requestPageFullscreen(root);
				fullscreenSucceeded = isFullscreenActive();

				var orientation = window.screen && window.screen.orientation;
				if (orientation && typeof orientation.lock === 'function') {
					try {
						await orientation.lock('landscape');
						lockSucceeded = true;
					} catch (lockError) {
						lockSucceeded = false;
					}
				}
			} catch (fullscreenError) {
				fullscreenSucceeded = false;
			} finally {
				await waitForViewportSettle();
				var stillPortrait = isPortraitViewport(getViewportSize());
				if (stillPortrait) {
					showLandscapeFeedback('已切换左转横屏牌桌；请将手机向左横置以获得全屏横向画面');
				} else if (lockSucceeded) {
					showLandscapeFeedback('已进入横屏操作');
				} else if (fullscreenSucceeded) {
					showLandscapeFeedback('已进入全屏横屏画面');
				} else {
					showLandscapeFeedback('已切换左转横屏牌桌；浏览器未能进入全屏');
				}
				button.disabled = false;
			}
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
