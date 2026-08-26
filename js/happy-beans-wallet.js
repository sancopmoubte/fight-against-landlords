/* 夏日牌桌扩展：本地欢乐豆账户、签名凭证与历史账本；仅用于游戏积分，不接入真实资产。 */
(function () {
	'use strict';

	var STORE_KEY = 'happyBeansWalletV1';
	var LEGACY_BALANCE_KEY = 'key';
	var DEFAULT_BALANCE = 9999;
	var ADDRESS_PREFIX = 'HB1-';
	var state;
	var subscribers = [];

	function nowId(prefix) {
		if (window.crypto && window.crypto.randomUUID) return prefix + window.crypto.randomUUID();
		return prefix + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
	}

	function safeInteger(value) {
		var number = Math.floor(Number(value));
		return Number.isFinite(number) && number >= 0 ? number : 0;
	}

	function format(value) {
		return safeInteger(value).toLocaleString('zh-CN');
	}

	function bytesToBase64(buffer) {
		var bytes = new Uint8Array(buffer);
		var binary = '';
		for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
		return window.btoa(binary);
	}

	function base64ToBuffer(base64) {
		var binary = window.atob(base64);
		var bytes = new Uint8Array(binary.length);
		for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
		return bytes.buffer;
	}

	function textToBase64(value) {
		return window.btoa(unescape(encodeURIComponent(value)));
	}

	function base64ToText(value) {
		return decodeURIComponent(escape(window.atob(value)));
	}

	function initialState() {
		return {
			version: 1,
			balance: DEFAULT_BALANCE,
			identity: null,
			usedVoucherIds: [],
			history: [{
				id: nowId('opening-'),
				type: 'opening',
				amount: DEFAULT_BALANCE,
				balance: DEFAULT_BALANCE,
				label: '首次赠送欢乐豆',
				createdAt: Date.now()
			}]
		};
	}

	function loadState() {
		try {
			var raw = window.localStorage.getItem(STORE_KEY);
			state = raw ? JSON.parse(raw) : initialState();
			if (!state || state.version !== 1) state = initialState();
		} catch (error) {
			state = initialState();
		}

		state.balance = safeInteger(state.balance);
		state.usedVoucherIds = Array.isArray(state.usedVoucherIds) ? state.usedVoucherIds.slice(-200) : [];
		state.history = Array.isArray(state.history) ? state.history.slice(0, 60) : [];
		if (!state.history.length) state.history = initialState().history;
		persist();
	}

	function persist() {
		try {
			window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
			window.sessionStorage.setItem(LEGACY_BALANCE_KEY, String(state.balance));
			window.sessionStorage.setItem('happyBeanGrantVersion', 'wallet-v1');
		} catch (error) {
			console.warn('欢乐豆本地存储不可用', error);
		}
	}

	function notify() {
		persist();
		render();
		for (var i = 0; i < subscribers.length; i++) subscribers[i](state.balance);
	}

	function appendHistory(entry) {
		state.history.unshift({
			id: nowId('record-'),
			type: entry.type || 'system',
			amount: Math.abs(safeInteger(entry.amount)),
			balance: state.balance,
			label: entry.label || '欢乐豆变动',
			counterparty: entry.counterparty || '',
			createdAt: entry.createdAt || Date.now()
		});
		state.history = state.history.slice(0, 60);
	}

	function getAddress() {
		return state.identity && state.identity.publicKey ? ADDRESS_PREFIX + state.identity.publicKey : '';
	}

	function shortAddress(address) {
		if (!address) return '正在生成账户地址…';
		return address.length > 34 ? address.slice(0, 17) + '…' + address.slice(-14) : address;
	}

	function ensureCrypto() {
		if (!window.crypto || !window.crypto.subtle) {
			throw new Error('当前浏览器不支持安全签名，无法创建离线转账凭证');
		}
	}

	async function ensureIdentity() {
		if (state.identity && state.identity.publicKey && state.identity.privateKey) return getAddress();
		ensureCrypto();
		var pair = await window.crypto.subtle.generateKey(
			{ name: 'ECDSA', namedCurve: 'P-256' },
			true,
			['sign', 'verify']
		);
		var publicKey = bytesToBase64(await window.crypto.subtle.exportKey('raw', pair.publicKey));
		var privateKey = bytesToBase64(await window.crypto.subtle.exportKey('pkcs8', pair.privateKey));
		state.identity = { publicKey: publicKey, privateKey: privateKey, createdAt: Date.now() };
		appendHistory({ type: 'identity', amount: 0, label: '已创建本机欢乐豆收款身份' });
		notify();
		return getAddress();
	}

	async function importPrivateKey() {
		ensureCrypto();
		return window.crypto.subtle.importKey(
			'pkcs8',
			base64ToBuffer(state.identity.privateKey),
			{ name: 'ECDSA', namedCurve: 'P-256' },
			true,
			['sign']
		);
	}

	async function importPublicKey(publicKey) {
		ensureCrypto();
		return window.crypto.subtle.importKey(
			'raw',
			base64ToBuffer(publicKey),
			{ name: 'ECDSA', namedCurve: 'P-256' },
			true,
			['verify']
		);
	}

	function normalizeAddress(address) {
		return String(address || '').trim();
	}

	function publicKeyFromAddress(address) {
		if (!address || address.indexOf(ADDRESS_PREFIX) !== 0) throw new Error('收款地址格式不正确');
		return address.slice(ADDRESS_PREFIX.length);
	}

	async function createVoucher(destination, amount) {
		var address = await ensureIdentity();
		var to = normalizeAddress(destination);
		var value = safeInteger(amount);
		if (!to) throw new Error('请填写收款方欢乐豆地址');
		if (to === address) throw new Error('不能向自己的地址转账');
		publicKeyFromAddress(to);
		if (value <= 0) throw new Error('请输入大于 0 的整数欢乐豆');
		if (value > state.balance) throw new Error('欢乐豆余额不足');

		var payload = {
			version: 'HB1',
			from: address,
			to: to,
			amount: value,
			id: nowId('voucher-'),
			createdAt: Date.now()
		};
		var encodedPayload = JSON.stringify(payload);
		var signature = await window.crypto.subtle.sign(
			{ name: 'ECDSA', hash: { name: 'SHA-256' } },
			await importPrivateKey(),
			new TextEncoder().encode(encodedPayload)
		);
		var voucher = textToBase64(JSON.stringify({
			version: 'HB1',
			payload: payload,
			signature: bytesToBase64(signature)
		}));

		state.balance -= value;
		appendHistory({
			type: 'send',
			amount: value,
			label: '已生成离线转账凭证',
			counterparty: shortAddress(to)
		});
		notify();
		return voucher;
	}

	async function receiveVoucher(rawVoucher) {
		var input = String(rawVoucher || '').trim();
		if (!input) throw new Error('请粘贴收到的欢乐豆凭证');
		var address = await ensureIdentity();
		var voucher;
		try {
			voucher = JSON.parse(base64ToText(input));
		} catch (error) {
			throw new Error('凭证格式无法识别');
		}
		if (!voucher || voucher.version !== 'HB1' || !voucher.payload || !voucher.signature) {
			throw new Error('凭证版本或内容不完整');
		}
		var payload = voucher.payload;
		var value = safeInteger(payload.amount);
		if (payload.to !== address) throw new Error('该凭证不是发给当前欢乐豆地址');
		if (!payload.id || state.usedVoucherIds.indexOf(payload.id) !== -1) throw new Error('该凭证已被接收过');
		if (value <= 0) throw new Error('凭证金额无效');

		var senderPublicKey = publicKeyFromAddress(payload.from);
		var valid = await window.crypto.subtle.verify(
			{ name: 'ECDSA', hash: { name: 'SHA-256' } },
			await importPublicKey(senderPublicKey),
			base64ToBuffer(voucher.signature),
			new TextEncoder().encode(JSON.stringify(payload))
		);
		if (!valid) throw new Error('签名校验失败，凭证已损坏或被篡改');

		state.balance += value;
		state.usedVoucherIds.push(payload.id);
		state.usedVoucherIds = state.usedVoucherIds.slice(-200);
		appendHistory({
			type: 'receive',
			amount: value,
			label: '已验证并接收离线凭证',
			counterparty: shortAddress(payload.from)
		});
		notify();
		return { amount: value, from: shortAddress(payload.from) };
	}

	function setBalance(value) {
		state.balance = safeInteger(value);
		notify();
		return state.balance;
	}

	function applyGameDelta(delta, label) {
		var numericDelta = Math.trunc(Number(delta) || 0);
		var previous = state.balance;
		state.balance = Math.max(0, previous + numericDelta);
		var actualDelta = state.balance - previous;
		if (actualDelta) {
			appendHistory({
				type: 'game',
				amount: Math.abs(actualDelta),
				label: label || (actualDelta > 0 ? '斗地主胜利结算 +50' : '斗地主失败结算 -50')
			});
		}
		notify();
		return state.balance;
	}

	function escapeHtml(value) {
		return String(value || '').replace(/[&<>'"]/g, function (character) {
			return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character];
		});
	}

	function recordTypeLabel(type) {
		return ({ opening: '赠送', identity: '身份', send: '转出', receive: '收款', game: '对局' })[type] || '记录';
	}

	function renderHistory() {
		var list = document.getElementById('walletHistoryList');
		if (!list) return;
		if (!state.history.length) {
			list.innerHTML = '<div class="wallet-empty">暂无欢乐豆账本记录。</div>';
			return;
		}
		list.innerHTML = state.history.slice(0, 12).map(function (item) {
			var isMinus = item.type === 'send' || (item.type === 'game' && /失败|-50/.test(item.label));
			var sign = isMinus ? '−' : '＋';
			return '<div class="wallet-record">' +
				'<span class="wallet-record-kind">' + escapeHtml(recordTypeLabel(item.type)) + '</span>' +
				'<span class="wallet-record-main"><strong>' + escapeHtml(item.label) + '</strong><small>' + new Date(item.createdAt).toLocaleString('zh-CN') + (item.counterparty ? ' · ' + escapeHtml(item.counterparty) : '') + '</small></span>' +
				'<span class="wallet-record-amount ' + (isMinus ? 'is-minus' : 'is-plus') + '">' + sign + format(item.amount) + '</span>' +
				'</div>';
		}).join('');
	}

	function render() {
		var balanceNodes = document.querySelectorAll('[data-wallet-balance]');
		for (var i = 0; i < balanceNodes.length; i++) balanceNodes[i].textContent = format(state.balance);
		var tableBalanceNodes = document.querySelectorAll('.scoreContent span');
		for (var t = 0; t < tableBalanceNodes.length; t++) {
			tableBalanceNodes[t].setAttribute('data-balance', String(state.balance));
			tableBalanceNodes[t].textContent = format(state.balance);
		}
		var address = getAddress();
		var addressNodes = document.querySelectorAll('[data-wallet-address]');
		for (var j = 0; j < addressNodes.length; j++) addressNodes[j].value = address;
		var status = document.getElementById('walletIdentityStatus');
		if (status) status.textContent = address ? '本机收款地址已就绪' : '打开账户后会生成本机收款地址';
		renderHistory();
	}

	function copyText(value) {
		if (!value) return Promise.reject(new Error('暂无可复制内容'));
		if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(value);
		var textarea = document.createElement('textarea');
		textarea.value = value;
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		textarea.remove();
		return Promise.resolve();
	}

	function setMessage(message, type) {
		var target = document.getElementById('walletMessage');
		if (!target) return;
		target.className = 'wallet-message is-' + (type || 'info');
		target.textContent = message;
	}

	function selectTab(tabName) {
		var panels = document.querySelectorAll('[data-wallet-panel]');
		var buttons = document.querySelectorAll('[data-wallet-tab]');
		for (var i = 0; i < panels.length; i++) panels[i].classList.toggle('is-active', panels[i].getAttribute('data-wallet-panel') === tabName);
		for (var j = 0; j < buttons.length; j++) buttons[j].classList.toggle('is-active', buttons[j].getAttribute('data-wallet-tab') === tabName);
	}

	function mount() {
		var panel = document.getElementById('walletPanel');
		var toggle = document.getElementById('walletToggle');
		if (!panel || !toggle) return;

		function close() {
			panel.classList.remove('is-open');
			toggle.setAttribute('aria-expanded', 'false');
		}

		async function open() {
			panel.classList.add('is-open');
			toggle.setAttribute('aria-expanded', 'true');
			setMessage('欢乐豆仅保存在当前浏览器，用于本游戏的离线积分。', 'info');
			try {
				await ensureIdentity();
				setMessage('收款身份已就绪；可复制地址、生成转账凭证或验证收款。', 'success');
			} catch (error) {
				setMessage(error.message, 'error');
			}
		}

		toggle.addEventListener('pointerdown', function (event) { event.stopPropagation(); });
		toggle.addEventListener('click', function (event) {
			event.preventDefault();
			event.stopImmediatePropagation();
			if (panel.classList.contains('is-open')) close(); else open();
		});
		panel.addEventListener('click', function (event) { event.stopPropagation(); });
		document.getElementById('walletClose').addEventListener('click', close);

		var tabs = document.querySelectorAll('[data-wallet-tab]');
		for (var i = 0; i < tabs.length; i++) {
			tabs[i].addEventListener('click', function () { selectTab(this.getAttribute('data-wallet-tab')); });
		}

		document.getElementById('walletCopyAddress').addEventListener('click', function () {
			copyText(getAddress()).then(function () { setMessage('欢乐豆收款地址已复制。', 'success'); }).catch(function (error) { setMessage(error.message, 'error'); });
		});
		document.getElementById('walletCopyVoucher').addEventListener('click', function () {
			copyText(document.getElementById('walletVoucherOutput').value).then(function () { setMessage('离线转账凭证已复制，可发送给收款方。', 'success'); }).catch(function (error) { setMessage(error.message, 'error'); });
		});

		document.getElementById('walletSendForm').addEventListener('submit', async function (event) {
			event.preventDefault();
			var button = document.getElementById('walletCreateVoucher');
			button.disabled = true;
			try {
				var voucher = await createVoucher(document.getElementById('walletRecipient').value, document.getElementById('walletSendAmount').value);
				document.getElementById('walletVoucherOutput').value = voucher;
				document.getElementById('walletVoucherResult').classList.add('is-visible');
				setMessage('凭证已生成，欢乐豆已从本机余额扣除。请复制凭证发给收款方。', 'success');
			} catch (error) {
				setMessage(error.message, 'error');
			} finally {
				button.disabled = false;
			}
		});

		document.getElementById('walletReceiveForm').addEventListener('submit', async function (event) {
			event.preventDefault();
			var button = document.getElementById('walletReceiveVoucher');
			button.disabled = true;
			try {
				var result = await receiveVoucher(document.getElementById('walletVoucherInput').value);
				document.getElementById('walletVoucherInput').value = '';
				setMessage('已验证并接收 ' + format(result.amount) + ' 欢乐豆。', 'success');
				selectTab('history');
			} catch (error) {
				setMessage(error.message, 'error');
			} finally {
				button.disabled = false;
			}
		});

		document.addEventListener('keydown', function (event) { if (event.key === 'Escape') close(); });
		render();
	}

	loadState();
	window.HappyBeansWallet = {
		getBalance: function () { return state.balance; },
		setBalance: setBalance,
		applyGameDelta: applyGameDelta,
		getAddress: getAddress,
		ensureIdentity: ensureIdentity,
		createVoucher: createVoucher,
		receiveVoucher: receiveVoucher,
		subscribe: function (callback) { subscribers.push(callback); return function () { subscribers = subscribers.filter(function (item) { return item !== callback; }); }; }
	};

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
	else mount();
})();
