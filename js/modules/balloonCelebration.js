import '/js/libraries/konva.js';
import '/js/libraries/jquery.js';


const log = console.log;


function balloonCelebration(settings = {}) {


    settings = $.extend({
        numBalloons: 50,
        duration: 4, // seconds
        rotation: 60, // degrees
        image: "/images/balloon.png",
        swayDuration: 1, // seconds swaying left to right
    }, settings);


    let stage, layer;


    Konva.Image.fromURL(settings.image, function (balloon) {


        balloon.width(balloon.width() / 10);
        balloon.height(balloon.height() / 10);


        const $balloonHolderDiv = $("<div></div>").css({
            position: "fixed",
            width: "100vw",
            height: "100vh",
            top: 0,
            left: 0,
        });
        $balloonHolderDiv.appendTo("body");
        stage = new Konva.Stage({
            container: $balloonHolderDiv[0],
            width: $balloonHolderDiv.width(),
            height: $balloonHolderDiv.height(),
        });
        layer = new Konva.Layer().moveTo(stage);


        // dismissing the balloons on click or any key event
        $balloonHolderDiv.one("click", removeBalloonStuff);
        $(window).one("keydown", removeBalloonStuff);


        function removeBalloonStuff() {
            layer.destroy();
            $balloonHolderDiv.remove();
        }


        for (let i = 0; i < settings.numBalloons; i++) setTimeout(() => addBalloon(balloon, settings), i * 40);


        function addBalloon(balloon, settings) {


            const newBalloon = balloon.clone().moveTo(layer).cache();
            const magnification = Math.random() + 0.5; // 0.5 ~ 1.5
            const rotation = (settings.rotation / 2) - Math.random() * settings.rotation;


            newBalloon.x(Math.random() * stage.width())
                .offsetX(newBalloon.width() / 2)
                .offsetY(newBalloon.height() / 2)
                .y(stage.height() + newBalloon.height() / 2)
                .rotation(rotation)
                .scale({ x: magnification, y: magnification, })
                .to({
                    duration: 4 * (2 - magnification), // klugey...
                    y: -balloon.height() * magnification,
                    onFinish: () => newBalloon.destroy(),
                });


            newBalloon.to({
                duration: settings.swayDuration,
                rotation: -newBalloon.rotation(),
                easing: Konva.Easings.EaseInOut,
                yoyo: true,
            });
        }
    });
}


export { balloonCelebration };
