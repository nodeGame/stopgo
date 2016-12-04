/**
* # Player type implementation of the game stages
* Copyright(c) 2016 brenste <myemail>
* MIT Licensed
*
* Each client type must extend / implement the stages defined in `game.stages`.
* Upon connection each client is assigned a client type and it is automatically
* setup with it.
*
* http://www.nodegame.org
* ---
*/

'use strict';

var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var constants = ngc.constants;
var publishLevels = constants.publishLevels;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var game;

    stager.setOnInit(function() {
        // cannot clean up my code into different files
        // initializeGame(node);
        // createPayoffTables(node);

        // Initialize the client.
        // Setup page: header + frame.
        var header = W.generateHeader();
        var frame = W.generateFrame();
        W.setHeaderPosition('top');

        var payoffTableA, payoffTableB;

        // Add widgets.
        this.visualRound = node.widgets.append('VisualRound', header);
        this.visualTimer = node.widgets.append('VisualTimer', header);
        this.runningTotalPayoff = node.widgets.append('MoneyTalks', header);
        this.runningTotalPayoff.init({currency: 'USD'});
        this.doneButton = node.widgets.append('DoneButton', header, {text: 'Done'});

        node.game.visualTimer.setToZero();

        // Add payoff tables
        node.game.totalPayoff = 0;
        var payoffs = node.game.settings.payoffs;

        payoffTableA = new W.Table();
        payoffTableA.addRow(['', 'Left', 'Right']);
        payoffTableA.addRow(['Red', payoffs.go.A.left.red, payoffs.go.A.right.red]);
        payoffTableA.addRow(['Blue', payoffs.go.A.left.blue, payoffs.go.A.right.blue]);

        payoffTableB = new W.Table();
        payoffTableB.addRow(['', 'Left', 'Right']);
        payoffTableB.addRow(['Red', payoffs.go.B.left.red, payoffs.go.B.right.red]);
        payoffTableB.addRow(['Blue', payoffs.go.B.left.blue, payoffs.go.B.right.blue]);

        var payoffStopRed = payoffs.stop.red;
        var payoffStopBlue = payoffs.stop.blue;

        node.game.payoffTable = {};
        node.game.payoffTable.A = W.addClass(payoffTableA.parse(), 'table table-bordered');
        node.game.payoffTable.B = W.addClass(payoffTableB.parse(), 'table table-bordered');
        node.game.payoffStopRed = payoffStopRed;
        node.game.payoffStopBlue = payoffStopBlue;

        // Additional debug information while developing the game.
        // this.debugInfo = node.widgets.append('DebugInfo', header)

        node.game.checkIsPracticeStage = function() {
            var practiceStageNumber = node.game.plot.normalizeGameStage('practice').stage;
            return node.game.getCurrentGameStage().stage === practiceStageNumber;
        };

    });

    stager.extendStep('instructions', {
        frame: 'instructions.htm',
        cb: function() {
            W.setInnerHTML('payoff-stop', node.game.payoffStopRed + ' ' + node.game.runningTotalPayoff.currency);
            W.getElementById('payoff-matrix-a').appendChild(node.game.payoffTable.A);
            W.getElementById('payoff-matrix-b').appendChild(node.game.payoffTable.B);
        }
    });

    stager.extendStep('red-choice', {
        roles: {
            RED: {
                frame: 'stopgostep.htm',
                cb: function() {

                }
            },
            BLUE: {
                frame: 'stopgostep.htm',
                cb: function() {

                }
            }
        }
    });



    stager.extendStep('blue-choice', {
        donebutton: false,
        role: function() { return this.role; },
        partner: function() { return this.partner; },
        roles: {
            RED: {
                cb: function() {
                    node.game.visualTimer.setToZero();
                }
            },
            BLUE: {
                cb: function() {
                    var buttonLeft, buttonRight;

                    W.show('make-blue-decision');
                    W.setInnerHTML('red-choice', node.game.redChoice === 'stop' ? 'STOP' : 'GO');
                    W.show('red-choice');

                    buttonLeft = W.getElementById('left');
                    buttonLeft.disabled = false;
                    buttonRight = W.getElementById('right');
                    buttonRight.disabled = false;

                    W.getElementById('payoff-matrix-a').appendChild(node.game.payoffTable.A);
                    W.getElementById('payoff-matrix-b').appendChild(node.game.payoffTable.B);

                    W.setInnerHTML('payoff-stop-blue', node.game.payoffStopBlue + ' ' + node.game.runningTotalPayoff.currency);

                    buttonLeft.onclick = function() {
                        node.done('LEFT');
                    };

                    buttonRight.onclick = function() {
                        node.done('RIGHT');
                    };

                    node.game.visualTimer.init({
                        milliseconds: node.game.settings.bidTime,
                        timeup: function() {
                            node.done(Math.floor(Math.random() * 2) ? 'LEFT':'RIGHT');
                        }
                    });

                    node.game.visualTimer.updateDisplay();
                    node.game.visualTimer.startTiming();

                }
            }
        },
        done: function() {
            var button;
            if (node.game.role === 'blue') {
                button = W.getElementById('left');
                button.disabled = true;
                button = W.getElementById('right');
                button.disabled = true;
            }
        }
    });

    stager.extendStep('results', {
        frame: 'results.htm',
        roles: {
            RED: {
                cb: function() {
                    node.on.data('RESULTS', function(message) {
                        var otherPlayer;
                        var otherPlayerChoice;

                        otherPlayer = 'BLUE';
                        otherPlayerChoice = message.data.choices.blue;

                        W.setInnerHTML('payoff', msg.data.blue + ' ' + node.game.runningTotalPayoff.currency);

                        W.setInnerHTML('player', node.game.role.charAt(0).toUpperCase() + node.game.role.slice(1));
                        W.addClass(W.getElementById('player'), node.game.role);
                        W.setInnerHTML('other-player', otherPlayer.charAt(0).toUpperCase() + otherPlayer.slice(1));
                        W.setInnerHTML('other-player-choice', otherPlayerChoice.toUpperCase());

                        node.game.visualTimer.init({
                            milliseconds: node.game.settings.bidTime,
                            timeup: function() {
                                node.done();
                            }
                        });

                        node.game.visualTimer.updateDisplay();
                        node.game.visualTimer.startTiming();
                    });
                }
            },
            BLUE: {
                cb: function() {
                    node.on.data('RESULTS', function(message) {
                        var otherPlayer;
                        var otherPlayerChoice;

                        otherPlayer = 'RED';
                        otherPlayerChoice = message.data.choices.red;

                        W.setInnerHTML('payoff', msg.data.blue + ' ' + node.game.runningTotalPayoff.currency);

                        W.setInnerHTML('player', node.game.role.charAt(0).toUpperCase() + node.game.role.slice(1));
                        W.addClass(W.getElementById('player'), node.game.role);
                        W.setInnerHTML('other-player', otherPlayer.charAt(0).toUpperCase() + otherPlayer.slice(1));
                        W.setInnerHTML('other-player-choice', otherPlayerChoice.toUpperCase());

                        node.game.visualTimer.init({
                            milliseconds: node.game.settings.bidTime,
                            timeup: function() {
                                node.done();
                            }
                        });

                        node.game.visualTimer.updateDisplay();
                        node.game.visualTimer.startTiming();
                    });
                }
            }
        }
    });

    stager.extendStep('end', {
        donebutton: false,
        frame: 'end.htm',
        cb: function() {
            node.game.visualTimer.setToZero();
            W.setInnerHTML('total', node.game.totalPayoff + ' ' + node.game.runningTotalPayoff.currency);
            node.game.totalPayoff = 0;
        },
        done: function() {
            node.game.runningTotalPayoff.money = 0;
            node.game.runningTotalPayoff.update(0);
        }
    });

    stager.extendStep('practice-end', {
        frame: 'practice-end.htm',
        cb: function() {
            node.game.visualTimer.setToZero();
            W.setInnerHTML('total', node.game.totalPayoff + ' ' + node.game.runningTotalPayoff.currency);
            node.game.totalPayoff = 0;
        },
        done: function() {
            node.game.runningTotalPayoff.money = 0;
            node.game.runningTotalPayoff.update(0);
        }
    });

    game = setup;
    game.plot = stager.getState();
    return game;
};
