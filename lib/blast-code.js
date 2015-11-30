var $ = window;

(function(funcName, baseObj) {
    // The public function name defaults to window.docReady
    // but you can pass in your own object and own function name and those will be used
    // if you want to put them in a different namespace
    funcName = funcName || "ready";
    baseObj = baseObj || window;
    var readyList = [];
    var readyFired = false;
    var readyEventHandlersInstalled = false;

    // call this when the document is ready
    // this function protects itself against being called more than once
    function ready() {
        if (!readyFired) {
            // this must be set to true before we start calling callbacks
            readyFired = true;
            for (var i = 0; i < readyList.length; i++) {
                // if a callback here happens to add new ready handlers,
                // the docReady() function will see that it already fired
                // and will schedule the callback to run right after
                // this event loop finishes so all handlers will still execute
                // in order and no new ones will be added to the readyList
                // while we are processing the list
                readyList[i].fn.call(window, readyList[i].ctx);
            }
            // allow any closures held by these functions to free
            readyList = [];
        }
    }

    function readyStateChange() {
        if ( document.readyState === "complete" ) {
            ready();
        }
    }

    // This is the one public interface
    // docReady(fn, context);
    // the context argument is optional - if present, it will be passed
    // as an argument to the callback
    baseObj[funcName] = function(callback, context) {
        // if ready has already fired, then just schedule the callback
        // to fire asynchronously, but right away
        if (readyFired) {
            setTimeout(function() {callback(context);}, 1);
            return;
        } else {
            // add the function and context to the list
            readyList.push({fn: callback, ctx: context});
        }
        // if document already ready to go, schedule the ready function to run
        if (document.readyState === "complete") {
            setTimeout(ready, 1);
        } else if (!readyEventHandlersInstalled) {
            // otherwise if we don't have event handlers installed, install them
            if (document.addEventListener) {
                // first choice is DOMContentLoaded event
                document.addEventListener("DOMContentLoaded", ready, false);
                // backup is window load event
                window.addEventListener("load", ready, false);
            } else {
                // must be IE
                document.attachEvent("onreadystatechange", readyStateChange);
                window.attachEvent("onload", ready);
            }
            readyEventHandlersInstalled = true;
        }
    }
})("ready", $);

$.ready(function () {
    var shakeTime = 0,
        shakeTimeMax = 0,
        shakeIntensity = 5,
        lastTime = 0,
        particles = [],
        particlePointer = 0,
        MAX_PARTICLES = 500,
        PARTICLE_NUM_RANGE = { min: 5, max: 10 },
        PARTICLE_GRAVITY = 0.05,
        PARTICLE_ALPHA_FADEOUT = 0.99,
        PARTICLE_VELOCITY_RANGE = {
            x: [-1, 1],
            y: [-3.5, -1.5]
        },
        w = window.innerWidth,
        h = window.innerHeight,
        effect = 1;

    var targetNode = document.body;
    var ctx;
    var throttledShake = throttle(shake, 100);
    var throttledSpawnParticles = throttle(spawnParticles, 100);
    var bufferKeys = [];
    var lastFireTime;

    function initCanvas() {
        var canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d'),

        canvas.style.position = 'absolute';
        canvas.style.top = 0;
        canvas.style.left = 0;
        canvas.style.zIndex = 1;
        canvas.style.pointerEvents = 'none';
        canvas.width = w;
        canvas.height = h;

        document.body.appendChild(canvas);
    }

    function getRGBComponents(node) {
        var color = getComputedStyle(node).color;
        if (color) {
            try {
                return color.match(/(\d+), (\d+), (\d+)/).slice(1);
            } catch(e) {
                return [255, 255, 255];
            }
        } else {
            return [255, 255, 255];
        }
    }

    function spawnParticles() {
        var pos = getPosition();
        var node = document.elementFromPoint(pos.left - 5, pos.top + 5);
        var numParticles = random(PARTICLE_NUM_RANGE.min, PARTICLE_NUM_RANGE.max);
        var color = getRGBComponents(node);
        for (var i = numParticles; i--;) {
            particles[particlePointer] = createParticle(pos.left + 10, pos.top, color);
            particlePointer = (particlePointer + 1) % MAX_PARTICLES;
        }
    }

    function getPosition() {
        var currentInput = document.body.getElementsByClassName('editor');
        for (var i = 0; i < currentInput.length; ++i) {
            if (typeof(currentInput[i]) === "object") {
                if (currentInput[i].style.display !== "none") {
                    return currentInput[i]
                        .shadowRoot
                        .childNodes[2]
                        .getElementsByClassName('hidden-input')[0]
                        .getClientRects()[0];
                }
            }
        }
    }

    function createParticle(x, y, color) {
        var p = {
            x: x,
            y: y - 5,
            alpha: 1,
            color: color
        };

        if (effect === 1) {
            p.size = random(2, 4);
            p.vx = PARTICLE_VELOCITY_RANGE.x[0] + Math.random() *
                    (PARTICLE_VELOCITY_RANGE.x[1] - PARTICLE_VELOCITY_RANGE.x[0]);
            p.vy = PARTICLE_VELOCITY_RANGE.y[0] + Math.random() *
                    (PARTICLE_VELOCITY_RANGE.y[1] - PARTICLE_VELOCITY_RANGE.y[0]);
        } else if (effect === 2) {
            p.size = random(2, 4);
            p.drag = 0.92;
            p.vx = random(-3, 3);
            p.vy = random(-3, 3);
            p.wander = 0.15;
            p.theta = random(0, 360) * Math.PI / 180;
        }

        return p;
    }

    function effect1(particle) {
        particle.vy += PARTICLE_GRAVITY;
        particle.x += particle.vx;
        particle.y += particle.vy;

        particle.alpha *= PARTICLE_ALPHA_FADEOUT;

        ctx.fillStyle = 'rgba('+ particle.color[0] +','+ particle.color[1] +','+ particle.color[2] + ',' + particle.alpha + ')';
        ctx.fillRect(Math.round(particle.x - 1), Math.round(particle.y - 1), particle.size, particle.size);
    }

    // Effect based on Soulwire's demo: http://codepen.io/soulwire/pen/foktm
    function effect2(particle) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= particle.drag;
        particle.vy *= particle.drag;
        particle.theta += random( -0.5, 0.5 );
        particle.vx += Math.sin( particle.theta ) * 0.1;
        particle.vy += Math.cos( particle.theta ) * 0.1;
        particle.size *= 0.6;

        ctx.fillStyle = 'rgba('+ particle.color[0] +','+ particle.color[1] +','+ particle.color[2] + ',' + particle.alpha + ')';
        ctx.beginPath();
        ctx.arc(Math.round(particle.x - 1), Math.round(particle.y - 1), particle.size, 0, 2 * Math.PI);
        ctx.fill();
    }

    function drawParticles(timeDelta) {
        var particle;
        for (var i = particles.length; i--;) {
            particle = particles[i];
            if (!particle || particle.alpha < 0.01 || particle.size <= 0.5) {
                continue;
            }

            if (effect === 1) {
                effect1(particle);
            } else if (effect === 2) {
                effect2(particle);
            }
        }
    }

    function shake(time) {
        shakeTime = shakeTimeMax = time;
    }

    function random(min, max) {
        if (!max) {
            max = min;
            min = 0;
        }

        return min + ~~(Math.random() * (max - min + 1))
    }

    function throttle (callback, limit) {
        var wait = false;
        return function () {
            if (!wait) {
                callback.apply(this, arguments);
                wait = true;
                setTimeout(function () {
                    wait = false;
                }, limit);
            }
        }
    }

    function loop() {
        ctx.clearRect(0, 0, w, h);

        // get the time past the previous frame
        var current_time = new Date().getTime();

        if (!lastTime) {
            last_time = current_time
        }

        var dt = (current_time - lastTime) / 1000;
        lastTime = current_time;

        if (shakeTime > 0) {
            shakeTime -= dt;
            var magnitude = (shakeTime / shakeTimeMax) * shakeIntensity;
            var shakeX = random(-magnitude, magnitude);
            var shakeY = random(-magnitude, magnitude);
            targetNode.style.transform = 'translate(' + shakeX + 'px,' + shakeY + 'px)';
        }

        drawParticles();
        requestAnimationFrame(loop);
    }

    initCanvas();
    loop();
    targetNode.addEventListener('keydown', function(e) {
        if (lastFireTime === undefined || lastFireTime === null) {
            lastFireTime = (new Date().getTime()) / 1000;
        }

        var effectProbability = Math.random();
        var current = (new Date().getTime()) / 1000;

        effect = effectProbability >= 0.5 ? 1 : 2;
        bufferKeys.push(e.which);
        if (bufferKeys.length >= 100) {
            if (current - lastFireTime <= 10) {
                lastFireTime = current;
            	throttledShake(0.3);
            	throttledSpawnParticles();
            } else {
                bufferKeys = [];
            }
        }

        if (current - lastFireTime > 10) {
            lastFireTime = current;
            bufferKeys = [];
        }
    });
});
