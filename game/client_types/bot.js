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
        console.log('Stage: ' , that.getCurrentGameStage());
        that.node.timer.randomDone();
    });

    stager.extendStep('red-choice', {
        role: function() { return this.role; },
        partner: function() { return this.partner; },
        roles: {
            RED: {
                cb: function() {
                    var that;
                    that = this;

                    var randomDoneValue;
                    var chanceOfStop;
                    var isDynamic;

                    isDynamic = (that.settings.botType === 'dynamic');

                    if (isDynamic && channel.numStopGoDecisions >= 1) {
                        chanceOfStop = channel.numChooseStop / channel.numStopGoDecisions;
                    }
                    else {
                        chanceOfStop = that.settings.chanceOfStop;
                    }

                    randomDoneValue = (getRandom(0, 1) <= chanceOfStop) ? 'STOP' : 'GO';
                    that.node.done(randomDoneValue);
                }
            },
            BLUE: {
                cb: function() {
                    var that;
                    that = this;

                    that.node.once.data('RED-CHOICE', function() {
                        that.node.done();
                    });
                }
            }
        }
    });

    stager.extendStep('blue-choice', {
        role: function() { return this.role; },
        partner: function() { return this.partner; },
        roles: {
            RED: {
                cb: function() {
                    var that;
                    that = this;

                    that.node.once.data('BLUE-CHOICE', function() {
                        that.node.done();
                    });
                }
            },
            BLUE: {
                cb: function() {
                    var that;
                    var randomDoneValue;
                    var chanceOfRight;
                    var isDynamic;

                    that = this;
                    isDynamic = (that.settings.botType === 'dynamic');

                    if (isDynamic && channel.numRightLeftDecisions >= 1) {
                        chanceOfRight = channel.numChooseRight / channel.numRightLeftDecisions;
                    }
                    else {
                        chanceOfRight = that.settings.chanceOfRight;
                    }

                    randomDoneValue = (getRandom(0, 1) <= chanceOfRight)  ?
                                      'RIGHT' : 'LEFT';

                    that.node.done(randomDoneValue);
                }
            }
        }
    });

    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    game.plot = stager.getState();

    return game;
};
