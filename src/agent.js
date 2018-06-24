'use strict';

var clippy = {};
(() => {
/******
 *
 * @constructor
 */
clippy.Agent = function (path, data, sounds) {
    this.path = path;
    this._queue = new clippy.Queue(this._onQueueEmpty.bind(this));

    this._el = document.createElement('div');
    this._el.className = 'clippy';
    this._el.hidden = true;

    document.body.appendChild(this._el);

    this._animator = new clippy.Animator(this._el, path, data, sounds);
    this._balloon = new clippy.Balloon(this._el);
    this._setupEvents();
};

clippy.Agent.prototype = {
    /**************************** API ************************************/

    /***
     *
     * @param {Number} x
     * @param {Number} y
     */
    gestureAt: function (x, y) {
        var d = this._getDirection(x, y);
        var gAnim = 'Gesture' + d;
        var lookAnim = 'Look' + d;

        var animation = this.hasAnimation(gAnim) ? gAnim : lookAnim;
        return this.play(animation);
    },

    /***
     *
     * @param {Boolean=} fast
     *
     */
    hide: function (fast, callback) {
        var el = this._el;
        this.stop();
        if (fast) {
            this._el.hidden = true;
            this.stop();
            this.pause();
            if (callback) callback();
            return;
        }

        return this._playInternal('Hide', function () {
            el.hidden = true;
            this.pause();
            if (callback) callback();
        })
    },

    moveTo: function (x, y, duration) {
        var dir = this._getDirection(x, y);
        var anim = 'Move' + dir;
        if (duration === undefined) duration = 1000;

        this._addToQueue(function (complete) {
            // the simple case
            if (duration === 0) {
                this._el.style.top = y + 'px';
                this._el.style.left = x + 'px';
                this.reposition();
                complete();
                return;
            }

            // no animations
            if (!this.hasAnimation(anim)) {
                this._el.style.top = this._el.offsetTop + 'px';
                this._el.style.left = this._el.offsetLeft + 'px';
                requestAnimationFrame((function() {
                    __animate(this._el, { top: y + 'px', left: x + 'px' }, duration, complete);
                }).bind(this));
                return;
            }

            var callback = (function (name, state) {
                // when exited, complete
                if (state === clippy.Animator.States.EXITED) {
                    complete();
                }
                // if waiting,
                if (state === clippy.Animator.States.WAITING) {
                    this._el.style.top = this._el.offsetTop + 'px';
                    this._el.style.left = this._el.offsetLeft + 'px';
                    requestAnimationFrame((function() {
                        __animate(this._el, { top: y + 'px', left: x + 'px' }, duration, (function() {
                            // after we're done with the movement, do the exit animation
                            this._animator.exitAnimation();
                        }).bind(this));
                    }).bind(this));
                }
            }).bind(this);

            this._playInternal(anim, callback);
        }, this);
    },

    _playInternal: function (animation, callback) {
        // if we're inside an idle animation,
        if (this._isIdleAnimation() && this._idleDfd && this._idleDfd.state === 'pending') {
            this._idleDfd.then((function () {
                this._playInternal(animation, callback);
            }).bind(this));
        }

        this._animator.showAnimation(animation, callback);
    },

    play: function (animation, timeout, cb) {
        if (!this.hasAnimation(animation)) return false;

        if (timeout === undefined) timeout = 5000;

        this._addToQueue(function (complete) {
            var completed = false;
            // handle callback
            var callback = function (name, state) {
                if (state === clippy.Animator.States.EXITED) {
                    completed = true;
                    if (cb) cb();
                    complete();
                }
            };

            // if has timeout, register a timeout function
            if (timeout) {
                setTimeout((function () {
                    if (completed) return;
                    // exit after timeout
                    this._animator.exitAnimation();
                }).bind(this), timeout)
            }

            this._playInternal(animation, callback);
        }, this);

        return true;
    },

    /***
     *
     * @param {Boolean=} fast
     */
    show: function (fast) {
        this._el.hidden = false;
        if (fast) {
            this._el.hidden = false;
            this.resume();
            this._onQueueEmpty();
            return;
        }

        if (this._el.style.top === 'auto' || !this._el.style.top === 'auto') {
            var left = window.innerWidth * 0.8;
            var top = (window.innerHeight + window.pageYOffset) * 0.8;
            this._el.style.top = top + 'px';
            this._el.style.left = left + 'px';
        }

        this.resume();
        return this.play('Show');
    },

    /***
     *
     * @param {String} text
     */
    speak: function (text, hold) {
        this._addToQueue(function (complete) {
            this._balloon.speak(complete, text, hold);
        }, this);
    },

    /***
     * Close the current balloon
     */
    closeBalloon: function () {
        this._balloon.hidden = true;
    },

    delay: function (time) {
        time = time || 250;

        this._addToQueue(function (complete) {
            this._onQueueEmpty();
            setTimeout(complete, time);
        });
    },

    /***
     * Skips the current animation
     */
    stopCurrent: function () {
        this._animator.exitAnimation();
        this._balloon.close();
    },

    stop: function () {
        // clear the queue
        this._queue.clear();
        this._animator.exitAnimation();
        this._balloon.hidden = true;
    },

    /***
     *
     * @param {String} name
     * @returns {Boolean}
     */
    hasAnimation: function (name) {
        return this._animator.hasAnimation(name);
    },

    /***
     * Gets a list of animation names
     *
     * @return {Array.<string>}
     */
    animations: function () {
        return this._animator.animations();
    },

    /***
     * Play a random animation
     * @return {jQuery.Deferred}
     */
    animate: function () {
        var animations = this.animations();
        var anim = animations[Math.floor(Math.random() * animations.length)];
        // skip idle animations
        if (anim.indexOf('Idle') === 0) {
            return this.animate();
        }

        return this.play(anim);
    },

    /**************************** Utils ************************************/

    /***
     *
     * @param {Number} x
     * @param {Number} y
     * @return {String}
     * @private
     */
    _getDirection: function (x, y) {
        var offset = { top: this._el.offsetTop, left: this._el.offsetLeft };
        var h = this._el.clientHeight;
        var w = this._el.clientWidth;

        var centerX = (offset.left + w / 2);
        var centerY = (offset.top + h / 2);


        var a = centerY - y;
        var b = centerX - x;

        var r = Math.round((180 * Math.atan2(a, b)) / Math.PI);

        // Left and Right are for the character, not the screen :-/
        if (-45 <= r && r < 45) return 'Right';
        if (45 <= r && r < 135) return 'Up';
        if (135 <= r && r <= 180 || -180 <= r && r < -135) return 'Left';
        if (-135 <= r && r < -45) return 'Down';

        // sanity check
        return 'Top';
    },

    /**************************** Queue and Idle handling ************************************/
    /***
     * Handle empty queue.
     * We need to transition the animation to an idle state
     * @private
     */
    _onQueueEmpty: function () {
        if (this._el.hidden || this._isIdleAnimation()) return;

        var idleAnim = this._getIdleAnimation();
        this._idleDfd = new Promise((resolve) => {
            this._animator.showAnimation(idleAnim, ((name, state) => {
                if (state === clippy.Animator.States.EXITED) {
                    resolve();
                    this._idleDfd.state = 'resolved';
                }
            }).bind(this));
        });

        this._idleDfd.state = 'pending';
    },

    /***
     * Is the current animation is Idle?
     * @return {Boolean}
     * @private
     */
    _isIdleAnimation: function () {
        var c = this._animator.currentAnimationName;
        return c && c.indexOf('Idle') === 0;
    },

    /**
     * Gets a random Idle animation
     * @return {String}
     * @private
     */
    _getIdleAnimation: function () {
        var animations = this.animations();
        var r = [];
        for (var i = 0; i < animations.length; i++) {
            var a = animations[i];
            if (a.indexOf('Idle') === 0) {
                r.push(a);
            }
        }

        // pick one
        var idx = Math.floor(Math.random() * r.length);
        return r[idx];
    },

    /**************************** Events ************************************/

    _setupEvents: function () {
        addEventListener('resize', this.reposition.bind(this));

        this._el.addEventListener('mousedown', this._onMouseDown.bind(this));
        this._el.addEventListener('dblclick', this._onDoubleClick.bind(this));
    },

    _onDoubleClick: function () {
        if (!this.play('ClickedOn')) {
            this.animate();
        }
    },

    reposition: function () {
        if (this._el.hidden) return;

        var o = { left: this._el.offsetLeft, top: this._el.offsetTop };
        var bH = this._el.clientHeight;
        var bW = this._el.clientWidth;

        var wW = window.innerWidth;
        var wH = window.innerHeight;
        var sT = window.pageYOffset;
        var sL = window.pageYOffset;

        var top = o.top - sT;
        var left = o.left - sL;
        var m = 5;
        if (top - m < 0) {
            top = m;
        } else if ((top + bH + m) > wH) {
            top = wH - bH - m;
        }

        if (left - m < 0) {
            left = m;
        } else if (left + bW + m > wW) {
            left = wW - bW - m;
        }

        this._el.style.left = left + 'px';
        this._el.style.top = top + 'px';
        // reposition balloon
        this._balloon.reposition();
    },

    _onMouseDown: function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        this._startDrag(e);
    },

    /**************************** Drag ************************************/
    _startDrag: function (e) {
        // pause animations
        this.pause();
        this._balloon.hidden = true;
        this._offset = this._calculateClickOffset(e);

        this._moveHandle = this._dragMove.bind(this);
        this._upHandle = this._finishDrag.bind(this);

        addEventListener('mousemove', this._moveHandle);
        addEventListener('mouseup', this._upHandle);
        addEventListener('mouseleave', this._upHandle);

        this._dragUpdateLoop = setTimeout(this._updateLocation.bind(this), 10);
    },

    _calculateClickOffset: function (e) {
        var mouseX = e.pageX;
        var mouseY = e.pageY;
        var left = this._el.offsetLeft;
        var top = this._el.offsetTop;

        return {
            top: mouseY - top,
            left: mouseX - left
        }
    },

    _updateLocation: function () {
        this._el.style.top = this._targetY + 'px';
        this._el.style.left = this._targetX + 'px';
        this._dragUpdateLoop = setTimeout(this._updateLocation.bind(this), 10);
    },

    _dragMove: function (e) {
        e.preventDefault();
        var x = e.clientX - this._offset.left;
        var y = e.clientY - this._offset.top;
        this._targetX = x;
        this._targetY = y;
    },

    _finishDrag: function () {
        clearTimeout(this._dragUpdateLoop);
        // remove handles
        removeEventListener('mousemove', this._moveHandle);
        removeEventListener('mouseup', this._upHandle);
        removeEventListener('mouseleave', this._upHandle);

        // resume animations
        this._balloon.hidden = false;
        this.reposition();
        this.resume();

    },

    _addToQueue: function (func, scope) {
        if (scope) func = func.bind(scope);
        this._queue.queue(func);
    },

    /**************************** Pause and Resume ************************************/
    pause: function () {
        this._animator.pause();
        this._balloon.pause();

    },

    resume: function () {
        this._animator.resume();
        this._balloon.resume();
    }
};

function __animate(element, properties, duration, onComplete) {
    const animationSetup = ' ' + Number((duration / 1000).toFixed(2)) + 's linear';
    const transitionValue = [];
    const propertyKeys = Object.keys(properties);

    for (const key of propertyKeys) {
        transitionValue.push(key + animationSetup);
    }

    element.style.transition = transitionValue.join(',');

    for (const key of propertyKeys) {
        element.style[key] = properties[key];
    }

    setTimeout(function() {
        element.style.transition = 'none';
        if (onComplete) onComplete();
    }, duration);
}

})();