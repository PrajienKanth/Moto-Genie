document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const comparisonForm =
        document.getElementById("carComparisonForm");

    const company1Input =
        document.getElementById("company1");

    const company2Input =
        document.getElementById("company2");

    const model1Input =
        document.getElementById("model1");

    const model2Input =
        document.getElementById("model2");

    const requirementsInput =
        document.getElementById("user_requirements");

    const companyModelsElement =
        document.getElementById("companyModelsData");

    const loader =
        document.getElementById("loader");

    const comparisonResults =
        document.getElementById("comparisonResults");

    let companyModels = {};

    try {
        if (companyModelsElement) {
            companyModels =
                JSON.parse(
                    companyModelsElement.textContent || "{}"
                );
        }
    } catch (error) {
        console.error(
            "Moto Genie: Failed to parse company model data.",
            error
        );
        companyModels = {};
    }

    initializeAOS();
    initializeCompanyInputs();
    initializeModelInputs();
    initializeRequirementChips();
    initializeTabs();
    initializeMetricBars();
    initializeMatchBars();
    initializePerformanceBars();
    initializeSpeechControls();
    initializeExportControls();
    initializeFormValidation();
    initializeInputFocus();
    initializeResultAnimations();

    updateModels(
        company1Input,
        model1Input,
        "models1"
    );

    updateModels(
        company2Input,
        model2Input,
        "models2"
    );

    updateVehiclePreview(1);
    updateVehiclePreview(2);

    if (comparisonForm) {
        comparisonForm.addEventListener(
            "submit",
            handleFormSubmit
        );
    }

    function initializeAOS() {
        if (typeof AOS === "undefined") {
            return;
        }

        AOS.init({
            duration: 700,
            easing: "ease-out-cubic",
            once: true,
            mirror: false,
            offset: 60,
            disable: false
        });

        window.addEventListener(
            "load",
            () => {
                setTimeout(() => {
                    if (typeof AOS !== "undefined") {
                        AOS.refreshHard();
                    }
                }, 250);
            },
            { once: true }
        );
    }

    function initializeCompanyInputs() {
        [
            company1Input,
            company2Input
        ].forEach((input) => {
            if (!input) {
                return;
            }

            input.addEventListener(
                "input",
                () => {
                    const vehicle =
                        input === company1Input
                            ? 1
                            : 2;

                    const modelInput =
                        vehicle === 1
                            ? model1Input
                            : model2Input;

                    const datalistId =
                        vehicle === 1
                            ? "models1"
                            : "models2";

                    updateModels(
                        input,
                        modelInput,
                        datalistId
                    );

                    updateVehiclePreview(
                        vehicle
                    );

                    clearValidationError(
                        input
                    );
                }
            );

            input.addEventListener(
                "change",
                () => {
                    const vehicle =
                        input === company1Input
                            ? 1
                            : 2;

                    const modelInput =
                        vehicle === 1
                            ? model1Input
                            : model2Input;

                    const datalistId =
                        vehicle === 1
                            ? "models1"
                            : "models2";

                    updateModels(
                        input,
                        modelInput,
                        datalistId
                    );

                    updateVehiclePreview(
                        vehicle
                    );
                }
            );
        });
    }

    function initializeModelInputs() {
        [
            model1Input,
            model2Input
        ].forEach((input) => {
            if (!input) {
                return;
            }

            input.addEventListener(
                "input",
                () => {
                    const vehicle =
                        input === model1Input
                            ? 1
                            : 2;

                    updateVehiclePreview(
                        vehicle
                    );

                    clearValidationError(
                        input
                    );
                }
            );

            input.addEventListener(
                "change",
                () => {
                    const vehicle =
                        input === model1Input
                            ? 1
                            : 2;

                    updateVehiclePreview(
                        vehicle
                    );
                }
            );
        });
    }

    function updateModels(
        companyInput,
        modelInput,
        datalistId
    ) {
        if (
            !companyInput ||
            !modelInput
        ) {
            return;
        }

        const datalist =
            document.getElementById(
                datalistId
            );

        if (!datalist) {
            return;
        }

        const company =
            companyInput.value.trim();

        datalist.innerHTML = "";

        if (!company) {
            modelInput.value = "";
            updateVehiclePreview(
                companyInput === company1Input
                    ? 1
                    : 2
            );
            return;
        }

        const companyKey =
            findCompanyKey(
                company
            );

        if (!companyKey) {
            return;
        }

        const models =
            companyModels[companyKey];

        if (!Array.isArray(models)) {
            return;
        }

        models.forEach((model) => {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                typeof model === "string"
                    ? model
                    : model?.name || "";

            if (option.value) {
                datalist.appendChild(
                    option
                );
            }
        });
    }

    function findCompanyKey(
        company
    ) {
        const normalized =
            normalize(company);

        return Object.keys(
            companyModels || {}
        ).find(
            (key) =>
                normalize(key) ===
                normalized
        );
    }

    function updateVehiclePreview(
        vehicle
    ) {
        const preview =
            document.getElementById(
                `vehiclePreview${vehicle}`
            );

        if (!preview) {
            return;
        }

        const companyInput =
            vehicle === 1
                ? company1Input
                : company2Input;

        const modelInput =
            vehicle === 1
                ? model1Input
                : model2Input;

        if (
            !companyInput ||
            !modelInput
        ) {
            return;
        }

        const company =
            companyInput.value.trim();

        const model =
            modelInput.value.trim();

        const strong =
            preview.querySelector(
                "strong"
            );

        const label =
            preview.querySelector(
                "span"
            );

        const icon =
            preview.querySelector(
                "i"
            );

        if (strong) {
            strong.textContent =
                model ||
                "Select a vehicle";
        }

        if (label) {
            label.textContent =
                vehicle === 1
                    ? "YOUR FIRST CHOICE"
                    : "YOUR SECOND CHOICE";
        }

        preview.classList.toggle(
            "has-selection",
            Boolean(
                company &&
                model
            )
        );

        if (icon) {
            icon.className =
                model
                    ? "fas fa-car-side"
                    : "fas fa-car-side";
        }
    }

    function initializeRequirementChips() {
        const chips =
            document.querySelectorAll(
                ".requirement-chip"
            );

        if (!chips.length) {
            return;
        }

        chips.forEach((chip) => {
            chip.addEventListener(
                "click",
                () => {
                    if (!requirementsInput) {
                        return;
                    }

                    const value =
                        chip.dataset.requirement ||
                        chip.textContent.trim();

                    if (!value) {
                        return;
                    }

                    const current =
                        requirementsInput.value
                            .trim();

                    const requirements =
                        current
                            ? current
                                .split(",")
                                .map(
                                    (item) =>
                                        item.trim()
                                )
                                .filter(Boolean)
                            : [];

                    const existingIndex =
                        requirements.findIndex(
                            (item) =>
                                normalize(item) ===
                                normalize(value)
                        );

                    if (
                        existingIndex >= 0
                    ) {
                        requirements.splice(
                            existingIndex,
                            1
                        );

                        chip.classList.remove(
                            "active"
                        );
                    } else {
                        requirements.push(
                            value
                        );

                        chip.classList.add(
                            "active"
                        );
                    }

                    requirementsInput.value =
                        requirements.join(
                            ", "
                        );

                    requirementsInput.dispatchEvent(
                        new Event(
                            "input",
                            {
                                bubbles: true
                            }
                        )
                    );

                    requirementsInput.focus();
                }
            );
        });

        syncRequirementChips();
    }

    function syncRequirementChips() {
        if (!requirementsInput) {
            return;
        }

        const current =
            requirementsInput.value
                .toLowerCase();

        document
            .querySelectorAll(
                ".requirement-chip"
            )
            .forEach((chip) => {
                const value =
                    chip.dataset.requirement ||
                    chip.textContent.trim();

                chip.classList.toggle(
                    "active",
                    current.includes(
                        value.toLowerCase()
                    )
                );
            });
    }

    function initializeTabs() {
        const tabs =
            document.querySelectorAll(
                ".comparison-tab"
            );

        const contents =
            document.querySelectorAll(
                ".comparison-tab-content"
            );

        if (!tabs.length) {
            return;
        }

        tabs.forEach((tab) => {
            tab.addEventListener(
                "click",
                () => {
                    const target =
                        tab.dataset.tab;

                    if (!target) {
                        return;
                    }

                    tabs.forEach(
                        (item) => {
                            item.classList.remove(
                                "active"
                            );

                            item.setAttribute(
                                "aria-selected",
                                "false"
                            );
                        }
                    );

                    contents.forEach(
                        (content) => {
                            content.classList.remove(
                                "active"
                            );
                        }
                    );

                    tab.classList.add(
                        "active"
                    );

                    tab.setAttribute(
                        "aria-selected",
                        "true"
                    );

                    const targetContent =
                        document.getElementById(
                            target
                        );

                    if (
                        targetContent
                    ) {
                        targetContent.classList.add(
                            "active"
                        );

                        animateBarsInside(
                            targetContent
                        );
                    }
                }
            );
        });

        const activeTab =
            document.querySelector(
                ".comparison-tab.active"
            );

        if (activeTab) {
            const target =
                activeTab.dataset.tab;

            const targetContent =
                document.getElementById(
                    target
                );

            if (targetContent) {
                targetContent.classList.add(
                    "active"
                );
            }
        }
    }

    function initializeMetricBars() {
        const cards =
            document.querySelectorAll(
                ".metric-card[data-value1][data-value2]"
            );

        cards.forEach((card) => {
            const value1 =
                parseNumber(
                    card.dataset.value1
                );

            const value2 =
                parseNumber(
                    card.dataset.value2
                );

            const bars =
                card.querySelectorAll(
                    ".comparison-bar span"
                );

            if (
                bars.length < 2 ||
                value1 === null ||
                value2 === null
            ) {
                return;
            }

            const max =
                Math.max(
                    value1,
                    value2,
                    1
                );

            const width1 =
                (value1 / max) * 100;

            const width2 =
                (value2 / max) * 100;

            setBarWidth(
                bars[0],
                width1
            );

            setBarWidth(
                bars[1],
                width2
            );
        });
    }

    function initializePerformanceBars() {
        const cards =
            document.querySelectorAll(
                ".performance-card"
            );

        cards.forEach((card) => {
            const fill =
                card.querySelector(
                    ".performance-fill"
                );

            if (!fill) {
                return;
            }

            const values =
                extractNumbers(
                    card.textContent
                );

            if (
                values.length < 2
            ) {
                return;
            }

            const value1 =
                values[0];

            const value2 =
                values[1];

            const max =
                Math.max(
                    value1,
                    value2,
                    1
                );

            const width =
                (Math.max(
                    value1,
                    value2
                ) / max) * 100;

            setBarWidth(
                fill,
                width
            );
        });
    }

    function initializeMatchBars() {
        const barOne =
            document.getElementById(
                "matchBarOne"
            );

        const barTwo =
            document.getElementById(
                "matchBarTwo"
            );

        if (barOne) {
            setBarWidth(
                barOne,
                barOne.dataset.value ||
                50
            );
        }

        if (barTwo) {
            setBarWidth(
                barTwo,
                barTwo.dataset.value ||
                50
            );
        }

        if (
            barOne &&
            barTwo &&
            !barOne.dataset.value &&
            !barTwo.dataset.value
        ) {
            calculateRequirementMatch(
                barOne,
                barTwo
            );
        }
    }

    function calculateRequirementMatch(
        barOne,
        barTwo
    ) {
        const requirements =
            requirementsInput
                ?.value
                .toLowerCase() || "";

        const car1 =
            getVehicleText(1)
                .toLowerCase();

        const car2 =
            getVehicleText(2)
                .toLowerCase();

        const keywords =
            requirements
                .split(/[,\s]+/)
                .filter(
                    (word) =>
                        word.length > 2
                );

        if (!keywords.length) {
            setBarWidth(
                barOne,
                50
            );

            setBarWidth(
                barTwo,
                50
            );

            return;
        }

        let score1 = 0;
        let score2 = 0;

        keywords.forEach(
            (keyword) => {
                if (
                    car1.includes(
                        keyword
                    )
                ) {
                    score1++;
                }

                if (
                    car2.includes(
                        keyword
                    )
                ) {
                    score2++;
                }
            }
        );

        const total =
            Math.max(
                score1 + score2,
                1
            );

        const percent1 =
            Math.max(
                15,
                (score1 / total) *
                    100
            );

        const percent2 =
            Math.max(
                15,
                (score2 / total) *
                    100
            );

        setBarWidth(
            barOne,
            percent1
        );

        setBarWidth(
            barTwo,
            percent2
        );
    }

    function initializeSpeechControls() {
        const playButton =
            document.getElementById(
                "comparisonSpeechPlay"
            );

        const pauseButton =
            document.getElementById(
                "comparisonSpeechPause"
            );

        const stopButton =
            document.getElementById(
                "comparisonSpeechStop"
            );

        const status =
            document.getElementById(
                "comparisonSpeechStatus"
            );

        if (
            !playButton &&
            !pauseButton &&
            !stopButton
        ) {
            return;
        }

        if (
            !("speechSynthesis" in window)
        ) {
            [
                playButton,
                pauseButton,
                stopButton
            ].forEach((button) => {
                if (button) {
                    button.disabled = true;
                }
            });

            if (status) {
                status.textContent =
                    "Speech is not supported.";
            }

            return;
        }

        playButton?.addEventListener(
            "click",
            () => {
                const text =
                    getSpeechText();

                if (!text) {
                    if (status) {
                        status.textContent =
                            "No AI response available.";
                    }
                    return;
                }

                window.speechSynthesis.cancel();

                const utterance =
                    new SpeechSynthesisUtterance(
                        text
                    );

                utterance.rate = 0.95;
                utterance.pitch = 1;
                utterance.volume = 1;

                utterance.onstart =
                    () => {
                        if (status) {
                            status.textContent =
                                "Reading...";
                        }

                        playButton.classList.add(
                            "active"
                        );
                    };

                utterance.onend =
                    () => {
                        if (status) {
                            status.textContent =
                                "Ready to read";
                        }

                        playButton.classList.remove(
                            "active"
                        );
                    };

                utterance.onerror =
                    () => {
                        if (status) {
                            status.textContent =
                                "Unable to read response.";
                        }

                        playButton.classList.remove(
                            "active"
                        );
                    };

                window.speechSynthesis.speak(
                    utterance
                );
            }
        );

        pauseButton?.addEventListener(
            "click",
            () => {
                if (
                    window.speechSynthesis.speaking &&
                    !window.speechSynthesis.paused
                ) {
                    window.speechSynthesis.pause();

                    if (status) {
                        status.textContent =
                            "Paused";
                    }
                }
            }
        );

        stopButton?.addEventListener(
            "click",
            () => {
                window.speechSynthesis.cancel();

                if (status) {
                    status.textContent =
                        "Stopped";
                }

                playButton?.classList.remove(
                    "active"
                );
            }
        );

        window.addEventListener(
            "beforeunload",
            () => {
                window.speechSynthesis.cancel();
            }
        );
    }

    function getSpeechText() {
        const response =
            document.getElementById(
                "comparisonAiResponse"
            );

        if (!response) {
            return "";
        }

        return response.innerText
            .replace(/\s+/g, " ")
            .trim();
    }

    function initializeExportControls() {
        const printButton =
            document.getElementById(
                "comparisonPrintBtn"
            );

        const docButton =
            document.getElementById(
                "comparisonDocBtn"
            );

        printButton?.addEventListener(
            "click",
            printComparison
        );

        docButton?.addEventListener(
            "click",
            downloadComparisonText
        );
    }

    function printComparison() {
        if (!comparisonResults) {
            return;
        }

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1100,height=800"
            );

        if (!printWindow) {
            window.print();
            return;
        }

        const styles =
            Array.from(
                document.querySelectorAll(
                    'link[rel="stylesheet"], style'
                )
            )
                .map(
                    (element) =>
                        element.outerHTML
                )
                .join("\n");

        printWindow.document.open();

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Moto Genie - Car Comparison</title>

                ${styles}

                <style>
                    body {
                        margin: 0;
                        padding: 30px;
                        background: #ffffff !important;
                        color: #111111 !important;
                        font-family: Arial, sans-serif;
                    }

                    .comparison-results {
                        display: block !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }

                    .comparison-tabs,
                    .speech-controls,
                    .response-actions,
                    .speech-status,
                    .ai-response-footer {
                        display: none !important;
                    }

                    .comparison-tab-content {
                        display: block !important;
                    }

                    .comparison-panel,
                    .requirement-result,
                    .ai-comparison-card,
                    .car-result-card,
                    .metric-card,
                    .performance-card,
                    .fuel-card,
                    .match-card {
                        break-inside: avoid;
                    }

                    * {
                        box-shadow: none !important;
                    }
                </style>
            </head>

            <body>
                ${comparisonResults.outerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();

        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    function downloadComparisonText() {
        if (!comparisonResults) {
            return;
        }

        const car1 =
            getVehicleName(1);

        const car2 =
            getVehicleName(2);

        const aiResponse =
            getSpeechText();

        const content = `
MOTO GENIE
CAR COMPARISON
========================================

CAR 01
${car1}

CAR 02
${car2}

REQUIREMENTS
${requirementsInput?.value.trim() || "Not specified"}

========================================

AI COMPARISON
${aiResponse}

========================================
Generated by Moto Genie
        `.trim();

        const blob =
            new Blob(
                [content],
                {
                    type:
                        "text/plain;charset=utf-8"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href = url;

        link.download =
            `moto-genie-car-comparison.txt`;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );
    }

    function initializeFormValidation() {
        [
            company1Input,
            model1Input,
            company2Input,
            model2Input
        ].forEach((input) => {
            if (!input) {
                return;
            }

            input.addEventListener(
                "blur",
                () => {
                    if (
                        !input.value.trim()
                    ) {
                        showValidationError(
                            input
                        );
                    }
                }
            );
        });
    }

    function handleFormSubmit(
        event
    ) {
        if (
            !validateForm()
        ) {
            event.preventDefault();
            return;
        }

        showLoader();

        const submitButton =
            document.getElementById(
                "compareSubmit"
            );

        setSubmitState(
            submitButton,
            true
        );
    }

    function validateForm() {
        let valid = true;

        const fields = [
            company1Input,
            model1Input,
            company2Input,
            model2Input,
            requirementsInput
        ];

        fields.forEach((field) => {
            if (!field) {
                return;
            }

            if (
                !field.value.trim()
            ) {
                showValidationError(
                    field
                );

                valid = false;
            } else {
                clearValidationError(
                    field
                );
            }
        });

        if (
            company1Input &&
            company2Input &&
            model1Input &&
            model2Input
        ) {
            const sameCompany =
                normalize(
                    company1Input.value
                ) ===
                normalize(
                    company2Input.value
                );

            const sameModel =
                normalize(
                    model1Input.value
                ) ===
                normalize(
                    model2Input.value
                );

            if (
                sameCompany &&
                sameModel
            ) {
                showValidationError(
                    model2Input
                );

                showInlineError(
                    "Please select two different cars to compare."
                );

                valid = false;
            }
        }

        return valid;
    }

    function showValidationError(
        input
    ) {
        if (!input) {
            return;
        }

        input.classList.add(
            "is-invalid"
        );

        input.setAttribute(
            "aria-invalid",
            "true"
        );

        input
            .closest(
                ".comparison-field, .requirements-field"
            )
            ?.classList.add(
                "has-error"
            );
    }

    function clearValidationError(
        input
    ) {
        if (!input) {
            return;
        }

        input.classList.remove(
            "is-invalid"
        );

        input.setAttribute(
            "aria-invalid",
            "false"
        );

        input
            .closest(
                ".comparison-field, .requirements-field"
            )
            ?.classList.remove(
                "has-error"
            );
    }

    function showInlineError(
        message
    ) {
        let error =
            document.getElementById(
                "comparisonInlineError"
            );

        if (!error) {
            error =
                document.createElement(
                    "div"
                );

            error.id =
                "comparisonInlineError";

            error.className =
                "comparison-error";

            comparisonForm?.prepend(
                error
            );
        }

        error.innerHTML = `
            <i class="fas fa-circle-exclamation"></i>
            <span>${escapeHTML(message)}</span>
        `;

        error.classList.add(
            "is-visible"
        );

        setTimeout(() => {
            error.classList.remove(
                "is-visible"
            );
        }, 4000);
    }

    function setSubmitState(
        button,
        loading
    ) {
        if (!button) {
            return;
        }

        const small =
            button.querySelector(
                ".compare-submit-text small"
            );

        const strong =
            button.querySelector(
                ".compare-submit-text strong"
            );

        if (!button.dataset.defaultSmall) {
            button.dataset.defaultSmall =
                small?.textContent ||
                "RUN ANALYSIS";
        }

        if (!button.dataset.defaultStrong) {
            button.dataset.defaultStrong =
                strong?.textContent ||
                "Compare Cars";
        }

        button.disabled =
            loading;

        button.classList.toggle(
            "is-loading",
            loading
        );

        button.setAttribute(
            "aria-busy",
            String(loading)
        );

        if (loading) {
            if (small) {
                small.textContent =
                    "PLEASE WAIT";
            }

            if (strong) {
                strong.textContent =
                    "Comparing Cars...";
            }
        } else {
            if (small) {
                small.textContent =
                    button.dataset.defaultSmall;
            }

            if (strong) {
                strong.textContent =
                    button.dataset.defaultStrong;
            }
        }
    }

    function initializeInputFocus() {
        document
            .querySelectorAll(
                ".comparison-input, .requirements-input"
            )
            .forEach((input) => {
                input.addEventListener(
                    "focus",
                    () => {
                        input
                            .closest(
                                ".comparison-field, .requirements-field"
                            )
                            ?.classList.add(
                                "is-focused"
                            );
                    }
                );

                input.addEventListener(
                    "blur",
                    () => {
                        input
                            .closest(
                                ".comparison-field, .requirements-field"
                            )
                            ?.classList.remove(
                                "is-focused"
                            );
                    }
                );
            });
    }

    function initializeResultAnimations() {
        if (!comparisonResults) {
            return;
        }

        requestAnimationFrame(
            () => {
                animateBars();
            }
        );

        const cards =
            comparisonResults.querySelectorAll(
                ".metric-card, .performance-card, .fuel-card, .match-card"
            );

        cards.forEach(
            (card, index) => {
                card.style.setProperty(
                    "--comparison-delay",
                    `${Math.min(
                        index * 60,
                        360
                    )}ms`
                );
            }
        );
    }

    function animateBars() {
        initializeMetricBars();
        initializePerformanceBars();
        initializeMatchBars();
    }

    function animateBarsInside(
        container
    ) {
        if (!container) {
            return;
        }

        requestAnimationFrame(
            () => {
                container
                    .querySelectorAll(
                        ".comparison-bar span"
                    )
                    .forEach(
                        (bar) => {
                            const value =
                                bar.dataset.width;

                            if (
                                value !==
                                undefined
                            ) {
                                setBarWidth(
                                    bar,
                                    value
                                );
                            }
                        }
                    );

                container
                    .querySelectorAll(
                        ".performance-fill"
                    )
                    .forEach(
                        (bar) => {
                            const value =
                                bar.dataset.width;

                            if (
                                value !==
                                undefined
                            ) {
                                setBarWidth(
                                    bar,
                                    value
                                );
                            }
                        }
                    );
            }
        );
    }

    function setBarWidth(
        bar,
        width
    ) {
        if (!bar) {
            return;
        }

        const numeric =
            parseFloat(
                String(width)
                    .replace(
                        "%",
                        ""
                    )
                    .trim()
            );

        if (
            Number.isNaN(
                numeric
            )
        ) {
            return;
        }

        const safe =
            Math.max(
                0,
                Math.min(
                    100,
                    numeric
                )
            );

        bar.style.width =
            "0%";

        requestAnimationFrame(
            () => {
                requestAnimationFrame(
                    () => {
                        bar.style.width =
                            `${safe}%`;
                    }
                );
            }
        );
    }

    function getVehicleText(
        vehicle
    ) {
        const company =
            vehicle === 1
                ? company1Input?.value || ""
                : company2Input?.value || "";

        const model =
            vehicle === 1
                ? model1Input?.value || ""
                : model2Input?.value || "";

        return `${company} ${model}`.trim();
    }

    function getVehicleName(
        vehicle
    ) {
        return (
            getVehicleText(
                vehicle
            ) ||
            `Vehicle ${vehicle}`
        );
    }

    function extractNumbers(
        text
    ) {
        return String(text)
            .match(
                /\d+(?:\.\d+)?/g
            )
            ?.map(
                Number
            ) || [];
    }

    function parseNumber(
        value
    ) {
        if (
            value ===
            undefined ||
            value === null
        ) {
            return null;
        }

        const number =
            parseFloat(
                String(value).replace(
                    /[^0-9.-]/g,
                    ""
                )
            );

        return Number.isFinite(
            number
        )
            ? number
            : null;
    }

    function normalize(
        value
    ) {
        return String(
            value || ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /\s+/g,
                " "
            );
    }

    function escapeHTML(
        value
    ) {
        return String(
            value
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    function showLoader() {
        if (!loader) {
            return;
        }

        loader.classList.add(
            "active"
        );

        loader.setAttribute(
            "aria-hidden",
            "false"
        );

        loader.style.display =
            "flex";

        document.body.classList.add(
            "comparison-loading"
        );
    }

    function hideLoader() {
        if (!loader) {
            return;
        }

        loader.classList.remove(
            "active"
        );

        loader.setAttribute(
            "aria-hidden",
            "true"
        );

        loader.style.display =
            "none";

        document.body.classList.remove(
            "comparison-loading"
        );
    }

    window.addEventListener(
        "pageshow",
        () => {
            hideLoader();

            const submitButton =
                document.getElementById(
                    "compareSubmit"
                );

            setSubmitState(
                submitButton,
                false
            );
        }
    );

    window.addEventListener(
        "pagehide",
        () => {
            if (
                "speechSynthesis" in
                window
            ) {
                window.speechSynthesis.cancel();
            }
        }
    );
});