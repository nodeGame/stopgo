/**
 * # Game stages definition file
 * Copyright(c) 2016 brenste <myemail>
 * MIT Licensed
 *
 * Stages are defined using the stager API
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(stager, settings) {

    stager
        .next('instructions-light')
        .repeat('game', settings.REPEAT)
        .next('end')
        .gameover();

    stager.extendStage('game', {
    	steps: [
    	    'red-choice',
    	    'blue-choice',
    	    'results'
    	]
    });

    return stager.getState();
};
