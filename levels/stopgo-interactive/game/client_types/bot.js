/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

var ngc = require('nodegame-client');

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var channel = gameRoom.channel;
    var node = gameRoom.node;

    var game;
    game = {};
    game.nodename = 'bot';

    // var stager = ngc.getStager();

    stager.setDefaultCallback(function() {
        var that;
        that = this;
        console.log('Stage: ' , that.getCurrentGameStage());
        node.timer.randomDone();
    });


    stager.setOnInit(function() {

        var payoffs;
        var payoffTableA, payoffTableB;
        var redRowA, redRowB;
        var blueRowA, blueRowB;
        var tableClasses;

        var payoffStopRed, payoffStopBlue;

        debugger

        // Add payoff tables
        node.game.totalPayoff = 0;
        payoffs = node.game.settings.payoffs;

        payoffStopRed = payoffs.STOP.RED;
        payoffStopBlue = payoffs.STOP.BLUE;

        tableClasses = 'table table-bordered';

        this.payoffTables = {};

        node.game.playerRole = null;
        node.game.redChoice = null;
        node.game.blueChoice = null;
        node.game.worldState = null;
        node.game.totalPayment = 0;

    });

    stager.extendStep('red-choice', {
        roles: {
            RED: {
                cb: function() {
                    var that;
                    that = this;
debugger
                    var randomDoneValue;
                    var chanceOfStop;
                    var isDynamic;

                    isDynamic = (that.settings.botType === 'dynamic');

                    if (isDynamic && channel.numStopGoDecisions >= 1) {
                        chanceOfStop = 
                            channel.numChooseStop / channel.numStopGoDecisions;
                    }
                    else {
                        chanceOfStop = that.settings.chanceOfStop;
                    }

                    randomDoneValue =
                        (getRandom(0, 1) <= chanceOfStop) ? 'STOP' : 'GO';

                    console.log('RED ROLE BOT:', node.player.id,
                                ', partner: ', that.partner);
                    console.log(randomDoneValue);

                    node.done(randomDoneValue);
                }
            },
            BLUE: {
                cb: function() {
                    var that;
                    that = this;
debugger
                    console.log('BLUE ROLE BOT:', node.player.id,
                                ', partner: ', that.partner);

                    node.once.data('RED-CHOICE', function() {
                        node.done();
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
debugger
                    node.once.data('BLUE-CHOICE', function() {
                        node.done();
                    });
                }
            },
            BLUE: {
                cb: function() {
                    var that;
                    var randomDoneValue;
                    var chanceOfRight;
                    var isDynamic;
debugger
                    that = this;
                    isDynamic = (that.settings.botType === 'dynamic');

                    if (isDynamic && channel.numRightLeftDecisions >= 1) {
                        chanceOfRight =
                            channel.numChooseRight/channel.numRightLeftDecisions;
                    }
                    else {
                        chanceOfRight = that.settings.chanceOfRight;
                    }

                    randomDoneValue = (getRandom(0, 1) <= chanceOfRight)  ?
                        'RIGHT' : 'LEFT';

                    node.done(randomDoneValue);
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
