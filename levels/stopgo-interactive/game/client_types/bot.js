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

module.exports = function(treatmentName, settings, stager,
                          setup, gameRoom, node) {

    var channel = gameRoom.channel;
    var logic = gameRoom.node;
    var node;

    var game;
    game = {};
    game.nodename = 'bot';

    // var stager = ngc.getStager();

    stager.setDefaultCallback(function() {
        console.log('Stage: ' , this.getCurrentGameStage());
        node.timer.randomDone();
    });

    stager.setOnInit(function() {
        var payoffs;
        var payoffTableA, payoffTableB;
        var redRowA, redRowB;
        var blueRowA, blueRowB;
        var tableClasses;

        var payoffStopRed, payoffStopBlue;

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
                    var decision;
                    var chanceOfStop;
                    var isDynamic;

                    isDynamic = (this.settings.botType === 'dynamic');

                    if (isDynamic && channel.numStopGoDecisions >= 1) {
                        chanceOfStop = channel.numChooseStop
                                       / channel.numStopGoDecisions;
                    }
                    else {
                        chanceOfStop = this.settings.chanceOfStop;
                    }

                    decision = (Math.random() <= chanceOfStop) ? 'STOP' : 'GO';

                    console.log('BLUE BOT:', node.player.id, ', partner: ',
                                this.partner, ', decision: ', decision);
                    node.done({ blueChoice: decision });
                }
            },
            BLUE: {
                cb: function() {
                    var decision;
                    node.once.data('RED-CHOICE', function(msg) {
                        node.game.redChoice = msg.data;
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
                    node.once.data('BLUE-CHOICE', function(msg) {
                        node.game.blueChoice = msg.data;
                        node.done();
                    });
                }
            },
            BLUE: {
                cb: function() {
                    var decision;
                    var isDynamic;
                    var chanceOfRight;

                    isDynamic = (this.settings.botType === 'dynamic');

                    if (isDynamic && channel.numRightLeftDecisions >= 1) {
                        chanceOfRight = channel.numChooseRight
                                       / channel.numRightLeftDecisions;
                    }
                    else {
                        chanceOfRight = 0.5;
                    }

                    decision = Math.random() > chanceOfRight ? 'LEFT' : 'RIGHT';
                    console.log('BLUE BOT:', node.player.id, ', partner: ',
                                this.partner, ', decision: ', decision);
                    node.done({ blueChoice: decision });
                }
            }
        }
    });

    game.plot = stager.getState();

    return game;
};
