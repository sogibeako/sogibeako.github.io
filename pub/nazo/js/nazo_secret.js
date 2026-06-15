console.log('fetch rss_test.php');

fetch('rss_test.php')
    .then(response => response.text())
    .then(html => {
        const rssArea = document.getElementById('rss-area');
        if (rssArea) rssArea.innerHTML = html;
    })
    .catch(() => {
        const rssArea = document.getElementById('rss-area');
        if (rssArea) rssArea.textContent = 'RSSを取得できませんでした。';
    });

(function () {
    const wrapper = document.getElementById('booru-wrapper');
    const booruArea = document.getElementById('booru-area');
    const secretImg = document.getElementById('booru-secret-image');

    if (!wrapper || !booruArea) return;

    let booruLoaded = false;

    // =========================
    // PC: コナミコマンド
    // =========================
    const secretCode = [
        'ArrowUp',
        'ArrowUp',
        'ArrowDown',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'ArrowLeft',
        'ArrowRight',
        'b',
        'a'
    ];
    let inputBuffer = [];

    // =========================
    // Mobile: 画像の角タップ
    // 左上→右上→左下→右下 を2回
    // =========================
    const tapSequence = ['tl', 'tr', 'bl', 'br', 'tl', 'tr', 'bl', 'br'];
    let tapIndex = 0;
    let lastTapTime = 0;
    const tapTimeout = 4000;
    const cornerRatio = 0.28;

    function loadBooruOnce() {
        if (booruLoaded) return;
        booruLoaded = true;

        console.log('fetch booru_test.php');

        fetch('booru_test.php')
            .then(response => response.text())
            .then(html => {
                booruArea.innerHTML = html;
            })
            .catch(() => {
                booruArea.textContent = '監視データを取得できませんでした。';
            });
    }

    function toggleBooru() {
        const isHidden =
            wrapper.style.display === 'none' ||
            wrapper.style.display === '';

        wrapper.style.display = isHidden ? 'block' : 'none';

        if (isHidden) {
            loadBooruOnce();
        }
    }

    function matchesSecretCode() {
        if (inputBuffer.length < secretCode.length) return false;
        const tail = inputBuffer.slice(-secretCode.length);
        return secretCode.every((key, i) => tail[i] === key);
    }

    function resetTapSequence() {
        tapIndex = 0;
        lastTapTime = 0;
    }

    function getImageCorner(touch, element) {
        const rect = element.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            return null;
        }

        const rx = rect.width * cornerRatio;
        const ry = rect.height * cornerRatio;

        if (x <= rx && y <= ry) return 'tl';
        if (x >= rect.width - rx && y <= ry) return 'tr';
        if (x <= rx && y >= rect.height - ry) return 'bl';
        if (x >= rect.width - rx && y >= rect.height - ry) return 'br';

        return null;
    }

    function handleSecretTap(touch) {
        if (!secretImg) return;

        const corner = getImageCorner(touch, secretImg);
        if (!corner) {
            resetTapSequence();
            return;
        }

        const now = Date.now();

        if (tapIndex > 0 && now - lastTapTime > tapTimeout) {
            resetTapSequence();
        }

        const expected = tapSequence[tapIndex];

        if (corner === expected) {
            tapIndex++;
            lastTapTime = now;

            if (tapIndex >= tapSequence.length) {
                resetTapSequence();
                toggleBooru();
            }
        } else {
            if (corner === tapSequence[0]) {
                tapIndex = 1;
                lastTapTime = now;
            } else {
                resetTapSequence();
            }
        }
    }

    window.addEventListener('keydown', function (e) {
        const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) {
            return;
        }

        const key = (e.key.length === 1) ? e.key.toLowerCase() : e.key;
        inputBuffer.push(key);

        if (inputBuffer.length > secretCode.length) {
            inputBuffer.shift();
        }

        if (matchesSecretCode()) {
            toggleBooru();
            inputBuffer = [];
        }
    });

    if (secretImg) {
        secretImg.addEventListener('touchstart', function (e) {
            if (e.touches.length !== 1) {
                resetTapSequence();
                return;
            }

            handleSecretTap(e.touches[0]);
        }, { passive: true });
    }
})();