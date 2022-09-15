

const log = console.log;


const $frameTemplate = $(".circle-frame.my-template").detach().removeClass("my-template");
const $holder = $("#blocks-holder");

for (let i = 0; i < 3; i++) newCircleFrame(i);


function newCircleFrame(i) {


    const $frame = $frameTemplate.clone().appendTo($holder);
    const $circleMaster = $frame.find(".circle.my-template").detach().removeClass("my-template");
    const shuffledColors = shuffle(["red", "green", "blue", "orange", "yellow", "purple"]);
    const numCycles = 4;


    let index = 0;


    newCircle(1000, 0);
    function newCircle(duration, cycle) {


        const color = shuffledColors[index++ % shuffledColors.length];
        const spinDirection = isEven(i) ? "spin-up" : "spin-down";


        const $circle = $circleMaster.clone().appendTo($frame).css({
            backgroundColor: color,
            animation: `${spinDirection} ${duration}ms linear`,
        });
        setTimeout(() => $circle.remove(), duration);


        setTimeout(() => {
            if (cycle <= numCycles) return newCircle(duration, cycle + 1); //  * (0.95 + Math.random() * 0.1)
            const whichAnimation = (spinDirection === "spin-up") ? "spin-up-freeze" : "spin-down-freeze";
            return questionMark(whichAnimation, duration / 2);
        }, duration / 2);
    }


    function questionMark(whichAnimation, duration) {
        const $questionMark = $circleMaster.clone().appendTo($frame).addClass("question-mark").css({
            animation: `${whichAnimation} ${duration * 1.5}ms ease-out`,
        });
    }
}

function isEven(n) {
    return n % 2 === 0;
}

function shuffle(array) {
    let shuffledArray = [];
    let whittleArray = array.slice();
    while (whittleArray.length) {
        let rand = Math.floor(Math.random() * whittleArray.length);
        shuffledArray.push(whittleArray[rand]);
        whittleArray.splice(rand, 1);
    }
    return shuffledArray;
}


