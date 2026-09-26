document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const form = document.getElementById("carSpecForm");
    const companyInput = document.getElementById("company");
    const modelInput = document.getElementById("model");
    const modelList = document.getElementById("models");
    const queryInput = document.getElementById("user_query");

    const voiceButton = document.getElementById("voice-input-button");
    const voiceStatus = document.getElementById("voice-input-status");

    const responseText = document.getElementById("ai-response-text");
    const speechToggle = document.getElementById("speech-toggle");
    const speechRestart = document.getElementById("speech-restart");
    const speechStatus = document.getElementById("speech-status");
    const speechProgress = document.getElementById("speech-progress-bar");

    const copyButton = document.getElementById("copy-response");
    const loader = document.getElementById("loader");

    const companyModels =
        window.carCompanyModels &&
            typeof window.carCompanyModels === "object"
            ? window.carCompanyModels
            : {};

    let recognition = null;
    let isListening = false;
    let manuallyStoppedRecognition = false;

    const recognitionSupported =
        "SpeechRecognition" in window ||
        "webkitSpeechRecognition" in window;

    const speechSupported =
        "speechSynthesis" in window &&
        "SpeechSynthesisUtterance" in window;

    let speechState = "idle";
    let speechWords = [];
    let speechWordIndex = -1;
    let currentUtterance = null;
    let speechRunId = 0;
    let availableVoices = [];

    init();

    function init() {
        initializeModelList();
        initializeVoiceRecognition();
        initializeSpeech();
        initializeResponse();
        initializeCopyButton();
        initializeForm();
        initializeLoader();
        initializeAOS();

        window.addEventListener("beforeunload", cleanup);
    }

    function normalize(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
    }

    function initializeModelList() {
        if (!companyInput || !modelInput || !modelList) {
            return;
        }

        populateModels(companyInput.value);

        companyInput.addEventListener("input", () => {
            populateModels(companyInput.value);

            const currentModel = modelInput.value.trim();

            if (
                currentModel &&
                !getModelsForCompany(companyInput.value).some(
                    model =>
                        normalize(model) ===
                        normalize(currentModel)
                )
            ) {
                modelInput.value = "";
            }
        });

        companyInput.addEventListener("change", () => {
            populateModels(companyInput.value);
        });

        modelInput.addEventListener("focus", () => {
            populateModels(companyInput.value);
        });
    }

    function findCompanyKey(company) {
        const normalized = normalize(company);

        if (!normalized) {
            return null;
        }

        return (
            Object.keys(companyModels).find(
                key => normalize(key) === normalized
            ) || null
        );
    }

    function getModelsForCompany(company) {
        const key = findCompanyKey(company);

        if (!key || !Array.isArray(companyModels[key])) {
            return [];
        }

        return companyModels[key]
            .filter(Boolean)
            .map(String)
            .sort((a, b) =>
                a.localeCompare(b, undefined, {
                    sensitivity: "base"
                })
            );
    }

    function populateModels(company) {
        if (!modelList) {
            return;
        }

        modelList.innerHTML = "";

        getModelsForCompany(company).forEach(model => {
            const option = document.createElement("option");
            option.value = model;
            modelList.appendChild(option);
        });
    }

    function initializeVoiceRecognition() {
        if (!voiceButton || !queryInput) {
            return;
        }

        if (!recognitionSupported) {
            voiceButton.disabled = true;
            voiceButton.classList.add("unsupported");

            updateVoiceStatus(
                "Voice recognition is not supported in this browser.",
                false
            );

            return;
        }

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        try {
            recognition = new SpeechRecognition();
        } catch (error) {
            console.error(
                "Unable to create speech recognition:",
                error
            );

            voiceButton.disabled = true;

            updateVoiceStatus(
                "Voice recognition could not be initialized.",
                false
            );

            return;
        }

        recognition.lang = "en-IN";
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        voiceButton.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();

            if (isListening) {
                stopVoiceRecognition();
            } else {
                startVoiceRecognition();
            }
        });

        recognition.onstart = () => {
            isListening = true;
            manuallyStoppedRecognition = false;

            voiceButton.classList.add("is-listening");

            const icon = voiceButton.querySelector("i");

            if (icon) {
                icon.className = "fas fa-stop";
            }

            voiceButton.setAttribute(
                "aria-label",
                "Stop voice recognition"
            );

            voiceButton.setAttribute(
                "title",
                "Stop voice recognition"
            );

            updateVoiceStatus(
                "Listening... speak your question.",
                true
            );
        };

        recognition.onresult = event => {
            let finalTranscript = "";
            let interimTranscript = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                const result = event.results[i];

                if (!result || !result[0]) {
                    continue;
                }

                const transcript =
                    result[0].transcript || "";

                if (result.isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript.trim()) {
                appendVoiceText(finalTranscript);
            }

            if (interimTranscript.trim()) {
                updateVoiceStatus(
                    `Listening: ${interimTranscript.trim()}`,
                    true
                );
            }
        };

        recognition.onerror = event => {
            console.error(
                "Speech recognition error:",
                event.error
            );

            isListening = false;

            resetVoiceButton();

            let message =
                "Voice recognition could not be completed.";

            switch (event.error) {
                case "not-allowed":
                case "service-not-allowed":
                    message =
                        "Microphone permission was denied. Allow microphone access and try again.";
                    break;

                case "audio-capture":
                    message =
                        "No microphone was detected.";
                    break;

                case "no-speech":
                    message =
                        "No speech detected. Please try again.";
                    break;

                case "network":
                    message =
                        "Voice recognition requires a network connection.";
                    break;

                case "aborted":
                    message =
                        "Voice input stopped.";
                    break;
            }

            updateVoiceStatus(message, false);
        };

        recognition.onend = () => {
            isListening = false;

            resetVoiceButton();

            if (manuallyStoppedRecognition) {
                updateVoiceStatus(
                    "Voice input stopped.",
                    false
                );
            } else {
                updateVoiceStatus(
                    "Voice input complete.",
                    false
                );
            }

            manuallyStoppedRecognition = false;
        };
    }

    function startVoiceRecognition() {
        if (!recognition || isListening) {
            return;
        }

        stopSpeech();

        manuallyStoppedRecognition = false;

        try {
            recognition.start();
        } catch (error) {
            if (error.name === "InvalidStateError") {
                return;
            }

            console.error(
                "Unable to start voice recognition:",
                error
            );

            updateVoiceStatus(
                "Voice input could not be started.",
                false
            );
        }
    }

    function stopVoiceRecognition() {
        if (!recognition || !isListening) {
            return;
        }

        manuallyStoppedRecognition = true;

        try {
            recognition.stop();
        } catch (error) {
            console.warn(
                "Unable to stop voice recognition:",
                error
            );

            isListening = false;
            resetVoiceButton();
        }
    }

    function resetVoiceButton() {
        if (!voiceButton) {
            return;
        }

        voiceButton.classList.remove("is-listening");

        voiceButton.setAttribute(
            "aria-label",
            "Start voice input"
        );

        voiceButton.setAttribute(
            "title",
            "Voice input"
        );

        const icon = voiceButton.querySelector("i");

        if (icon) {
            icon.className = "fas fa-microphone";
        }
    }

    function appendVoiceText(text) {
        if (!queryInput) {
            return;
        }

        const cleanText = String(text || "")
            .replace(/\s+/g, " ")
            .trim();

        if (!cleanText) {
            return;
        }

        const existingText =
            queryInput.value.trim();

        queryInput.value = existingText
            ? `${existingText} ${cleanText}`
            : cleanText;

        queryInput.dispatchEvent(
            new Event("input", {
                bubbles: true
            })
        );

        queryInput.focus();

        try {
            const length = queryInput.value.length;

            queryInput.setSelectionRange(
                length,
                length
            );
        } catch (error) {
            // Selection API may not be available.
        }
    }

    function updateVoiceStatus(message, listening) {
        if (!voiceStatus) {
            return;
        }

        voiceStatus.classList.toggle(
            "listening",
            Boolean(listening)
        );

        const icon = voiceStatus.querySelector("i");
        const text = voiceStatus.querySelector("span");

        if (text) {
            text.textContent = message;
        } else {
            voiceStatus.textContent = message;
        }

        if (icon) {
            icon.className = listening
                ? "fas fa-microphone"
                : "fas fa-microphone-lines";
        }
    }

    function initializeSpeech() {
        if (!speechSupported) {
            disableSpeechControls(
                "Speech synthesis is not supported in this browser."
            );

            return;
        }

        loadVoices();

        if (
            typeof window.speechSynthesis.addEventListener ===
            "function"
        ) {
            window.speechSynthesis.addEventListener(
                "voiceschanged",
                loadVoices
            );
        }

        if (speechToggle) {
            speechToggle.addEventListener(
                "click",
                toggleSpeech
            );
        }

        if (speechRestart) {
            speechRestart.addEventListener(
                "click",
                restartSpeech
            );
        }

        updateSpeechControls();
    }

    function loadVoices() {
        if (!speechSupported) {
            return;
        }

        availableVoices =
            window.speechSynthesis.getVoices() || [];
    }

    function initializeResponse() {
        if (!responseText) {
            return;
        }

        const text =
            responseText.textContent
                .replace(/\s+/g, " ")
                .trim();

        if (!text) {
            responseText.innerHTML = `
                <div class="ai-response-empty">
                    <div>
                        <i class="fas fa-sparkles"></i>
                        <div>
                            Ask Moto Genie about a car
                            to generate an AI response.
                        </div>
                    </div>
                </div>
            `;

            if (speechToggle) {
                speechToggle.disabled = true;
            }

            if (speechRestart) {
                speechRestart.disabled = true;
            }

            return;
        }

        tokenizeResponse(text);
    }

    function tokenizeResponse(text) {
        if (!responseText) {
            return;
        }

        responseText.innerHTML = "";

        const fragment =
            document.createDocumentFragment();

        const tokens =
            text.match(/\s+|[^\s]+/g) || [];

        let wordIndex = 0;

        tokens.forEach(token => {
            if (/^\s+$/.test(token)) {
                fragment.appendChild(
                    document.createTextNode(token)
                );

                return;
            }

            const word =
                document.createElement("span");

            word.className = "speech-word";
            word.dataset.wordIndex =
                String(wordIndex);

            word.textContent = token;

            fragment.appendChild(word);

            wordIndex++;
        });

        responseText.appendChild(fragment);

        speechWords = Array.from(
            responseText.querySelectorAll(
                ".speech-word"
            )
        );
    }

    function toggleSpeech() {
        if (!speechSupported || !responseText) {
            return;
        }

        if (speechState === "speaking") {
            pauseSpeech();
            return;
        }

        if (speechState === "paused") {
            resumeSpeech();
            return;
        }

        speakFromBeginning();
    }

    function speakFromBeginning() {
        if (!speechSupported) {
            return;
        }

        const text = getResponsePlainText();

        if (!text) {
            return;
        }

        cancelSpeechOnly();

        clearWordHighlight();

        speechRunId++;

        const runId = speechRunId;

        const utterance =
            createUtterance(text);

        if (!utterance) {
            return;
        }

        currentUtterance = utterance;
        speechState = "speaking";

        setResponseSpeakingState(true);
        updateSpeechControls();
        updateSpeechStatus(
            "Reading response..."
        );

        updateSpeechProgress(0);

        window.speechSynthesis.speak(
            utterance
        );

        startSpeechFallbackTracking(
            text,
            runId
        );
    }

    function restartSpeech() {
        if (!speechSupported) {
            return;
        }

        speakFromBeginning();
    }

    function pauseSpeech() {
        if (
            !speechSupported ||
            !window.speechSynthesis.speaking
        ) {
            return;
        }

        window.speechSynthesis.pause();

        speechState = "paused";

        updateSpeechControls();
        updateSpeechStatus("Speech paused.");
    }

    function resumeSpeech() {
        if (
            !speechSupported ||
            !window.speechSynthesis.paused
        ) {
            return;
        }

        window.speechSynthesis.resume();

        speechState = "speaking";

        updateSpeechControls();
        updateSpeechStatus(
            "Reading response..."
        );
    }

    function stopSpeech() {
        if (!speechSupported) {
            return;
        }

        speechRunId++;

        cancelSpeechOnly();

        speechState = "idle";
        speechWordIndex = -1;
        currentUtterance = null;

        clearWordHighlight();
        setResponseSpeakingState(false);
        updateSpeechProgress(0);
        updateSpeechControls();
        updateSpeechStatus("Speech ready.");
    }

    function cancelSpeechOnly() {
        if (
            speechSupported &&
            (
                window.speechSynthesis.speaking ||
                window.speechSynthesis.pending ||
                window.speechSynthesis.paused
            )
        ) {
            window.speechSynthesis.cancel();
        }
    }

    function createUtterance(text) {
        const utterance =
            new SpeechSynthesisUtterance(text);

        utterance.lang = "en-IN";
        utterance.rate = 0.96;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voice = selectBestVoice();

        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang || "en-IN";
        }

        utterance.onstart = () => {
            speechState = "speaking";

            setResponseSpeakingState(true);
            updateSpeechControls();
            updateSpeechStatus(
                "Reading response..."
            );
        };

        utterance.onboundary = event => {
            if (
                event &&
                typeof event.charIndex === "number"
            ) {
                updateSpeechWordFromCharacter(
                    text,
                    event.charIndex
                );
            }
        };

        utterance.onpause = () => {
            speechState = "paused";

            updateSpeechControls();
            updateSpeechStatus(
                "Speech paused."
            );
        };

        utterance.onresume = () => {
            speechState = "speaking";

            updateSpeechControls();
            updateSpeechStatus(
                "Reading response..."
            );
        };

        utterance.onerror = event => {
            if (
                event &&
                (
                    event.error === "canceled" ||
                    event.error === "interrupted"
                )
            ) {
                return;
            }

            speechState = "idle";
            currentUtterance = null;

            setResponseSpeakingState(false);
            updateSpeechControls();

            updateSpeechStatus(
                "Speech could not be completed."
            );
        };

        utterance.onend = () => {
            if (currentUtterance !== utterance) {
                return;
            }

            speechState = "idle";
            speechWordIndex = -1;
            currentUtterance = null;

            clearWordHighlight();
            setResponseSpeakingState(false);
            updateSpeechProgress(100);
            updateSpeechControls();

            updateSpeechStatus(
                "Finished reading response."
            );

            window.setTimeout(() => {
                if (speechState === "idle") {
                    updateSpeechProgress(0);
                }
            }, 900);
        };

        return utterance;
    }

    function selectBestVoice() {
        if (!availableVoices.length) {
            return null;
        }

        const preferredLanguages = [
            "en-IN",
            "en-US",
            "en-GB",
            "en-AU"
        ];

        for (const language of preferredLanguages) {
            const voice =
                availableVoices.find(
                    item =>
                        item.lang &&
                        item.lang.toLowerCase() ===
                        language.toLowerCase()
                );

            if (voice) {
                return voice;
            }
        }

        const englishVoice =
            availableVoices.find(
                item =>
                    item.lang &&
                    item.lang
                        .toLowerCase()
                        .startsWith("en")
            );

        return englishVoice ||
            availableVoices[0];
    }

    function getResponsePlainText() {
        if (!responseText) {
            return "";
        }

        return responseText.textContent
            .replace(/\s+/g, " ")
            .trim();
    }

    function updateSpeechWordFromCharacter(
        fullText,
        charIndex
    ) {
        if (!speechWords.length) {
            return;
        }

        const safeIndex =
            Math.max(
                0,
                Math.min(
                    charIndex,
                    fullText.length
                )
            );

        const beforeText =
            fullText.slice(0, safeIndex);

        const wordIndex =
            countWords(beforeText) - 1;

        if (
            wordIndex < 0 ||
            wordIndex >= speechWords.length
        ) {
            return;
        }

        highlightWord(wordIndex);

        const percentage =
            speechWords.length <= 1
                ? 100
                : (
                    wordIndex /
                    (speechWords.length - 1)
                ) * 100;

        updateSpeechProgress(
            percentage
        );
    }

    function countWords(text) {
        const matches =
            text.match(/\S+/g);

        return matches
            ? matches.length
            : 0;
    }

    function highlightWord(index) {
        if (
            index === speechWordIndex ||
            !speechWords[index]
        ) {
            return;
        }

        if (speechWordIndex >= 0) {
            const previous =
                speechWords[speechWordIndex];

            if (previous) {
                previous.classList.remove(
                    "current"
                );
            }
        }

        speechWordIndex = index;

        const word =
            speechWords[index];

        word.classList.add("current");

        scrollWordIntoView(word);
    }

    function scrollWordIntoView(word) {
        if (!responseText || !word) {
            return;
        }

        const containerRect =
            responseText.getBoundingClientRect();

        const wordRect =
            word.getBoundingClientRect();

        const upperZone =
            containerRect.top +
            containerRect.height * 0.25;

        const lowerZone =
            containerRect.top +
            containerRect.height * 0.75;

        if (
            wordRect.top < upperZone ||
            wordRect.bottom > lowerZone
        ) {
            const target =
                responseText.scrollTop +
                (
                    wordRect.top -
                    containerRect.top
                ) -
                responseText.clientHeight * 0.38;

            responseText.scrollTo({
                top: Math.max(0, target),
                behavior: "smooth"
            });
        }
    }

    function clearWordHighlight() {
        speechWords.forEach(word => {
            word.classList.remove("current");
        });

        speechWordIndex = -1;
    }

    function setResponseSpeakingState(active) {
        if (!responseText) {
            return;
        }

        responseText.classList.toggle(
            "is-speaking",
            Boolean(active)
        );
    }

    function startSpeechFallbackTracking(
        text,
        runId
    ) {
        const startedAt =
            performance.now();

        const wordCount =
            text.split(/\s+/).filter(Boolean).length;

        const estimatedDuration =
            Math.max(
                2500,
                (wordCount / 2.5) * 1000
            );

        const tick = now => {
            if (
                runId !== speechRunId ||
                speechState === "idle"
            ) {
                return;
            }

            if (speechState === "paused") {
                requestAnimationFrame(tick);
                return;
            }

            const elapsed =
                now - startedAt;

            const progress =
                Math.min(
                    96,
                    (elapsed / estimatedDuration) * 100
                );

            updateSpeechProgress(progress);

            requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    }

    function updateSpeechControls() {
        if (speechToggle) {
            const icon =
                speechToggle.querySelector("i");

            speechToggle.classList.remove("active");

            if (speechState === "speaking") {
                if (icon) {
                    icon.className = "fas fa-pause";
                }

                speechToggle.setAttribute(
                    "aria-label",
                    "Pause speech"
                );

                speechToggle.setAttribute(
                    "title",
                    "Pause speech"
                );

                speechToggle.classList.add("active");
            } else if (speechState === "paused") {
                if (icon) {
                    icon.className = "fas fa-play";
                }

                speechToggle.setAttribute(
                    "aria-label",
                    "Resume speech"
                );

                speechToggle.setAttribute(
                    "title",
                    "Resume speech"
                );

                speechToggle.classList.add("active");
            } else {
                if (icon) {
                    icon.className = "fas fa-play";
                }

                speechToggle.setAttribute(
                    "aria-label",
                    "Play response"
                );

                speechToggle.setAttribute(
                    "title",
                    "Play response"
                );
            }
        }

        if (speechRestart) {
            speechRestart.disabled =
                !speechSupported;
        }
    }

    function updateSpeechStatus(message) {
        if (!speechStatus) {
            return;
        }

        speechStatus.classList.toggle(
            "speaking",
            speechState === "speaking"
        );

        const icon =
            speechStatus.querySelector("i");

        const text =
            speechStatus.querySelector("span");

        if (text) {
            text.textContent = message;
        } else {
            speechStatus.textContent = message;
        }

        if (icon) {
            icon.className =
                speechState === "speaking"
                    ? "fas fa-volume-high"
                    : "fas fa-wave-square";
        }
    }

    function updateSpeechProgress(value) {
        if (!speechProgress) {
            return;
        }

        const progress =
            Math.max(
                0,
                Math.min(100, Number(value) || 0)
            );

        speechProgress.style.width =
            `${progress}%`;
    }

    function disableSpeechControls(message) {
        if (speechToggle) {
            speechToggle.disabled = true;
        }

        if (speechRestart) {
            speechRestart.disabled = true;
        }

        updateSpeechStatus(message);
    }

    function initializeCopyButton() {
        if (!copyButton) {
            return;
        }

        copyButton.addEventListener(
            "click",
            copyResponse
        );
    }

    async function copyResponse() {
        const text = getResponsePlainText();

        if (!text) {
            return;
        }

        try {
            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {
                await navigator.clipboard.writeText(
                    text
                );
            } else {
                fallbackCopy(text);
            }

            showActionFeedback(
                copyButton,
                "Copied"
            );
        } catch (error) {
            fallbackCopy(text);

            showActionFeedback(
                copyButton,
                "Copied"
            );
        }
    }

    function fallbackCopy(text) {
        const textarea =
            document.createElement("textarea");

        textarea.value = text;
        textarea.setAttribute(
            "readonly",
            ""
        );

        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        try {
            document.execCommand("copy");
        } catch (error) {
            console.warn(
                "Copy failed:",
                error
            );
        }

        textarea.remove();
    }

    function showActionFeedback(
        button,
        message
    ) {
        if (!button) {
            return;
        }

        const textElement =
            button.querySelector("span");

        const icon =
            button.querySelector("i");

        const originalText =
            textElement
                ? textElement.textContent
                : "";

        const originalIcon =
            icon
                ? icon.className
                : "";

        if (icon) {
            icon.className = "fas fa-check";
        }

        if (textElement) {
            textElement.textContent = message;
        }

        window.setTimeout(() => {
            if (icon) {
                icon.className = originalIcon;
            }

            if (textElement) {
                textElement.textContent =
                    originalText;
            }
        }, 1500);
    }

    function initializeForm() {
        if (!form) {
            return;
        }

        form.addEventListener("submit", event => {
            if (!validateForm()) {
                event.preventDefault();
                return;
            }

            stopSpeech();

            if (recognition && isListening) {
                manuallyStoppedRecognition = true;

                try {
                    recognition.stop();
                } catch (error) {
                    console.warn(
                        "Unable to stop recognition:",
                        error
                    );
                }
            }

            showResponseLoader();
        });
    }

    function validateForm() {
        let valid = true;

        if (
            companyInput &&
            !companyInput.value.trim()
        ) {
            valid = false;
            focusField(companyInput);
        }

        if (
            valid &&
            modelInput &&
            !modelInput.value.trim()
        ) {
            valid = false;
            focusField(modelInput);
        }

        if (
            valid &&
            queryInput &&
            !queryInput.value.trim()
        ) {
            valid = false;
            focusField(queryInput);
        }

        if (!valid) {
            showValidationFeedback();
        }

        return valid;
    }

    function focusField(field) {
        if (!field) {
            return;
        }

        field.focus();

        field.classList.add(
            "validation-shake"
        );

        window.setTimeout(() => {
            field.classList.remove(
                "validation-shake"
            );
        }, 450);
    }

    function showValidationFeedback() {
        if (!form) {
            return;
        }

        const formCard =
            form.closest(".spec-form-card");

        if (!formCard) {
            return;
        }

        let error =
            formCard.querySelector(
                ".client-validation-error"
            );

        if (!error) {
            error =
                document.createElement("div");

            error.className =
                "spec-error client-validation-error";

            error.innerHTML = `
                <i class="fas fa-circle-exclamation"></i>
                <span>
                    Please complete all required fields.
                </span>
            `;

            const header =
                formCard.querySelector(
                    ".spec-form-header"
                );

            if (header) {
                header.after(error);
            } else {
                formCard.prepend(error);
            }
        }

        window.clearTimeout(
            error._removeTimer
        );

        error._removeTimer =
            window.setTimeout(() => {
                if (error.parentNode) {
                    error.remove();
                }
            }, 3000);
    }

    function initializeLoader() {
        if (!loader) {
            return;
        }

        loader.classList.remove("active");

        loader.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    function showResponseLoader() {
        if (!loader) {
            return;
        }

        loader.classList.add("active");

        loader.style.display = "flex";

        loader.setAttribute(
            "aria-hidden",
            "false"
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
                window.setTimeout(() => {
                    document
                        .querySelectorAll("[data-aos]")
                        .forEach(element => {
                            element.classList.add(
                                "aos-animate"
                            );
                        });

                    if (
                        typeof AOS !==
                        "undefined"
                    ) {
                        AOS.refresh();
                    }
                }, 250);
            },
            {
                once: true
            }
        );
    }

    function cleanup() {
        if (speechSupported) {
            try {
                window.speechSynthesis.cancel();
            } catch (error) {
                console.warn(error);
            }
        }

        if (recognition && isListening) {
            try {
                recognition.stop();
            } catch (error) {
                console.warn(error);
            }
        }
    }

    window.printResponse = function () {
        const text = getResponsePlainText();

        if (!text) {
            return;
        }

        stopSpeech();

        const company =
            companyInput
                ? companyInput.value.trim()
                : "";

        const model =
            modelInput
                ? modelInput.value.trim()
                : "";

        const title =
            [company, model]
                .filter(Boolean)
                .join(" ") ||
            "Car Specification";

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=900,height=900"
            );

        if (!printWindow) {
            return;
        }

        const date =
            new Date().toLocaleString(
                "en-IN",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );

        printWindow.document.open();

        printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)} - Moto Genie</title>

<style>
@page {
    size: A4;
    margin: 18mm;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    background: #fff;
    color: #17202a;
    font-family: Arial, Helvetica, sans-serif;
}

.document {
    max-width: 760px;
    margin: 0 auto;
}

.header {
    padding-bottom: 20px;
    margin-bottom: 26px;
    border-bottom: 2px solid #58abd4;
}

.brand {
    margin-bottom: 8px;
    color: #58abd4;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 3px;
}

h1 {
    margin: 0;
    color: #111827;
    font-size: 28px;
    line-height: 1.25;
}

.meta {
    margin-top: 10px;
    color: #667085;
    font-size: 11px;
}

.label {
    margin: 28px 0 10px;
    color: #58abd4;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
}

.response {
    color: #202938;
    font-size: 14px;
    line-height: 1.85;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.footer {
    margin-top: 40px;
    padding-top: 12px;
    border-top: 1px solid #d9dee5;
    color: #7a8491;
    font-size: 10px;
}
</style>
</head>

<body>
<main class="document">

<header class="header">
    <div class="brand">MOTO GENIE</div>

    <h1>
        ${escapeHtml(title)}
    </h1>

    <div class="meta">
        AI Vehicle Specification · ${escapeHtml(date)}
    </div>
</header>

<div class="label">
    AI Response
</div>

<div class="response">${escapeHtml(text)}</div>

<footer class="footer">
    Generated by Moto Genie AI.
</footer>

</main>

<script>
window.onload = function () {
    window.print();
};

window.onafterprint = function () {
    window.close();
};
<\/script>

</body>
</html>
        `);

        printWindow.document.close();
    };

    window.printDoc = function () {
        const text = getResponsePlainText();

        if (!text) {
            return;
        }

        stopSpeech();

        const company =
            companyInput
                ? companyInput.value.trim()
                : "";

        const model =
            modelInput
                ? modelInput.value.trim()
                : "";

        const title =
            [company, model]
                .filter(Boolean)
                .join(" ") ||
            "Car Specification";

        const date =
            new Date().toLocaleString(
                "en-IN",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );

        const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<title>
${escapeHtml(title)} - Moto Genie
</title>

<style>
body {
    margin: 40px;
    color: #202938;
    font-family: Arial, Helvetica, sans-serif;
    line-height: 1.8;
}

.brand {
    color: #58abd4;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 3px;
}

h1 {
    color: #111827;
    font-size: 28px;
    margin: 10px 0;
}

.meta {
    color: #667085;
    font-size: 11px;
    margin-bottom: 30px;
}

.response {
    white-space: pre-wrap;
    font-size: 14px;
}

footer {
    margin-top: 40px;
    padding-top: 12px;
    border-top: 1px solid #ddd;
    color: #777;
    font-size: 10px;
}
</style>
</head>

<body>

<div class="brand">
    MOTO GENIE
</div>

<h1>
    ${escapeHtml(title)}
</h1>

<div class="meta">
    AI Vehicle Specification · ${escapeHtml(date)}
</div>

<div class="response">
${escapeHtml(text)}
</div>

<footer>
    Generated by Moto Genie AI.
</footer>

</body>
</html>
        `;

        const blob =
            new Blob(
                [html],
                {
                    type: "application/msword"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const anchor =
            document.createElement("a");

        anchor.href = url;

        anchor.download =
            `${sanitizeFilename(title)} - Moto Genie.doc`;

        document.body.appendChild(anchor);

        anchor.click();

        anchor.remove();

        window.setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    };

    function sanitizeFilename(name) {
        return String(
            name || "car-specification"
        )
            .replace(/[<>:"/\\|?*]+/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 100) ||
            "car-specification";
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});