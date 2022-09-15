import "../libraries/howler.js";


const log = console.log;


function Sounds(settings = {}) {

    let sounds = {};

    this.areEnabled = () => true; // default

    this.addSingle = (soundName, src) => {
        sounds[soundName] = new Howl({
            src: [src],
            autoplay: settings.autoplay,
        });
        return this;
    };

    this.addMultiple = sounds => {
        for (const soundName in sounds) this.addSingle(soundName, sounds[soundName]);
    }

    this.play = soundName => {
        if (!this.areEnabled()) return false;
        this.stopAll();
        sounds[soundName].play();
    }


    this.stopAll = () => {
        for (const key in sounds) this.stop(sounds[key]);
    }


    this.stop = soundName => soundName?.stop();
}


function fitInside(obj = {}) {

    if (!obj || typeof obj !== "object" || !obj.child) return log("Got some bad parameters!");

    const $child = obj.child;
    const $parent = obj.parent ?? $child.parent();
    const fillRatio = obj.fillRatio ?? 0.7;
    const mobileFillRatio = obj.mobileFillRatio ?? fillRatio;

    $(window).on("resize", () => {
        const deviceAdjustedRation = window.innerHeight > window.innerWidth ? mobileFillRatio : fillRatio;
        const heightRatio = $parent.height() / $child.height() * deviceAdjustedRation;
        const widthRatio = $parent.width() / $child.width() * deviceAdjustedRation;
        const ratio = Math.min(heightRatio, widthRatio);
        $child.css({
            transform: `scale(${ratio}, ${ratio})`,
            "-webkit-transform": `scale(${ratio}, ${ratio})`, // necessary?
        });
    });

    return true;
}


const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return [...array];
}


function Timer(obj = {}) {

    this.display = obj.display;

    this.start = () => changeRunningState(true);
    this.pause = () => changeRunningState(false);
    this.onStateChange = () => undefined;

    this.clear = () => {
        changeRunningState(false);
        elapsedMs = 0;
    };

    this.updateDisplay = () => this.display.textContent = formatTime(elapsedMs);
    let t1 = Date.now();
    let elapsedMs = 0;
    let isRunning = false;

    const pad = t => t < 10 ? "0" + t : t;

    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const hundredths = Math.floor(ms / 10) % 100;
        let string = minutes + ":" + pad(seconds);
        if (obj.useHundredths) string += "." + pad(hundredths)
        return string;
    }

    const tick = () => {
        const t2 = Date.now();
        if (isRunning) elapsedMs += t2 - t1;
        t1 = t2;
        this.updateDisplay();
        window.requestAnimationFrame(tick);
    };
    tick();

    const changeRunningState = val => {
        isRunning = val ?? !isRunning;
        this.onStateChange(isRunning);
    };
}


function forceArray(array) {
    return Array.isArray(array) ? array : [array];
}


export { Sounds, fitInside, shuffleArray, Timer, forceArray }
