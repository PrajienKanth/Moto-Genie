document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    const comparisonForm = $("#carComparisonForm");
    const company1Input = $("#company1");
    const company2Input = $("#company2");
    const model1Input = $("#model1");
    const model2Input = $("#model2");
    const requirementsInput = $("#user_requirements");
    const companyModelsElement = $("#companyModelsData");
    const loader = $("#loader");
    const comparisonResults = $("#comparisonResults");
    const submitButton = $("#compareSubmit");

    let companyModels = {};
    let speechUtterance = null;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    try {
        companyModels = JSON.parse(
            companyModelsElement?.textContent || "{}"
        );
    } catch (error) {
        console.error(
            "Moto Genie: Failed to parse company model data.",
            error
        );
        companyModels = {};
    }

    initialize();

    function initialize() {
        initializeAOS();
        initializeVehicleInputs();
        initializeRequirementChips();
        initializeTabs();
        initializeMetricBars();
        initializePerformanceBars();
        initializeMatchBars();
        initializeSpeechControls();
        initializeExportControls();
        initializeValidation();
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

        comparisonForm?.addEventListener(
            "submit",
            handleFormSubmit
        );

        window.addEventListener(
            "pageshow",
            handlePageShow
        );

        window.addEventListener(
            "pagehide",
            stopSpeech
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
            disable: reducedMotion
        });

        window.addEventListener(
            "load",
            () => {
                setTimeout(() => {
                    AOS?.refreshHard();
                }, 250);
            },
            { once: true }
        );
    }

    function initializeVehicleInputs() {
        [
            {
                company: company1Input,
                model: model1Input,
                datalist: "models1",
                vehicle: 1
            },
            {
                company: company2Input,
                model: model2Input,
                datalist: "models2",
                vehicle: 2
            }
        ].forEach(
            ({
                company,
                model,
                datalist,
                vehicle
            }) => {
                if (!company || !model) {
                    return;
                }

                company.addEventListener(
                    "input",
                    () => {
                        updateModels(
                            company,
                            model,
                            datalist
                        );

                        validateModelForCompany(
                            company,
                            model
                        );

                        updateVehiclePreview(
                            vehicle
                        );

                        clearValidationError(
                            company
                        );
                    }
                );

                company.addEventListener(
                    "change",
                    () => {
                        updateModels(
                            company,
                            model,
                            datalist
                        );

                        validateModelForCompany(
                            company,
                            model
                        );

                        updateVehiclePreview(
                            vehicle
                        );
                    }
                );

                model.addEventListener(
                    "input",
                    () => {
                        updateVehiclePreview(
                            vehicle
                        );

                        clearValidationError(
                            model
                        );
                    }
                );

                model.addEventListener(
                    "change",
                    () => {
                        validateModelForCompany(
                            company,
                            model
                        );

                        updateVehiclePreview(
                            vehicle
                        );
                    }
                );
            }
        );
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

        const datalist = $(
            `#${datalistId}`
        );

        if (!datalist) {
            return;
        }

        const company =
            companyInput.value.trim();

        const previousModel =
            modelInput.value.trim();

        datalist.innerHTML = "";

        if (!company) {
            modelInput.value = "";
            return;
        }

        const companyKey =
            findCompanyKey(company);

        if (!companyKey) {
            return;
        }

        const models =
            Array.isArray(
                companyModels[companyKey]
            )
                ? companyModels[companyKey]
                : [];

        const modelNames =
            models
                .map(getModelName)
                .filter(Boolean);

        modelNames.forEach(
            (modelName) => {
                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    modelName;

                datalist.appendChild(
                    option
                );
            }
        );

        if (
            previousModel &&
            modelNames.some(
                (model) =>
                    normalize(model) ===
                    normalize(previousModel)
            )
        ) {
            modelInput.value =
                previousModel;
        } else if (
            previousModel
        ) {
            modelInput.value = "";
        }
    }

    function getModelName(model) {
        if (
            typeof model ===
            "string"
        ) {
            return model.trim();
        }

        if (
            model &&
            typeof model ===
            "object"
        ) {
            return String(
                model.name ||
                model.model ||
                model.title ||
                ""
            ).trim();
        }

        return "";
    }

    function findCompanyKey(company) {
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

    function getCompanyModels(company) {
        const key =
            findCompanyKey(company);

        if (!key) {
            return [];
        }

        return (
            companyModels[key] || []
        )
            .map(getModelName)
            .filter(Boolean);
    }

    function isValidModelForCompany(
        company,
        model
    ) {
        if (
            !company ||
            !model
        ) {
            return false;
        }

        return getCompanyModels(
            company
        ).some(
            (item) =>
                normalize(item) ===
                normalize(model)
        );
    }

    function validateModelForCompany(
        companyInput,
        modelInput
    ) {
        if (
            !companyInput ||
            !modelInput ||
            !modelInput.value.trim()
        ) {
            return true;
        }

        const valid =
            isValidModelForCompany(
                companyInput.value,
                modelInput.value
            );

        if (!valid) {
            showValidationError(
                modelInput
            );
            return false;
        }

        clearValidationError(
            modelInput
        );

        return true;
    }

    function updateVehiclePreview(
        vehicle
    ) {
        const preview = $(
            `#vehiclePreview${vehicle}`
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

        const strong = $(
            "strong",
            preview
        );

        const label = $(
            "span",
            preview
        );

        if (strong) {
            if (model) {
                strong.textContent =
                    company
                        ? `${company} ${model}`
                        : model;
            } else {
                strong.textContent =
                    "Select a car";
            }
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
                model &&
                isValidModelForCompany(
                    company,
                    model
                )
            )
        );
    }

    function initializeRequirementChips() {
        const chips =
            $$(".requirement-chip");

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

                    const requirements =
                        getRequirements();

                    const index =
                        requirements.findIndex(
                            (item) =>
                                normalize(
                                    item
                                ) ===
                                normalize(
                                    value
                                )
                        );

                    if (index >= 0) {
                        requirements.splice(
                            index,
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
                }
            );
        });

        syncRequirementChips();

        requirementsInput?.addEventListener(
            "input",
            syncRequirementChips
        );
    }

    function getRequirements() {
        if (!requirementsInput) {
            return [];
        }

        return requirementsInput.value
            .split(",")
            .map((item) =>
                item.trim()
            )
            .filter(Boolean);
    }

    function syncRequirementChips() {
        if (!requirementsInput) {
            return;
        }

        const requirements =
            getRequirements().map(
                normalize
            );

        $$(".requirement-chip").forEach(
            (chip) => {
                const value =
                    normalize(
                        chip.dataset
                            .requirement ||
                        chip.textContent
                    );

                chip.classList.toggle(
                    "active",
                    requirements.includes(
                        value
                    )
                );
            }
        );
    }

    function initializeTabs() {
        const tabs =
            $$(".comparison-tab");

        const contents =
            $$(".comparison-tab-content");

        if (!tabs.length) {
            return;
        }

        tabs.forEach((tab) => {
            tab.addEventListener(
                "click",
                () => {
                    activateTab(
                        tab,
                        tabs,
                        contents
                    );
                }
            );
        });

        const activeTab =
            $(".comparison-tab.active") ||
            tabs[0];

        if (activeTab) {
            activateTab(
                activeTab,
                tabs,
                contents,
                false
            );
        }
    }

    function activateTab(
        activeTab,
        tabs,
        contents,
        animate = true
    ) {
        const target =
            activeTab.dataset.tab;

        if (!target) {
            return;
        }

        tabs.forEach((tab) => {
            const active =
                tab === activeTab;

            tab.classList.toggle(
                "active",
                active
            );

            tab.setAttribute(
                "aria-selected",
                String(active)
            );

            tab.setAttribute(
                "tabindex",
                active ? "0" : "-1"
            );
        });

        contents.forEach(
            (content) => {
                const active =
                    content.id === target;

                content.classList.toggle(
                    "active",
                    active
                );

                content.hidden =
                    !active;
            }
        );

        const content =
            document.getElementById(
                target
            );

        if (
            content &&
            animate
        ) {
            animateBarsInside(
                content
            );
        }
    }

    function initializeMetricBars() {
        const cards =
            $$(".metric-card[data-value1][data-value2]");

        cards.forEach((card) => {
            const value1 =
                parseNumber(
                    card.dataset.value1
                );

            const value2 =
                parseNumber(
                    card.dataset.value2
                );

            if (
                value1 === null ||
                value2 === null
            ) {
                return;
            }

            const bars =
                $$(".comparison-bar span", card);

            if (bars.length < 2) {
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
        $$(".performance-card").forEach(
            (card) => {
                const fill =
                    $(".performance-fill", card);

                if (!fill) {
                    return;
                }

                let value =
                    parseNumber(
                        fill.dataset.value
                    );

                if (
                    value === null
                ) {
                    value =
                        parseNumber(
                            fill.getAttribute(
                                "data-width"
                            )
                        );
                }

                if (
                    value === null
                ) {
                    return;
                }

                setBarWidth(
                    fill,
                    value
                );
            }
        );
    }

    function initializeMatchBars() {
        const barOne =
            $("#matchBarOne");

        const barTwo =
            $("#matchBarTwo");

        if (!barOne && !barTwo) {
            return;
        }

        const valueOne =
            parseNumber(
                barOne?.dataset.value
            );

        const valueTwo =
            parseNumber(
                barTwo?.dataset.value
            );

        if (
            valueOne !== null ||
            valueTwo !== null
        ) {
            setBarWidth(
                barOne,
                valueOne ?? 50
            );

            setBarWidth(
                barTwo,
                valueTwo ?? 50
            );

            return;
        }

        calculateRequirementMatch(
            barOne,
            barTwo
        );
    }

    function calculateRequirementMatch(
        barOne,
        barTwo
    ) {
        if (
            !barOne &&
            !barTwo
        ) {
            return;
        }

        const requirements =
            getRequirements();

        if (!requirements.length) {
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

        const textOne =
            getVehicleDataText(1);

        const textTwo =
            getVehicleDataText(2);

        let scoreOne = 0;
        let scoreTwo = 0;

        requirements.forEach(
            (requirement) => {
                const words =
                    normalize(
                        requirement
                    )
                        .split(
                            /\s+/
                        )
                        .filter(
                            (word) =>
                                word.length >
                                2
                        );

                if (
                    words.some(
                        (word) =>
                            textOne.includes(
                                word
                            )
                    )
                ) {
                    scoreOne++;
                }

                if (
                    words.some(
                        (word) =>
                            textTwo.includes(
                                word
                            )
                    )
                ) {
                    scoreTwo++;
                }
            }
        );

        if (
            scoreOne === 0 &&
            scoreTwo === 0
        ) {
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

        const total =
            scoreOne +
            scoreTwo;

        setBarWidth(
            barOne,
            (scoreOne / total) * 100
        );

        setBarWidth(
            barTwo,
            (scoreTwo / total) * 100
        );
    }

    function getVehicleDataText(
        vehicle
    ) {
        const company =
            vehicle === 1
                ? company1Input?.value
                : company2Input?.value;

        const model =
            vehicle === 1
                ? model1Input?.value
                : model2Input?.value;

        return normalize(
            `${company || ""} ${model || ""}`
        );
    }

    function initializeSpeechControls() {
        const playButton =
            $("#comparisonSpeechPlay");

        const pauseButton =
            $("#comparisonSpeechPause");

        const stopButton =
            $("#comparisonSpeechStop");

        const status =
            $("#comparisonSpeechStatus");

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
            speakComparison
        );

        pauseButton?.addEventListener(
            "click",
            pauseSpeech
        );

        stopButton?.addEventListener(
            "click",
            stopSpeech
        );
    }

    function speakComparison() {
        const text =
            getSpeechText();

        const status =
            $("#comparisonSpeechStatus");

        const playButton =
            $("#comparisonSpeechPlay");

        if (!text) {
            if (status) {
                status.textContent =
                    "No AI response available.";
            }

            return;
        }

        if (
            window.speechSynthesis.paused &&
            speechUtterance
        ) {
            window.speechSynthesis.resume();

            if (status) {
                status.textContent =
                    "Reading...";
            }

            return;
        }

        stopSpeech();

        speechUtterance =
            new SpeechSynthesisUtterance(
                text
            );

        speechUtterance.rate = 0.95;
        speechUtterance.pitch = 1;
        speechUtterance.volume = 1;

        const voices =
            window.speechSynthesis.getVoices();

        const preferredVoice =
            voices.find(
                (voice) =>
                    /^en/i.test(
                        voice.lang
                    ) &&
                    /natural|neural|premium|google|microsoft/i.test(
                        voice.name
                    )
            ) ||
            voices.find(
                (voice) =>
                    /^en/i.test(
                        voice.lang
                    )
            );

        if (preferredVoice) {
            speechUtterance.voice =
                preferredVoice;
        }

        speechUtterance.onstart =
            () => {
                if (status) {
                    status.textContent =
                        "Reading...";
                }

                playButton?.classList.add(
                    "active"
                );
            };

        speechUtterance.onpause =
            () => {
                if (status) {
                    status.textContent =
                        "Paused";
                }
            };

        speechUtterance.onresume =
            () => {
                if (status) {
                    status.textContent =
                        "Reading...";
                }
            };

        speechUtterance.onend =
            () => {
                speechUtterance = null;

                if (status) {
                    status.textContent =
                        "Ready to read";
                }

                playButton?.classList.remove(
                    "active"
                );
            };

        speechUtterance.onerror =
            () => {
                speechUtterance = null;

                if (status) {
                    status.textContent =
                        "Unable to read response.";
                }

                playButton?.classList.remove(
                    "active"
                );
            };

        window.speechSynthesis.speak(
            speechUtterance
        );
    }

    function pauseSpeech() {
        const status =
            $("#comparisonSpeechStatus");

        if (
            !window.speechSynthesis
                .speaking
        ) {
            return;
        }

        if (
            window.speechSynthesis.paused
        ) {
            window.speechSynthesis.resume();

            if (status) {
                status.textContent =
                    "Reading...";
            }
        } else {
            window.speechSynthesis.pause();

            if (status) {
                status.textContent =
                    "Paused";
            }
        }
    }

    function stopSpeech() {
        if (
            "speechSynthesis" in
            window
        ) {
            window.speechSynthesis.cancel();
        }

        speechUtterance = null;

        $("#comparisonSpeechPlay")
            ?.classList.remove(
                "active"
            );
    }

    function getSpeechText() {
        const response =
            $("#comparisonAiResponse");

        if (!response) {
            return "";
        }

        return response.innerText
            .replace(/\s+/g, " ")
            .trim();
    }

    function initializeExportControls() {
        $("#comparisonPrintBtn")
            ?.addEventListener(
                "click",
                printComparison
            );

        $("#comparisonDocBtn")
            ?.addEventListener(
                "click",
                downloadComparisonDocument
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
                "width=1200,height=850"
            );

        if (!printWindow) {
            window.print();
            return;
        }

        const styles =
            $$(
                'link[rel="stylesheet"], style'
            )
                .map(
                    (element) =>
                        element.outerHTML
                )
                .join("\n");

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Moto Genie - Car Comparison</title>

                ${styles}

                <style>
                    body {
                        margin: 0;
                        padding: 30px;
                        background: #fff !important;
                        color: #111 !important;
                        font-family: Arial, sans-serif;
                    }

                    .comparison-results {
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }

                    .comparison-tab-content {
                        display: block !important;
                        visibility: visible !important;
                    }

                    .comparison-tabs,
                    .speech-controls,
                    .response-actions,
                    .ai-response-footer,
                    .comparisonPrintBtn,
                    .comparisonDocBtn {
                        display: none !important;
                    }

                    .comparison-panel,
                    .car-result-card,
                    .metric-card,
                    .performance-card,
                    .requirement-result,
                    .ai-comparison-card {
                        break-inside: avoid;
                    }

                    * {
                        box-shadow: none !important;
                        animation: none !important;
                    }

                    @media print {
                        body {
                            padding: 15px;
                        }
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

    function downloadComparisonDocument() {
        if (!comparisonResults) {
            return;
        }

        const carOne =
            getVehicleName(1);

        const carTwo =
            getVehicleName(2);

        const requirements =
            requirementsInput?.value.trim() ||
            "Not specified";

        const aiResponse =
            getSpeechText() ||
            "No AI comparison response available.";

        const content = [
            "MOTO GENIE",
            "CAR COMPARISON REPORT",
            "",
            "========================================",
            "",
            "CAR 01",
            carOne,
            "",
            "CAR 02",
            carTwo,
            "",
            "REQUIREMENTS",
            requirements,
            "",
            "========================================",
            "",
            "AI COMPARISON",
            aiResponse,
            "",
            "========================================",
            "",
            "Generated by Moto Genie"
        ].join("\n");

        const blob =
            new Blob(
                [content],
                {
                    type:
                        "application/msword;charset=utf-8"
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
            "moto-genie-car-comparison.doc";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        setTimeout(
            () =>
                URL.revokeObjectURL(
                    url
                ),
            100
        );
    }

    function initializeValidation() {
        [
            company1Input,
            model1Input,
            company2Input,
            model2Input,
            requirementsInput
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

    function handleFormSubmit(event) {
        if (!validateForm()) {
            event.preventDefault();
            return;
        }

        showLoader();

        setSubmitState(
            submitButton,
            true
        );
    }

    function validateForm() {
        let valid = true;

        const requiredFields = [
            company1Input,
            model1Input,
            company2Input,
            model2Input,
            requirementsInput
        ];

        requiredFields.forEach(
            (field) => {
                if (!field) {
                    return;
                }

                if (!field.value.trim()) {
                    showValidationError(
                        field
                    );

                    valid = false;
                } else {
                    clearValidationError(
                        field
                    );
                }
            }
        );

        if (
            company1Input &&
            model1Input &&
            !isValidModelForCompany(
                company1Input.value,
                model1Input.value
            )
        ) {
            showValidationError(
                model1Input
            );

            showInlineError(
                "Please select a valid first car model."
            );

            valid = false;
        }

        if (
            company2Input &&
            model2Input &&
            !isValidModelForCompany(
                company2Input.value,
                model2Input.value
            )
        ) {
            showValidationError(
                model2Input
            );

            showInlineError(
                "Please select a valid second car model."
            );

            valid = false;
        }

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

    function showValidationError(input) {
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

    function clearValidationError(input) {
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

    function showInlineError(message) {
        let error =
            $("#comparisonInlineError");

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
            <span>${escapeHTML(
                message
            )}</span>
        `;

        error.classList.add(
            "is-visible"
        );

        clearTimeout(
            error._hideTimer
        );

        error._hideTimer =
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
            $(".compare-submit-text small", button);

        const strong =
            $(".compare-submit-text strong", button);

        if (
            !button.dataset.defaultSmall
        ) {
            button.dataset.defaultSmall =
                small?.textContent ||
                "RUN ANALYSIS";
        }

        if (
            !button.dataset.defaultStrong
        ) {
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
        $$(".comparison-input, .requirements-input")
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

        const cards =
            $$(".metric-card, .performance-card, .fuel-card, .match-card", comparisonResults);

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

        if (reducedMotion) {
            return;
        }

        requestAnimationFrame(
            () => {
                initializeMetricBars();
                initializePerformanceBars();
                initializeMatchBars();
            }
        );
    }

    function animateBarsInside(container) {
        if (!container) {
            return;
        }

        requestAnimationFrame(() => {
            initializeMetricBarsInside(
                container
            );

            $$(".performance-fill", container)
                .forEach((bar) => {
                    const value =
                        parseNumber(
                            bar.dataset.value ??
                            bar.dataset.width
                        );

                    if (
                        value !== null
                    ) {
                        setBarWidth(
                            bar,
                            value
                        );
                    }
                });
        });
    }

    function initializeMetricBarsInside(
        container
    ) {
        $$(".metric-card[data-value1][data-value2]", container)
            .forEach((card) => {
                const value1 =
                    parseNumber(
                        card.dataset.value1
                    );

                const value2 =
                    parseNumber(
                        card.dataset.value2
                    );

                if (
                    value1 === null ||
                    value2 === null
                ) {
                    return;
                }

                const bars =
                    $$(".comparison-bar span", card);

                if (bars.length < 2) {
                    return;
                }

                const max =
                    Math.max(
                        value1,
                        value2,
                        1
                    );

                setBarWidth(
                    bars[0],
                    (value1 / max) * 100
                );

                setBarWidth(
                    bars[1],
                    (value2 / max) * 100
                );
            });
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
            !Number.isFinite(
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

        bar.dataset.width =
            String(safe);

        if (reducedMotion) {
            bar.style.width =
                `${safe}%`;

            return;
        }

        bar.style.width =
            "0%";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                bar.style.width =
                    `${safe}%`;
            });
        });
    }

    function getVehicleName(vehicle) {
        const company =
            vehicle === 1
                ? company1Input?.value.trim()
                : company2Input?.value.trim();

        const model =
            vehicle === 1
                ? model1Input?.value.trim()
                : model2Input?.value.trim();

        return [
            company,
            model
        ]
            .filter(Boolean)
            .join(" ");
    }

    function parseNumber(value) {
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return null;
        }

        const match =
            String(value).match(
                /-?\d+(?:\.\d+)?/
            );

        if (!match) {
            return null;
        }

        const number =
            Number(match[0]);

        return Number.isFinite(
            number
        )
            ? number
            : null;
    }

    function normalize(value) {
        return String(
            value || ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /[\s_-]+/g,
                " "
            );
    }

    function escapeHTML(value) {
        return String(value)
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

    function handlePageShow() {
        hideLoader();

        setSubmitState(
            submitButton,
            false
        );

        updateVehiclePreview(1);
        updateVehiclePreview(2);

        if (comparisonResults) {
            initializeMetricBars();
            initializePerformanceBars();
            initializeMatchBars();
        }
    }
});