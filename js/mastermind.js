
import "./libraries/jquery.js";
import "./libraries/jqueryui.js";
import { Sounds, fitInside, shuffleArray, Timer, forceArray } from "./modules/Modules.js";
import { ConfettiCelebration } from "./modules/ConfettiCelebration.js";


const log = console.log;





// prompt to install
let defferedPrompt;
const $addbtn = $("#install-button");
const $dismissButton = $("#dismiss-button");
const $holder = $("#install-button-holder");

$dismissButton.on("click", () => $holder.removeClass("showing"));

if (window.matchMedia && ('(display-mode: standalone)').matches) $holder.remove();

window.addEventListener("beforeinstallprompt", event => {
    $holder.addClass("showing");
    event.preventDefault();
    defferedPrompt = event;
    $addbtn.on("click", () => {
        defferedPrompt.prompt();
        defferedPrompt.userChoice.then(choice => {
            if (choice.outcome === "accepted") console.log("user accepted the prompt");
            localStorage.mastermind_installed = "true";
            defferedPrompt = null;
        });
    });
});









function Settings(p = {}) {

    p.sound = p.sound ?? (() => undefined);
    p.window = p.window ?? document.querySelector("#settings-window");
    p.windowOpenClass = p.windowOpenClass ?? "now-showing";

    const settingsWindow = p.window;
    const windowOpenClass = p.windowOpenClass;

    $(".settings-toggler").each((i, icon) => icon.addEventListener("click", () => settingsWindow.classList.toggle(windowOpenClass)));

    window.addEventListener("keydown", e => {
        if (e.key === "Escape" || e.key === "Enter") return settingsWindow.classList.remove(windowOpenClass);
    });

    this.isOpen = () => settingsWindow.classList.contains(windowOpenClass);

    this.showKeyboardShortcuts = () => localStorage.showKeyboardShortcuts === "true";

    this.radio = input => {

        forceArray(input).forEach(obj => {

            obj = Object.assign({
                name: undefined,
                key: undefined,
                onChange: () => undefined,
                default: undefined,
            }, obj ?? {});

            if (!obj.name || !obj.key) return log("Missing the radio name and/or key!");

            const radios = document.querySelectorAll(`input[name='${obj.name}']`);
            const selectedRadio = localStorage[obj.key] ?? obj.default;

            radios.forEach(radio => radio.onchange = function () {
                const value = radio.value;
                localStorage[obj.key] = value;
                obj.onChange(value);
            });
            document.querySelector(`input[name='${obj.name}'][value=${selectedRadio}]`).click();
        });
    };

    this.checkbox = input => {

        forceArray(input).forEach(obj => {

            obj = Object.assign({
                input: undefined,
                key: undefined,
                onChange: () => undefined,
                default: "true",
            }, obj ?? {});

            if (!obj.input || !obj.key) return log("Missing either an input or a key, bonehead!");

            const input = obj.input;
            const startValue = (localStorage[obj.key] || obj.default) === "true";

            localStorage[obj.key] = startValue;

            input.checked = startValue;
            input.addEventListener("change", () => {
                localStorage[obj.key] = input.checked;
                if (p.sound) p.sound();
                obj.onChange(input.checked);
            });
            obj.onChange(input.checked);
        });
    };
}


const controller = new Controller(MastermindTable, Colors, ColorPicker, Sounds, LevelPicker, AnswerWindow, Settings, Timer, ResultsWindow, ConfettiCelebration);
function Controller(MastermindTable, Colors, ColorPicker, Sounds, LevelPicker, AnswerWindow, Settings, Timer, ResultsWindow, ConfettiCelebration) {

    let useSoundEffects;

    const $pegTemplate = $(".peg.my-template").detach().removeClass("my-template");
    const $rowTemplate = $(".row.my-template").detach().removeClass("my-template");
    const $answerPegTemplate = $(".answer-peg.my-template").detach().removeClass("my-template");
    const $answerSlotTemplate = $(".answer-peg-slot.my-template").detach().removeClass("my-template");

    const sounds = new Sounds();
    const colors = new Colors();
    const code = new Code({ array: colors.allColors });
    const levelPickerScreen = new LevelPicker(colors);
    const answerWindow = new AnswerWindow(colors, $answerPegTemplate, $answerSlotTemplate);
    const confettiCelebration = new ConfettiCelebration({
        onTouch: () => newGame(numElements, sounds),
    });
    const resultsWindow = new ResultsWindow("#results-window");
    resultsWindow.onClick = () => newGame(numElements, sounds);

    answerWindow.onAllSlotsFinishedRolling = () => undefined;
    answerWindow.onEachSlotFinishedRolling = () => sounds.play("tick");

    const colorPicker = new ColorPicker({
        colors: colors.allColors,
        gameOver: () => this.gameOver,
        shortcuts: colors.getShortcutKeys, // in the order of colors.allColors
    });

    const keyboardShortcuts = document.querySelector("#show-keyboard-shortcuts-checkbox");
    const koukaon = document.querySelector("#koukaon-checkbox");
    let autoAdvance = document.querySelector("#auto-advance");

    const timer = new Timer({ display: document.querySelector("#timer-display"), });
    const settings = new Settings({ sound: () => sounds.play("tick"), });

    settings.radio({
        name: "language-toggler",
        key: "language",
        default: "english",
        onChange: value => document.querySelector("body").classList.toggle("japanese-mode", value === "japanese"),
    });

    settings.checkbox([
        {
            input: keyboardShortcuts,
            key: "show_keyboard_shortcuts",
            onChange: value => document.querySelector("#keyboard-shortcuts").classList.toggle("show-keyboard-shortcuts", value),
        },
        {
            input: koukaon,
            key: "use_sound_effects",
            onChange: value => useSoundEffects = value,
        },
        {
            input: autoAdvance,
            key: "auto_advance",
            onChange: value => autoAdvance = value,
        },
    ]);

    let mastermindTable;
    let numElements; // saving this here to use when restarting the game

    this.gameOver = false;

    $("#play-again-button").on("click", () => newGame(numElements, sounds));
    // document.querySelector("#play-again-button").blur();

    $("#choose-level-button").on("click", () => $("body").removeClass("now-playing"));

    levelPickerScreen.onLevelClick = nElements => {
        numElements = nElements;
        return newGame(numElements, sounds);
    };

    sounds.addMultiple({
        tick: "./sounds/tick.mp3",
        pop: "./sounds/pop.mp3",
        submitted: "./sounds/submitted.mp3",
        tada: "./sounds/tada.mp3",
        lose_sound: "./sounds/lose_sound.mp3",
    });
    sounds.areEnabled = () => useSoundEffects;

    const newGame = numElements => {

        mastermindTable = new MastermindTable({
            numElements: numElements,
            gameOver: () => this.gameOver,
            pegTemplate: $pegTemplate,
            rowTemplate: $rowTemplate,
        });
        resultsWindow.hide();
        mastermindTable.autoAdvance = () => autoAdvance;
        code.numElements = numElements;
        code.generateNew();
        timer.clear();
        sounds.stopAll();
        mastermindTable.buildNewTable().onArrowKey = () => sounds.play("tick");
        $("#message-window").removeClass("message-showing");
        answerWindow.build(numElements);

        this.gameOver = false;

        document.querySelector("body").classList.add("now-playing");

        colorPicker.onPick = (color, index) => {
            mastermindTable.fillPeg(color, index);
            sounds.play("tick");
            timer.start();
        };
        colorPicker.onEnterKey = () => mastermindTable.submitRow();
        colorPicker.onClear = () => mastermindTable.clearSelectedPeg();

        mastermindTable.onSubmitAnswer = userGuess => {
            sounds.play("submitted");
            const result = code.checkAnswer(userGuess);
            mastermindTable.showResult(result);
            if (result.black === code.numElements) return endSequence(true);
            if (mastermindTable.allRowsFilled()) return endSequence(false);
        };
    };

    const endSequence = didClear => {
        mastermindTable.gameOver();
        this.gameOver = true;
        timer.pause();
        $("#message-window").addClass("message-showing");
        answerWindow.showAnswers(code.getCode(), colors.allColors);
        sounds.play(didClear ? "tada" : "lose_sound");
        // didClear ? didWin() : didLose();
        if (didClear) confettiCelebration.new();
        resultsWindow.show(didClear);
    };

    // ERASE THIS LINE - we're just bypassing the levelPicker screen for testing purposes...
    // document.querySelector(".level-button.easy").click();
}


function ResultsWindow(id, obj = {}) {

    const $box = $(id);
    const showingClass = obj.showingClass ?? "showing";

    $box.on("click", () => this.onClick());

    this.onClick = () => undefined;

    this.show = didWin => {
        $box.addClass(showingClass);
        $box.text(didWin ? "You won!" : "You lost!");
    };

    this.hide = () => {
        $box.removeClass(showingClass);
    };
}


function Colors(obj = {}) {

    let counter = 0;

    this.allColors = obj.allColors ?? ["gold", "darkorange", "red", "purple", "blue", "green"];
    this.shuffledColors = shuffleArray(this.allColors.slice());
    this.getIndexOf = item => this.allColors.indexOf(item);
    this.getColorAt = index => this.allColors[index];
    this.pickNextRandomColor = () => this.shuffledColors[counter++ % this.shuffledColors.length];
    this.getShuffledColors = () => shuffleArray(this.shuffledColors);
    this.getShortcutKeys = obj.shortcutKeys ?? "YORPBG".split("");
}


function Code(obj) {

    this.array = obj.array; // array of colors, or anything else
    this.numElements = obj.numElements ?? 3;
    this.allowDuplicates = obj.allowDuplicates ?? false;
    this.secretCode = undefined;

    this.generateNew = () => {
        let array = [];
        while (array.length < this.numElements) {
            const rand = Math.floor(Math.random() * this.array.length);
            if (this.allowDuplicates || !array.includes(rand)) array.push(rand);
        }
        this.secretCode = array;
        log(array);
        return this;
    };

    this.checkAnswer = array => {
        if (this.secretCode === undefined) return log("No code set yet!");
        if (array.length !== this.secretCode.length) return log("Arrays must be of the same length!");
        const black = array.filter((item, index) => item === this.secretCode[index]).length;
        const white = array.filter(item => this.secretCode.includes(item)).length - black;
        const other = array.length - black - white;
        return { black, white, other };
    };

    this.getCode = () => this.secretCode;
}


function AnswerWindow(colors, $answerPegTemplate, $answerSlotTemplate) {


    const $answerPegsHolder = $("#answer-pegs-holder");


    let interval = undefined;
    let slots = [];
    let previousColors = [];


    this.onAllSlotsFinishedRolling = () => undefined;
    this.onEachSlotFinishedRolling = () => undefined;


    const spinSlots = (obj = {}) => {

        const baseSpeed = obj.baseSpeed ?? 200;
        const speedOffset = obj.speedOffset ?? 30;
        const numBallsPerShot = obj.numBallsPerShot ?? 6;

        slots.forEach(($slot, index) => {

            const speed = baseSpeed + index * speedOffset;
            const shuffledColors = colors.getShuffledColors(); // each slot gets unique array of colors

            let colorIndex = 0;

            const shootRandomBall = $slot => {

                const thisColor = shuffledColors[colorIndex++ % shuffledColors.length];
                const $peg = generateNewBall($slot).css({ backgroundColor: thisColor });

                $peg.animate({
                    top: -$peg.height(),
                }, speed * 2, "linear", () => $peg.remove());
            };

            const shootQuestionMarkBall = ($slot, index) => {
                const $peg = generateNewBall($slot).addClass("question-mark");
                $peg.animate({
                    top: ($slot.height() - $peg.height()) / 2,
                }, speed, "linear", () => {
                    this.onEachSlotFinishedRolling();
                    if (index === slots.length - 1) this.onAllSlotsFinishedRolling();
                });
            };

            const generateNewBall = $slot => $answerPegTemplate.clone().css({
                top: $slot.height(),
            }).appendTo($slot);

            for (let i = 0; i < numBallsPerShot; i++) setTimeout(() => shootRandomBall($slot), i * speed);
            setTimeout(() => shootQuestionMarkBall($slot, index), numBallsPerShot * speed);
        });
        return this;
    };


    this.showAnswers = (indexesArray, colors) => {
        clearInterval(interval);
        slots.forEach(function ($slot, index) {
            const color = colors[indexesArray[index]];
            $slot.find(".answer-peg").removeClass("question-mark").css({ backgroundColor: color });
        });
    };


    this.build = n => {
        this.clear();
        for (let i = 0; i < n; i++) slots.push($answerSlotTemplate.clone().appendTo($answerPegsHolder));
        return spinSlots();
    };


    this.clear = () => {
        $answerPegsHolder.empty();
        slots.length = 0;
        previousColors.length = 0;
        clearInterval(interval);
        return this;
    };
}


function MastermindTable(obj = {}) {

    const table = obj.table ?? document.querySelector("#mastermind-table");
    const $rowsHolder = obj.rowsHolder ?? $("#rows-holder");
    const gameOver = obj.gameOver ?? (() => undefined); // have to wrap this arrow function in parentheses?
    const that = this;
    const $pegTemplate = obj.pegTemplate;
    const $rowTemplate = obj.rowTemplate;

    const numRows = obj.numRows ?? 10;
    const numElements = obj.numElements ?? 3;
    const activeRowClass = obj.activeRowClass ?? "active-row";
    const selectedPegClass = obj.selectedPegClass ?? "active-peg";
    const pegClass = "peg";
    const rowFilledClass = "filled";
    const rowSubmittedClass = "row-submitted";

    let rows = [];
    let numGuesses = 0;

    this.onArrowKey = () => undefined;

    const arrowHandler = e => {
        if (gameOver() || !["ArrowRight", "ArrowLeft"].includes(e.key)) return true;
        const arrow = e.key;
        const pegs = getActiveRow().pegs;
        const currentIndex = pegs.findIndex($e => $e.hasClass(selectedPegClass));
        if (currentIndex === -1) return true;
        const direction = arrow === "ArrowRight" ? 1 : -1;
        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex += numElements;
        if (newIndex >= numElements) newIndex -= numElements;
        if (!pegs[newIndex]) return true;
        this.onArrowKey();
        pegs[newIndex].trigger("click");
    };

    fitInside({ child: $(table), fillRatio: 0.9, mobileFillRatio: 1 });
    fitInside({ child: $("#shutter-text") });
    $(window).on("keydown", arrowHandler);

    this.onSubmitAnswer = () => undefined;
    this.autoAdvance = () => true;

    this.buildNewTable = () => {
        table.classList.remove("game-over");
        rows.length = 0;
        $rowsHolder.empty();
        for (let i = 0; i < numRows; i++) rows.push(newRow(i));
        $(window).trigger("resize");
        focusPeg(getFirstPeg(getLastActiveRow()), getLastActiveRow());
        return this;
    };

    function newRow(i) {
        const $row = $rowTemplate.clone().appendTo($rowsHolder);
        $row.find(".number-holder").text(numRows - i);
        $row.find(".submit-button").on("click", () => submitRow());
        $row.pegs = [];
        for (let i = 0; i < numElements; i++) $row.pegs.push(newPeg($row));
        return $row;
    }

    function newPeg($row) {
        const $resultsHolder = $row.find(".results-holder");
        const $peg = $pegTemplate.clone().insertBefore($resultsHolder);
        const $circle = $peg.find(".circle");
        const $focusRing = $peg.find(".focus-ring");
        const diameter = parseInt($peg.css("height")) * 0.6;
        const ringDiameter = diameter * 1.1;
        $circle.css({ height: diameter, width: diameter });
        $focusRing.css({ height: ringDiameter, width: ringDiameter });
        $peg.data("value", -1);
        $peg.on("click", () => focusPeg($peg, $row));
        $peg.row = $row;
        return $peg;
    }


    const allPegsFilled = () => getNumSelected() === numElements;

    const getActiveRow = () => rows.filter($r => $r.hasClass(activeRowClass))[0];

    const getNumSelected = () => getActiveRow().pegs.filter($p => $p.data("value") !== -1).length;

    const getSelectedPeg = () => getActiveRow().pegs.filter($p => $p.hasClass("active-peg"))[0];

    this.getSelectedPeg = getSelectedPeg;

    this.showResult = pins => {
        for (const color in pins) {
            const numPins = pins[color];
            for (let i = 0; i < numPins; i++) {
                const $parent = getActiveRow().find(".bwpins-holder");
                $parent.find(".num-black").text(pins.black);
                $parent.find(".num-white").text(pins.white);
                $parent.find(".num-other").text(pins.other);
            }
        }
        getActiveRow().find(".pins-row").each(function () {
            if ($(this).children().length === 0) $(this).remove();
        });
        numGuesses++;
        return this;
    };

    this.allRowsFilled = () => numGuesses >= numRows;

    this.gameOver = () => {
        $("." + selectedPegClass).removeClass(selectedPegClass);
        table.classList.add("game-over");
        return this;
    };

    function focusPeg($peg, $row = undefined) {
        $row = $row ?? getActiveRow();
        if ($peg === undefined) return false;
        if ($row.hasClass(rowSubmittedClass)) return log("Row has already been submitted!");
        rows.forEach($r => $r.removeClass(activeRowClass)
            .pegs.forEach($peg => $peg.removeClass(selectedPegClass)));
        $peg.addClass(selectedPegClass);
        $row.addClass(activeRowClass);
    }

    const getFirstPeg = row => getPegAtIndex(row, 0);
    const getPegAtIndex = (row, index) => row.pegs[index];
    const getLastActiveRow = () => rows.filter($r => !$r.hasClass(rowSubmittedClass)).slice().pop();

    this.fillPeg = (color, index) => {
        $(selectedPegClass).removeClass(selectedPegClass);
        getSelectedPeg().data("value", index).find(".circle")
            .addClass("filled-peg").css({ background: color });
        if (this.autoAdvance()) getSelectedPeg().next(`.${pegClass}`).trigger("click");
        if (allPegsFilled()) getSelectedPeg().row.addClass(rowFilledClass);
        return this;
    };

    this.clearSelectedPeg = () => {
        $(selectedPegClass).removeClass(selectedPegClass);
        getSelectedPeg().data("value", -1).find(".circle").removeClass("filled-peg")
            .css({ background: "linear-gradient(#000, #333, #000)" }); // klugey, copied from CSS
        getSelectedPeg().row.toggleClass(rowFilledClass, allPegsFilled());
        return this;
    };

    function submitRow($row = undefined) {
        if (gameOver()) return false;
        $row = $row ?? getActiveRow();
        if (!allPegsFilled()) return;// log("Not all pegs are filled!");
        $row.removeClass("filled").addClass(rowSubmittedClass);
        $row.find(".submit-button").remove();
        const userGuess = $row.pegs.map($peg => $peg.data("value"));
        that.onSubmitAnswer(userGuess);
        if ($row.prev().length) focusPeg($row.prev().find(".peg").eq(0), $row.prev()); // klugey
        return userGuess;
    };
    this.submitRow = submitRow;
}


function ColorPicker(obj = {}) {

    obj = $.extend({
        $picker: $("#color-picker"),
        gameOver: () => undefined,
        colors: null,
        shortcuts: [],
    }, obj);
    const { $picker, gameOver, colors, shortcuts } = obj;

    const $shortcutsHolder = $("#keyboard-shortcuts");
    const $shortcutLetterMaster = $(".shortcut-letter").detach();
    const $choiceTemplate = $picker.find(".color-choice.my-template").detach().removeClass("my-template");
    const pickerButtonWidth = $picker.width() / (colors.length + 1) + "px"; // +1 to account for $clearButton

    const formatPickerButton = ($button, onclick, color) => {
        $button.css({
            width: pickerButtonWidth,
            height: pickerButtonWidth,
            backgroundColor: color,
            transform: "scale(0.8, 0.8)",
        }).on("click", () => !gameOver() && !this.disabled && onclick());
    };

    let elements = [];

    this.onPick = () => undefined;
    this.onClear = () => undefined;
    this.onEnterKey = () => undefined;
    this.disabled = false;

    if (shortcuts.length) shortcuts.forEach(letter => $shortcutLetterMaster.clone().text(letter).appendTo($shortcutsHolder));

    colors.forEach((color, index) => {
        const $button = $choiceTemplate.clone().appendTo("#color-choices-holder");
        formatPickerButton($button, () => {
            this.onPick(color, index);
            eyeCandy($button);
        }, color);
        elements.push($button);
    });

    // const $clearButton = $choiceTemplate.clone().appendTo("#color-choices-holder").addClass("clear-button");
    // formatPickerButton($clearButton, () => this.onClear(), "black");
    // elements.push($clearButton);

    const eyeCandy = ($choice, eyeCandyClass = "clicked") => {
        $choice.addClass(eyeCandyClass); // eye candy
        setTimeout(() => $choice.removeClass(eyeCandyClass), 100);
    }

    $(window).on("keydown", e => {
        if (gameOver()) return true;
        if (e.key === "Enter") return this.onEnterKey();
        const shortcutIndex = shortcuts.indexOf(e.key.toUpperCase());
        if (shortcutIndex !== -1 && !e.ctrlKey && !e.metaKey) elements[shortcutIndex].trigger("click");
    });
}


function LevelPicker(colors) {

    const $title = $("#level-picker #title");
    const titleLetters = $title.text().split("");
    const that = this;
    $title.text("");
    titleLetters.forEach(letter => $(`<span style='color:${colors.pickNextRandomColor()}'>${letter}</span>`).appendTo($title));

    $(".level-button").on("click", function () {
        const numElements = $(this).data("num_elements");
        that.onLevelClick(numElements);
    });

    this.onLevelClick = () => undefined;
}



