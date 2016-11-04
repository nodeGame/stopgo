/**
 * # Bot type implementation of the game stages
 * Copyright(c) {YEAR} {AUTHOR} <{AUTHOR_EMAIL}>
 * MIT Licensed
 *
 * Handles automatic play.
 *
 * http://www.nodegame.org
 */

 var ngc =  require('nodegame-client');

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var node = gameRoom.node;

    var game, stager;

    game = gameRoom.getClientType('player');
    game.env.auto = true;
    game.nodename = 'autoplay';

    stager = ngc.getStager(game.plot);

    stager.extendAllSteps(function(o) {
        o._cb = o.cb;
        o.cb = function() {
            var _cb, stepObj, id;
            stepObj = this.getCurrentStepObj();
            // Invoking original callback.
            _cb = stepObj._cb;
            _cb.call(this);

            id = stepObj.id

            // TODO: Adapt to specific steps.
            if (id === 'stoporgo') {
              node.on.data('ROLE_RED', function() {
                var randomButtonId = Math.floor(Math.random() * 2) ? 'stop':'go';
                W.getElementById(randomButtonId).click();
              });
            }
            else if (id === 'leftorright') {
              if (node.game.role === 'blue') {
                var randomButtonId = Math.floor(Math.random() * 2) ? 'left':'right';
                W.getElementById(randomButtonId).click();
              }
            }
            else {
              node.timer.randomDone(2000);
            }



        };
        return o;
    });

    game.plot = stager.getState();

    return game;
};
