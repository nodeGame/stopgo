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
        var that;
        that = this;
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
                var chanceOfStop;

                chanceOfStop = (that.settings.botType === 'dynamic') && channel.numStopGoDecisions ?
                                channel.numChooseStop / channel.numStopGoDecisions : that.settings.chanceOfStop;

                that.role = 'red';
                that.worldState = msg.data;

                randomDoneValue = (getRandom(0, 1) <= chanceOfStop) ? 'stop':'go';
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
            var chanceOfRight;

            chanceOfRight = this.settings.botType === 'dynamic' && channel.numRightLeftDecisions ?
                            channel.numChooseRight / channel.numRightLeftDecisions : this.settings.chanceOfRight;

            if (this.role === 'blue') {
                randomDoneValue = (getRandom(0, 1) <= chanceOfRight)  ?
                    'right' : 'left';
                this.node.done(randomDoneValue);
            }
        }
    });

    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    game.plot = stager.getState();

    return game;
};
