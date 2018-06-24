Please read before you move on
=========
* This repo is just a fork of the fantastic work done by https://github.com/smore-inc.
* The original implementation can be found here: https://github.com/smore-inc/clippy.js/.
* This is an experiment to remove the dependency on JQuery and some other small adjustments.
* The code only targets ES6-capable browsers. Tested on Mac in Chrome, Safari and Firefox.


Build
------------
1. Install [Yarn](https://yarnpkg.com/lang/en/)
2. Run `yarn` from the location where you cloned this repo to install the local dependencies
3. Run `yarn add gulp-cli -g` to install Gulp-CLI globally
4. Run `gulp` to build the project

Local test
------------
1. Run `yarn global add http-server` to install a basic NodeJS-based webserver
2. Run `http-server` from the location where you cloned this repo.
3. Open your browser and load `http://localhost:8080/buid/sample.html`



[Clippy.JS](http://smore.com/clippy-js)
=========
Add Clippy or his friends to any website for instant nostalgia.
Read more about the project on [our homepage](http://smore.com/clippy-js).


Usage: Setup
------------
Add this code to you to your page to enable Clippy.js.

```html
<!-- Add the stylesheet to the head -->
<link rel="stylesheet" type="text/css" href="clippy.css" media="all">

...

<!-- Add these scripts to  the bottom of the page -->
<!-- jQuery 1.7+ -->
<script src="jquery.1.7.min.js"></script>

<!-- Clippy.js -->
<script src="clippy.min.js"></script>

<!-- Init script -->
<script type="text/javascript">
    clippy.load('Merlin', function(agent){
        // do anything with the loaded agent
        agent.show();
    });
</script>

```

Usage: Actions
--------------
All the agent actions are queued and executed by order, so you could stack them.

```javascript
// play a given animation
agent.play('Searching');

// play a random animation
agent.animate();

// get a list of all the animations
agent.animations();
// => ["MoveLeft", "Congratulate", "Hide", "Pleased", "Acknowledge", ...]

// Show text balloon
agent.speak('When all else fails, bind some paper together. My name is Clippy.');

// move to the given point, use animation if available
agent.moveTo(100,100);

// gesture at a given point (if gesture animation is available)
agent.gestureAt(200,200);

// stop the current action in the queue
agent.stopCurrent();

// stop all actions in the queue and go back to idle mode
agent.stop();
```

Special Thanks
--------------
* The awesome [Cinnamon Software](http://www.cinnamonsoftware.com/) for developing [Double Agent](http://doubleagent.sourceforge.net/)
the program we used to unpack Clippy and his friends!
* Microsoft, for creating clippy :)
