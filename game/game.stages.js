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
        .repeat('tour', settings.TOUR.length) //
        .next('tour-end') // remind players that they are randomly assigned to blue/red
        .repeat('practice', settings.REPEAT_PRACTICE)
        .next('practice-end')
        .next('quiz')
        .repeat('game', settings.REPEAT)
        .next('end')
        .gameover();

    stager.extendStage('tour', {
    	steps: [
    	    'red-tour',
    	    'blue-tour',
            'results-tour'
    	]
    });

    stager.extendStage('game', {
    	steps: [
    	    'red-choice',
    	    'blue-choice',
    	    'results'
    	]
    });

    stager.extendStage('practice', {
    	steps: [
    	    'red-choice',
    	    'blue-choice',
    	    'results'
    	]
    });

    // Modify the stager to skip one stage.
    stager.skip('instructions')
    stager.skip('quiz');
    stager.skip('practice');
    // stager.skip('test');

    return stager.getState();
};
