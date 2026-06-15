const pressed = new Set();

// =========================
// PC: A + B + Enter
// =========================
window.addEventListener("keydown", (e) => {
    const tag =
        e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || e.target.isContentEditable) {
        return;
    }

    pressed.add(e.key.toLowerCase());

    if (e.key === "Enter") {
        if (pressed.has("a") && pressed.has("b")) {
            e.preventDefault();
            window.location.href = "../nazo/nazo.htm";
        }
    }
});

window.addEventListener("keyup", (e) => {
    pressed.delete(e.key.toLowerCase());
});

window.addEventListener("blur", () => pressed.clear());

// =========================
// Mobile: トップ画像の角タップ
// 左上→右上→左下→右下 を2回
// =========================
document.addEventListener("DOMContentLoaded", () => {
    const secretImg = document.querySelector("img.top-image");
    if (!secretImg) return;

    const secretTap = {
        sequence: ["tl", "tr", "bl", "br", "tl", "tr", "bl", "br"],
        index: 0,
        lastTime: 0,
        timeout: 4000,   // 前回タップから4秒空いたらリセット
        cornerRatio: 0.28 // 画像の各隅28%四方を判定領域に
    };

    function resetSecretTap() {
        secretTap.index = 0;
        secretTap.lastTime = 0;
    }

    function getImageCorner(touch, element) {
        const rect = element.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            return null;
        }

        const rx = rect.width * secretTap.cornerRatio;
        const ry = rect.height * secretTap.cornerRatio;

        if (x <= rx && y <= ry) return "tl";
        if (x >= rect.width - rx && y <= ry) return "tr";
        if (x <= rx && y >= rect.height - ry) return "bl";
        if (x >= rect.width - rx && y >= rect.height - ry) return "br";

        return null;
    }

    function handleSecretTouch(touch) {
        const corner = getImageCorner(touch, secretImg);
        if (!corner) {
            resetSecretTap();
            return;
        }

        const now = Date.now();

        if (secretTap.index > 0 && now - secretTap.lastTime > secretTap.timeout) {
            resetSecretTap();
        }

        const expected = secretTap.sequence[secretTap.index];

        if (corner === expected) {
            secretTap.index++;
            secretTap.lastTime = now;

            if (secretTap.index >= secretTap.sequence.length) {
                resetSecretTap();
                window.location.href = "../nazo/nazo.htm";
            }
        } else {
            // 失敗時、今回が先頭入力ならそこから再開
            if (corner === secretTap.sequence[0]) {
                secretTap.index = 1;
                secretTap.lastTime = now;
            } else {
                resetSecretTap();
            }
        }
    }

    secretImg.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) {
            resetSecretTap();
            return;
        }
        handleSecretTouch(e.touches[0]);
    }, { passive: true });
});