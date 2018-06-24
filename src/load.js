clippy.BASE_PATH = './agents/';
(() => {
clippy.load = function (name, successCb, failCb) {
    const path = clippy.BASE_PATH + name;

    const mapDfd = clippy.load._loadMap(path);
    const agentDfd = clippy.load._loadAgent(name, path);
    const soundsDfd = clippy.load._loadSounds(name, path);

    let data;
    agentDfd.then(function (d) {
        data = d;
    });

    let sounds;
    soundsDfd.then(function (d) {
        sounds = d;
    });

    // wrapper to the success callback
    const cb = function () {
        successCb(new clippy.Agent(path, data, sounds));
    };

    Promise.all([mapDfd, agentDfd, soundsDfd]).then(cb).catch(failCb);
};

clippy.load._maps = {};
clippy.load._loadMap = function (path) {
    let dfd = clippy.load._maps[path];
    if (dfd) return dfd;

    // set dfd if not defined
    dfd = clippy.load._maps[path] = Deferred();

    const src = path + '/map.png';
    const img = new Image();

    img.onload = dfd.resolve;
    img.onerror = dfd.reject;
    img.setAttribute('src', src);

    return dfd;
};

clippy.load._sounds = {};

clippy.load._loadSounds = function (name, path) {
    let dfd = clippy.load._sounds[name];
    if (dfd) return dfd;

    // set dfd if not defined
    dfd = clippy.load._sounds[name] = Deferred();

    const audio = document.createElement('audio');
    const canPlayMp3 = !!audio.canPlayType && '' != audio.canPlayType('audio/mpeg');
    const canPlayOgg = !!audio.canPlayType && '' != audio.canPlayType('audio/ogg; codecs="vorbis"');

    if (!canPlayMp3 && !canPlayOgg) {
        dfd.resolve({});
    } else {
        const src = path + (canPlayMp3 ? '/sounds-mp3.js' : '/sounds-ogg.js');
        clippy.load._loadScript(src);
    }

    return dfd;
};


clippy.load._data = {};
clippy.load._loadAgent = function (name, path) {
    let dfd = clippy.load._data[name];
    if (dfd) return dfd;

    dfd = clippy.load._getAgentDfd(name);

    const src = path + '/agent.js';
    clippy.load._loadScript(src);

    return dfd;
};

clippy.load._loadScript = function (src) {
    const script = document.createElement('script');
    script.setAttribute('src', src);
    script.setAttribute('async', 'async');
    script.setAttribute('type', 'text/javascript');

    document.head.appendChild(script);
};

clippy.load._getAgentDfd = function (name) {
    let dfd = clippy.load._data[name];
    if (!dfd) {
        dfd = clippy.load._data[name] = Deferred();
    }

    return dfd;
};

clippy.ready = function (name, data) {
    clippy.load._getAgentDfd(name).resolve(data);
};

clippy.soundsReady = function (name, data) {
    const dfd = clippy.load._sounds[name];
    if (!dfd) {
        clippy.load._sounds[name] = Promise.resolve(data);
    }

    dfd.resolve(data);
};

// Pseudo-compatibility with JQuery.Deferred
function Deferred() {
    let _reject, _resolve;

    const p = new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
    });

    // I know, I know...
    p.resolve = _resolve;
    p.reject = _reject;

    return p;
}

})();