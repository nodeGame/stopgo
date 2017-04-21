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
        .next('choose-tutorial') // choose blue/red
        .repeat('tutorial', settings.tutorial.length) //
        .next('tutorial-end') // remind players that they are randomly assigned to blue/red
        // .repeat('practice', settings.REPEAT_PRACTICE)
        // .next('practice-end')
        .gameover();

    stager.extendStage('tutorial', {
    	steps: [
    	    'red-choice-tutorial',
    	    'blue-choice-tutorial',
            'results-tutorial'
    	]
    });

    // stager.skip('instructions');
    stager.skip('choose-tutorial');
    stager.skip('tutorial');

    // Modify the stager to skip one stage.
    // stager.skip('quiz');
    // stager.skip('practice');
    // stager.skip('practice-end');
    // stager.skip('tutorial-end');
    // stager.skip('test');

    return stager.getState();
};
