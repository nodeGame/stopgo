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
        .next('instructions')
        .repeat('practice', settings.REPEAT_PRACTICE)
        .next('quiz')
        .repeat('game', settings.REPEAT)
        .next('end')
        .gameover();

    stager.extendStage('game', {
    	steps: [
    	    'stoporgo',
    	    'leftorright',
    	    'results'
    	]
    });

    // Modify the stager to skip one stage.
    // stager.skip('instructions');
    stager.skip('quiz');
    stager.skip('practice');

    return stager.getState();
};
