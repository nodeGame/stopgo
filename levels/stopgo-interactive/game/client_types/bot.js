/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
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

    // var stager = ngc.getStager();

    stager.setDefaultCallback(function() {
        console.log('Stage:' , this.getCurrentGameStage());
        this.node.timer.randomDone();
    });
    
    stager.setOnInit(function() {
        var payoffs;
        var payoffTableA, payoffTableB;
        var redRowA, redRowB;
        var blueRowA, blueRowB;
        var tableClasses;

        var payoffStopRed, payoffStopBlue;

        // Add payoff tables.
        node.game.totalPayoff = 0;
        payoffs = node.game.settings.payoffs;

        payoffStopRed = payoffs.STOP.RED;
        payoffStopBlue = payoffs.STOP.BLUE;

        tableClasses = 'table table-bordered';

        this.payoffTables = {};

        this.playerRole = null;
        this.redChoice = null;
        this.blueChoice = null;
        this.worldState = null;
        this.totalPayment = 0;
    });

    stager.extendStep('red-choice', {
        roles: {
            RED: {
                cb: function() {
                    var decision;
                    var chanceOfStop;
                    var isDynamic;
                    var minDecisions;

                    minDecisions = this.settings.botChance.minDecisions;
                    isDynamic = (this.settings.botType === 'dynamic');

                    if (isDynamic && channel.numStopGoDecisions >= minDecisions) {
                        chanceOfStop = 
                            channel.numChooseStop / channel.numStopGoDecisions;
                    }
                    else {
                        chanceOfStop = this.settings.botChance.stop;
                    }

                    decision = (Math.random() <= chanceOfStop) ? 'STOP' : 'GO';

                    console.log('RED BOT:', node.player.id, ', partner: ',
                                this.partner, ', decision: ', decision);
                    this.node.timer.randomDone(4000, { redChoice: decision });
                }
            },
            BLUE: {
                cb: function() {
                    var decision, that;
                    that = this;
                    this.node.once.data('RED-CHOICE', function(msg) {
                        that.node.game.redChoice = msg.data;
                        that.node.timer.randomDone(2000);
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
                    this.node.once.data('BLUE-CHOICE', function(msg) {
                        that.node.game.blueChoice = msg.data;
                        that.node.timer.randomDone(2000);
                    });
                },
                // Blues times up first, and will send data.
                timeup: null
            },
            BLUE: {
                cb: function() {
                    var decision;
                    var isDynamic;
                    var chanceOfRight;
                    var minDecisions;

                    isDynamic = (this.settings.botType === 'dynamic');
                    minDecisions = this.settings.botChance.minDecisions;

                    if (isDynamic && channel.numRightLeftDecisions >= minDecisions) {
                        chanceOfRight =
                            channel.numChooseRight / channel.numRightLeftDecisions;
                    }
                    else {
                        chanceOfRight = this.settings.botChance.right;
                    }

                    decision = Math.random() > chanceOfRight ? 'LEFT' : 'RIGHT';
                    console.log('BLUE BOT:', node.player.id, ', partner: ',
                                this.partner, ', decision: ', decision);
                    this.node.timer.randomDone(4000, { blueChoice: decision });
                }
            }
        }
    });
};
