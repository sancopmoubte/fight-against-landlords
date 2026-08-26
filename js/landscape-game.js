/* 固定横向牌桌：始终以 1400 × 789 的比例直接显示；仅等比例缩放，不根据设备方向遮罩或重排。 */
(function () {
	var GAME_WIDTH = 1400;
	var GAME_HEIGHT = 789;
	var feedbackTimer = null;

  function updateFixedCanvas() {
    var width = window.innerWidth || document.documentElement.clientWidth;
    var height = window.innerHeight || document.documentElement.clientHeight;
    var scale = Math.min(1, width / GAME_WIDTH, height / GAME_HEIGHT);
    document.documentElement.style.setProperty('--fixed-game-scale', String(Math.max(0.1, scale)));
  }

	window.addEventListener('resize', updateFixedCanvas);
	window.addEventListener('orientationchange', updateFixedCanvas);

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
			try {
				var root = document.documentElement;
				if (!document.fullscreenElement && root.requestFullscreen) {
					await root.requestFullscreen();
				}

				var orientation = window.screen && window.screen.orientation;
				if (orientation && typeof orientation.lock === 'function') {
					try {
						await orientation.lock('landscape');
						showLandscapeFeedback('已进入横屏操作');
					} catch (lockError) {
						showLandscapeFeedback('已进入全屏；若仍未横屏，请手动横置设备');
					}
				} else {
					showLandscapeFeedback('已进入全屏；请横置设备以获得更大画面');
				}
			} catch (fullscreenError) {
				showLandscapeFeedback('当前浏览器不能自动横屏，请手动横置设备');
			} finally {
				updateFixedCanvas();
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
