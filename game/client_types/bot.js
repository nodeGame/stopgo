/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2016 brenste <myemail>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var logic = gameRoom.node;

    var game;
    game = {};
    game.nodename = 'bot';

    stager.setDefaultCallback(function() {
        console.log('Stage: ' , this.getCurrentGameStage());
        this.node.timer.randomDone();
    });

    stager.extendStep('stoporgo', {
        cb: function() {
            var that;
            that = this;
            this.node.on.data('ROLE_RED', function(msg) {
                var randomDoneValue;

                this.role = 'red';
                this.worldState = msg.data;

                randomDoneValue = Math.floor(Math.random() * 2) ? 'stop':'go';
                that.node.done(randomDoneValue);
            });
            this.node.on.data('ROLE_BLUE', function(msg) {
                this.role = 'blue';
                this.node.on.data('redChoice', function(msg) {
                    debugger
                    that.redChoice = msg.data;
                    that.node.done();
                });
            });
        }
    });

    stager.extendStep('leftorright', {
        cb: function() {
            var randomDoneValue;
            debugger
            if (this.role === 'blue') {
                randomDoneValue = Math.floor(Math.random() * 2) ?
                    'right' : 'left';
                that.node.done(randomDoneValue);
            }
        }
    });

    game.plot = stager.getState();

    return game;
};
