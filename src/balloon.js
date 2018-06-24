/******
 *
 *
 * @constructor
 */
clippy.Balloon = function (targetEl) {
    this._targetEl = targetEl;
    this._setup();
};

clippy.Balloon.prototype = {

    TIME_PER_LETTER: 300,
    CLOSE_BALLOON_DELAY: 2000,

    _setup: function () {

        this._balloon = document.createElement('div');
        this._balloon.className = 'clippy-balloon';
        this._balloon.hidden = true;

        let clippyTip = document.createElement('div');
        clippyTip.className = 'clippy-tip';

        this._content = document.createElement('div');
        this._content.className = 'clippy-content';

        this._balloon.appendChild(clippyTip);
        this._balloon.appendChild(this._content);

        document.body.appendChild(this._balloon);
    },

    reposition: function () {
        var sides = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

        for (var i = 0; i < sides.length; i++) {
            var s = sides[i];
            this._position(s);
            if (!this._isOut()) break;
        }
    },

    _BALLOON_MARGIN: 15,

    /***
     *
     * @param side
     * @private
     */
    _position: function (side) {
        var o = { left: this._targetEl.offsetLeft, top: this._targetEl.offsetTop };
        var h = this._targetEl.clientHeight;
        var w = this._targetEl.clientWidth;
        o.top -= window.pageYOffset;
        o.left -= window.pageXOffset;

        var bH = this._balloon.clientHeight;
        var bW = this._balloon.clientWidth;

        this._balloon.classList.remove('clippy-top-left');
        this._balloon.classList.remove('clippy-top-right');
        this._balloon.classList.remove('clippy-bottom-right');
        this._balloon.classList.remove('clippy-bottom-left');

        var left, top;
        switch (side) {
            case 'top-left':
                // right side of the balloon next to the right side of the agent
                left = o.left + w - bW;
                top = o.top - bH - this._BALLOON_MARGIN;
                break;
            case 'top-right':
                // left side of the balloon next to the left side of the agent
                left = o.left;
                top = o.top - bH - this._BALLOON_MARGIN;
                break;
            case 'bottom-right':
                // right side of the balloon next to the right side of the agent
                left = o.left;
                top = o.top + h + this._BALLOON_MARGIN;
                break;
            case 'bottom-left':
                // left side of the balloon next to the left side of the agent
                left = o.left + w - bW;
                top = o.top + h + this._BALLOON_MARGIN;
                break;
        }

        this._balloon.style.top = top + 'px';
        this._balloon.style.left = left + 'px';
        this._balloon.classList.add('clippy-' + side);
    },

    _isOut: function () {
        var o = { left: this._balloon.offsetLeft, top: this._balloon.offsetTop };
        var bH = this._balloon.offsetHeight;
        var bW = this._balloon.offsetWidth;

        var wW = window.innerWidth;
        var wH = window.innerHeight;
        var sT = window.pageYOffset;
        var sL = window.pageXOffset;

        var top = o.top - sT;
        var left = o.left - sL;
        var m = 5;
        if (top - m < 0 || left - m < 0) return true;
        if ((top + bH + m) > wH || (left + bW + m) > wW) return true;

        return false;
    },

    speak: function (complete, text, hold) {
        this._balloon.hidden = false;
        var c = this._content;
        // set height to auto
        c.style.height = 'auto';
        c.style.width = 'auto';

        // add the text
        c.innerText = text;

        // set height
        c.style.height = c.clientHeight + 'px';;
        c.style.width = c.clientWidth + 'px';
        c.innerText = '';

        this.reposition();

        this._complete = complete;
        this._sayWords(text, hold, complete);
    },

    show: function () {
        this._balloon.hidden = false;
    },

    hide: function (fast) {
        if (fast) {
            this._balloon.hidden = true;
            return;
        }

        this._hiding = setTimeout(this._finishHideBalloon.bind(this), this.CLOSE_BALLOON_DELAY);
    },

    _finishHideBalloon: function () {
        if (this._active) return;
        this._balloon.hidden = true;
        this._hiding = null;
    },

    _sayWords: function (text, hold, complete) {
        this._active = true;
        this._hold = hold;
        var words = text.split(/[^\S-]/);
        var time = text.length * this.TIME_PER_LETTER;
        var el = this._content;
        var idx = 1;


        this._addWord = (function () {
            if (!this._active) return;
            if (idx > words.length) {
                delete this._addWord;
                this._active = false;
                if (!this._hold) {
                    complete();
                    this._balloon.hidden = true;
                }
            } else {
                el.innerText = words.slice(0, idx).join(' ');
                idx++;
                this._loop = setTimeout(this._addWord.bind(this), time);
            }
        }).bind(this);

        this._addWord();
    },

    close: function () {
        if (this._active) {
            this._hold = false;
        } else if (this._hold) {
            this._complete();
        }
    },

    pause: function () {
        clearTimeout(this._loop);
        if (this._hiding) {
            clearTimeout(this._hiding);
            this._hiding = null;
        }
    },

    resume: function () {
        if (this._addWord) {
            this._addWord();
        } else if (!this._hold && !this._balloon.hidden) {
            this._hiding = setTimeout(this._finishHideBalloon.bind(this), this.CLOSE_BALLOON_DELAY);
        }
    }
};
