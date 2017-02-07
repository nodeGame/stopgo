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
        .next('choose-tour') // choose blue/red
        .repeat('tour', settings.tour.length) //
        .next('tour-end') // remind players that they are randomly assigned to blue/red
        // .repeat('practice', settings.REPEAT_PRACTICE)
        // .next('practice-end')
        .gameover();

    stager.extendStage('tour', {
    	steps: [
    	    'red-choice-tour',
    	    'blue-choice-tour',
          'results-tour'
    	]
    });


    // stager.extendStage('practice', {
    // 	steps: [
    // 	    'red-choice',
    // 	    'blue-choice',
    // 	    'results'
    // 	]
    // });

    // Modify the stager to skip one stage.
    // stager.skip('instructions')
    // stager.skip('quiz');
    // stager.skip('practice');
    // stager.skip('practice-end');
    // stager.skip('choose-tour');
    // stager.skip('tour');
    // stager.skip('tour-end');
    // stager.skip('test');

    return stager.getState();
};
