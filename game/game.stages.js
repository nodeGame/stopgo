/**
 * # Game stages definition file
 * Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * Stages are defined using the stager API
 *
 * http://www.nodegame.org
 * ---
 */

module.exports = function(stager, settings) {

    stager
        .next('mood')
        .next('instructions')
        .next('choose-tutorial')
        .repeat('tutorial', settings.tutorial.length) //
        .next('tutorial-end')
        .gameover();

    stager.extendStage('tutorial', {
    	steps: [
    	    'red-choice-tutorial',
    	    'blue-choice-tutorial',
            'results-tutorial'
    	]
    });


    // Modify the stager to skip one stage.

    stager.skip('mood')
    // stager.skip('instructions');
    // stager.skip('choose-tutorial');
    // stager.skip('tutorial');
    // stager.skip('tutorial-end');
};
