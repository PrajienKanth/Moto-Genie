document.addEventListener("DOMContentLoaded", () => {
    const preloader = document.getElementById("preloader");
    const progressBar = document.getElementById("preloader-progress-bar");
    const percentText = document.getElementById("preloader-percent");
    const statusText = document.getElementById("preloader-status-text");

    if (!preloader) {
        return;
    }

    let finished = false;
    let startTime = performance.now();

    const duration = 900;

    const stages = [
        {
            progress: 18,
            text: "Initializing intelligence"
        },
        {
            progress: 40,
            text: "Loading vehicle data"
        },
        {
            progress: 62,
            text: "Preparing AI systems"
        },
        {
            progress: 84,
            text: "Connecting knowledge base"
        },
        {
            progress: 100,
            text: "Ready"
        }
    ];

    function updateProgress(value, text) {
        const roundedValue = Math.min(
            100,
            Math.max(0, Math.round(value))
        );

        if (progressBar) {
            progressBar.style.width = `${roundedValue}%`;
        }

        if (percentText) {
            percentText.textContent = `${roundedValue}%`;
        }

        if (statusText && text) {
            statusText.textContent = text;
        }
    }

    function getCurrentStage(progress) {
        let activeStage = stages[0];

        for (const stage of stages) {
            if (progress >= stage.progress) {
                activeStage = stage;
            } else {
                break;
            }
        }

        return activeStage;
    }

    function finishPreloader() {
        if (finished) {
            return;
        }

        finished = true;

        updateProgress(100, "Ready");

        preloader.classList.add("preloader-exit");

        window.setTimeout(() => {
            preloader.classList.add("preloader-hidden");
        }, 280);

        window.setTimeout(() => {
            if (preloader && preloader.parentNode) {
                preloader.remove();
            }
        }, 700);
    }

    function animateProgress(currentTime) {
        if (finished) {
            return;
        }

        const elapsed = currentTime - startTime;

        const progress = Math.min(
            elapsed / duration,
            1
        );

        const easedProgress =
            1 - Math.pow(1 - progress, 3);

        const value = easedProgress * 100;

        const stage = getCurrentStage(value);

        updateProgress(
            value,
            stage.text
        );

        if (progress < 1) {
            requestAnimationFrame(
                animateProgress
            );
        } else {
            finishPreloader();
        }
    }

    updateProgress(
        0,
        "Initializing intelligence"
    );

    requestAnimationFrame(
        animateProgress
    );

    window.setTimeout(() => {
        finishPreloader();
    }, 1400);
});