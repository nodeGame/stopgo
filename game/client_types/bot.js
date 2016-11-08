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
        init: function() {
            this.role = 'abba';
            this.worldState = null;
        },
        cb: function() {
            var that;
            that = this;
            this.node.on.data('ROLE_RED', function(msg) {
                var randomDoneValue;
                that.role = 'red';
                that.worldState = msg.data;

                randomDoneValue = Math.floor(Math.random() * 2) ? 'stop':'go';
                that.node.done(randomDoneValue);
            });
            this.node.on.data('ROLE_BLUE', function(msg) {
                that.role = 'blue';
                that.node.on.data('redChoice', function(msg) {
                    that.redChoice = msg.data;
                    that.node.done();
                });
            });
        }
    });

    stager.extendStep('leftorright', {
        cb: function() {
            var randomDoneValue;
            if (this.role === 'blue') {
                randomDoneValue = Math.floor(Math.random() * 2) ?
                    'right' : 'left';
                this.node.done(randomDoneValue);
            }
        }
    });

    game.plot = stager.getState();

    return game;
};
