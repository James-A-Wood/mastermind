

import '../libraries/konva.js';
import '../libraries/jquery.js';


const log = console.log;


function ConfettiCelebration(obj = {}) {

    obj = $.extend({
        numPieces: window.innerHeight > window.innerWidth ? 200 : 400,
        colors: ["red", "green", "blue", "yellow", "orange", "pink", "purple"],
        numFlipsPerSecond: 5,
        fallMs: 1500,
    }, obj);

    const { numPieces, colors, numFlipsPerSecond, fallMs } = obj;

    const $stageHolder = $("<div id='confetti-holder' style='position: fixed; top: 0; left: 0;'></div>");
    const stage = new Konva.Stage({
        width: window.innerWidth,
        height: window.innerHeight,
        container: $stageHolder[0],
    });
    const layer = new Konva.Layer();
    layer.moveTo(stage);

    const confettiMaster = new Konva.Rect({
        height: window.innerHeight / 50,
        width: window.innerWidth / 50,
    });

    const removeConfettiStuff = () => $stageHolder.remove();

    function newPiece(i) {

        setTimeout(() => {

            const color = colors[Math.floor(Math.random() * colors.length)];
            const howClose = 0.5 + Math.random();
            const rotation = 1200 * (Math.random() > 0.5 ? 1 : -1);

            const piece = confettiMaster.clone({
                fill: color,
                y: -confettiMaster.height(),
                x: Math.random() * stage.width(),
                rotation: Math.random() * 360,
            }).moveTo(layer);

            piece.offsetX(piece.width() / 2).offsetY(piece.height() / 2)
                .scaleX(howClose).scaleY(howClose);

            piece.to({
                y: stage.height() + piece.height() * howClose,
                duration: fallMs / 1000 * (2 - howClose),
                rotation: rotation,
                easing: Konva.Easings.EaseIn,
                onFinish: () => {
                    piece.destroy();
                    if (i === numPieces - 1) removeConfettiStuff();
                },
            });
            piece.to({
                width: 0,
                yoyo: true,
                duration: numFlipsPerSecond / 60,
            });
        }, i * 2000 / numPieces);
    };

    this.onTouch = obj.onTouch ?? (() => undefined);

    this.new = () => {

        $stageHolder.remove().appendTo("body");

        for (let i = 0; i < numPieces; i++) newPiece(i);

        // adding a transparent rectangle to respond to touch events
        const touchRect = new Konva.Rect({
            fill: "transparent",
            height: stage.height(),
            width: stage.width(),
            x: 0,
            y: 0,
        }).moveTo(layer);
        touchRect.on("click touchstart", () => {
            removeConfettiStuff();
            this.onTouch();
        });

        $(window).one("keydown", removeConfettiStuff);
    };
}

export { ConfettiCelebration };
