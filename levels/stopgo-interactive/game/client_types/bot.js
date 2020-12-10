/**
 * # Bot type implementation of the game stages
 * Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

const ngc = require('nodegame-client');

module.exports = function(treatmentName, settings, stager,
                          setup, gameRoom, node) {

    let channel = gameRoom.channel;
    let logic = gameRoom.node;

    // var stager = ngc.getStager();

    stager.setDefaultCallback(function() {
        console.log('Stage:' , this.getCurrentGameStage());
        node.timer.random.done();
    });

    stager.setOnInit(function() {
        // var payoffTableA, payoffTableB;
        // var redRowA, redRowB;
        // var blueRowA, blueRowB;
        // var tableClasses;
        //
        // var payoffStopRed, payoffStopBlue;
        // Add payoff tables.
        // let payoffs = node.game.settings.payoffs;
        //
        // payoffStopRed = payoffs.STOP.RED;
        // payoffStopBlue = payoffs.STOP.BLUE;
        //
        // tableClasses = 'table table-bordered';

        node.game.totalPayoff = 0;

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

                    let minDecisions = this.settings.botChance.minDecisions;
                    let isDynamic = (this.settings.botType === 'dynamic');

                    let chanceOfStop;
                    if (isDynamic &&
                        channel.numStopGoDecisions >= minDecisions) {

                        chanceOfStop =
                            channel.numChooseStop / channel.numStopGoDecisions;
                    }
                    else {
                        chanceOfStop = this.settings.botChance.stop;
                    }

                    let decision = (Math.random() <= chanceOfStop) ?
                                   'STOP' : 'GO';

                    console.log('RED BOT:', node.player.id, ', partner: ',
                                this.partner, ', decision: ', decision);
                    node.timer.random(4000).done({ redChoice: decision });
                }
            },
            BLUE: {
                cb: function() {
                    node.once.data('RED-CHOICE', function(msg) {
                        node.game.redChoice = msg.data;
                        node.timer.random(2000).done();
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
                        node.timer.random(2000).done();
                    });
                },
                // Blues times up first, and will send data.
                timeup: null
            },
            BLUE: {
                cb: function() {
                    let isDynamic = (this.settings.botType === 'dynamic');
                    let minDecisions = this.settings.botChance.minDecisions;

                    let chanceOfRight;
                    if (isDynamic &&
                        channel.numRightLeftDecisions >= minDecisions) {

                        chanceOfRight =
                            channel.numChooseRight / channel.numRightLeftDecisions;
                    }
                    else {
                        chanceOfRight = this.settings.botChance.right;
                    }

                    let decision = Math.random() > chanceOfRight ?
                                  'LEFT' : 'RIGHT';
                    console.log('BLUE BOT:', node.player.id, ', partner: ',
                                this.partner, ', decision: ', decision);
                    node.timer.random(4000).done({ blueChoice: decision });
                }
            }
        }
    });
};
