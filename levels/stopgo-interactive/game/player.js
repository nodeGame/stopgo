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
        // Initialize the client.
        // Setup page: header + frame.
        var header = W.generateHeader();
        var frame = W.generateFrame();
        W.setHeaderPosition('top');

        var payoffTableA, payoffTableB;

        // Add widgets.
        this.visualRound = node.widgets.append('VisualRound', header);
        node.game.visualTimer = node.widgets.append('VisualTimer', header);
        this.runningTotalPayoff = node.widgets.append('MoneyTalks', header);
        this.runningTotalPayoff.init({currency: 'USD'});
        this.doneButton = node.widgets.append('DoneButton', header, {text: 'Done'});

        node.game.visualTimer.setToZero();

        // node.player.stage.round

        // Add payoff tables
        node.game.totalPayoff = 0;
        var payoffs = node.game.settings.payoffs;

        payoffTableA = new W.Table();
        payoffTableA.addRow(['', 'Left', 'Right']);
        payoffTableA.addRow(['Red', payoffs.GO.A.LEFT.RED, payoffs.GO.A.RIGHT.RED]);
        payoffTableA.addRow(['Blue', payoffs.GO.A.LEFT.BLUE, payoffs.GO.A.RIGHT.BLUE]);

        payoffTableB = new W.Table();
        payoffTableB.addRow(['', 'Left', 'Right']);
        payoffTableB.addRow(['Red', payoffs.GO.B.LEFT.RED, payoffs.GO.B.RIGHT.RED]);
        payoffTableB.addRow(['Blue', payoffs.GO.B.LEFT.BLUE, payoffs.GO.B.RIGHT.BLUE]);

        var payoffStopRed = payoffs.STOP.RED;
        var payoffStopBlue = payoffs.STOP.BLUE;

        node.game.payoffTables = {};
        node.game.payoffTables.A = W.addClass(payoffTableA.parse(), 'table table-bordered');
        node.game.payoffTables.B = W.addClass(payoffTableB.parse(), 'table table-bordered');
        node.game.payoffStopRed = payoffStopRed;
        node.game.payoffStopBlue = payoffStopBlue;

        // Additional debug information while developing the game.
        // this.debugInfo = node.widgets.append('DebugInfo', header)

        // only needed for practice
        // node.game.practiceStageNumber = node.game.plot.normalizeGameStage('practice').stage;

        node.game.checkIsPracticeStage = function() {
            return node.game.getCurrentGameStage().stage === node.game.practiceStageNumber;
        };

        node.game.tourRole = '';
    });

    stager.extendStep('instructions', {
        frame: 'instructions.htm',
        cb: function() {
            W.setInnerHTML('payoff-stop', node.game.payoffStopRed + ' ' + node.game.runningTotalPayoff.currency);
            W.getElementById('payoff-matrix-a').appendChild(node.game.payoffTables.A);
            W.getElementById('payoff-matrix-b').appendChild(node.game.payoffTables.B);
        }
    });

    stager.extendStep('red-choice', {
        donebutton: false,
        frame: 'stopgostep.htm', // change this name
        // role: function() { return this.role; },
        // partner: function() { return this.partner; },
        init: function() {
            node.game.redChoice = null;
        },
        roles: {
            RED: {
                done: function(choice) {
                    var button;

                    button = W.getElementById('stop');
                    button.disabled = true;

                    button = W.getElementById('go');
                    button.disabled = true;

                    W.show('waiting_for_blue');
                    W.setInnerHTML('red-decision', 'Your choice: ' + choice);
                },
                cb: function() {
                    var buttonStop, buttonGo, payoffTableDiv1;
                    var startTimer;

                    if (node.game.checkIsPracticeStage()) {
                        W.setInnerHTML('info', 'This is a practice stage.');
                        W.show('info');
                    }

                    node.on.data('TABLE', function(message) {
                        node.game.worldState = message.data;

                        W.getElementById('payoff-table').appendChild(node.game.payoffTables[node.game.worldState]);
                        W.show('red');
                        // Write state of the world.
                        W.setInnerHTML('state_of_world', node.game.worldState);

                        // assumes same Stop payoff
                        W.setInnerHTML('payoff-stop', node.game.payoffStopRed + ' ' + node.game.runningTotalPayoff.currency);

                        buttonStop = W.getElementById('stop');
                        buttonStop.disabled = false;
                        buttonGo = W.getElementById('go');
                        buttonGo.disabled = false;

                        buttonStop.onclick = function() {
                            node.done('STOP');
                        };

                        buttonGo.onclick = function() {
                            node.done('GO');
                        };

                        // Keep this comments for the moment!

                        // ISSUE.
                        //
                        // Loading the frame for the step is async.
                        // Then the step cb (this function) is executed.
                        //
                        // The TABLE message might arrive BEFORE or AFTER
                        // the frame has finished loading.
                        //
                        // CASE A:
                        // If it arrives BEFORE, it is actually unbuffered
                        // and emitted right before emitting PLAYING.
                        //
                        // When playing is emitted VisualTimer reads the options
                        // from the step and tries to configure itself.
                        //
                        // With the version of VisualTimer in the last git pull,
                        // if there are no options, VisualTimer sets itself to 0
                        // (regardless of the state of the timer), so it was
                        // killing the timer started in the TABLE cb (here).
                        // Now this is fixed, and if a timer is running is not
                        // stopped.
                        //
                        // CASE B:
                        // If it arrives AFTER the frame is loaded,
                        // PLAYING has already been emitted. In this
                        // case the code would have worked fine. BUT the
                        // measurament of the time spent on the step is not
                        // precise. Time passed starts from PLAYING until DONE,
                        // however here PLAYING is called before the full
                        // interface is loaded (after TABLE is emitted).

                        // Alternative solution for timer issue.
                        // Instead of adding a timer property to step.

                        // return;
                        // Setup the timer.

                        startTimer = function() {
                            node.game.visualTimer.init({
                                milliseconds: node.game.settings.bidTime,
                                timeup: function() {
                                    node.done(Math.floor(Math.random() * 2) ? 'STOP':'GO');
                                }
                            });
                            node.game.visualTimer.start();
                        };

                        if (node.game.getStageLevel() ===
                            node.constants.stageLevels.PLAYING) {

                            startTimer();
                        }
                        else {
                            node.once('PLAYING', function() {
                                startTimer();
                            });
                        }

                    });
                }
            },
            BLUE: {
                cb: function() {
                    if (node.game.checkIsPracticeStage()) {
                        W.setInnerHTML('info', 'This is a practice stage.');
                        W.show('info');
                    }

                    var span;

                    W.show('blue');

                    // Make the observer display visible.

                    node.on.data('RED-CHOICE', function(msg) {
                        node.game.redChoice = msg.data;

                        W.show('make-blue-decision');
                        W.hide('awaiting-red-decision');
                        node.done();
                    });
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

                    node.on.data('BLUE-CHOICE', function(message) {
                        node.done();
                    });
                }
            },
            BLUE: {
                timer: {
                    milliseconds: settings.bidTime,
                    timeup: function() {
                        node.done(Math.floor(Math.random() * 2) ? 'LEFT' : 'RIGHT');
                    }
                },
                done: function() {
                    var button;
                    button = W.getElementById('left');
                    button.disabled = true;
                    button = W.getElementById('right');
                    button.disabled = true;
                },
                cb: function() {
                    var buttonLeft, buttonRight;
                    var startTimer;

                    W.show('make-blue-decision');
                    W.setInnerHTML('red-choice', node.game.redChoice === 'STOP' ? 'STOP' : 'GO');
                    W.show('red-choice');

                    buttonLeft = W.getElementById('left');
                    buttonLeft.disabled = false;

                    buttonRight = W.getElementById('right');
                    buttonRight.disabled = false;

                    W.getElementById('payoff-matrix-a').appendChild(node.game.payoffTables.A);
                    W.getElementById('payoff-matrix-b').appendChild(node.game.payoffTables.B);

                    W.setInnerHTML('payoff-stop-blue', node.game.payoffStopBlue + ' ' + node.game.runningTotalPayoff.currency);

                    buttonLeft.onclick = function() {
                        node.done('LEFT');
                    };

                    buttonRight.onclick = function() {
                        node.done('RIGHT');
                    };
                }
            }
        }
    });

    stager.extendStep('results', {
        frame: 'results.htm',
        role: function() { return this.role; },
        partner: function() { return this.partner; },
        roles: {
            RED: {
                timer: {
                    milliseconds: settings.bidTime,
                    timeup: function() {
                        node.done();
                    }
                },
                cb: function() {
                    if (node.game.checkIsPracticeStage()) {
                        W.setInnerHTML('info', 'This is a practice stage.');
                        W.show('info');
                    }

                    node.on.data('RESULTS', function(message) {
                        var otherPlayer;
                        var otherPlayerChoice;

                        otherPlayer = 'BLUE';
                        otherPlayerChoice = message.data.choices.BLUE;

                        node.game.runningTotalPayoff.update(message.data.payoffs.RED);
                        node.game.totalPayoff += message.data.payoffs.RED;

                        W.setInnerHTML('payoff', message.data.payoffs.RED + ' ' + node.game.runningTotalPayoff.currency);

                        W.setInnerHTML('player', node.game.role.charAt(0).toUpperCase() + node.game.role.slice(1));
                        W.addClass(W.getElementById('player'), 'red');
                        W.setInnerHTML('other-player', otherPlayer.charAt(0).toUpperCase() + otherPlayer.slice(1));
                        W.setInnerHTML('other-player-choice', otherPlayerChoice.toUpperCase());
                    });
                }
            },
            BLUE: {
                timer: {
                    milliseconds: settings.bidTime,
                    timeup: function() {
                        node.done();
                    }
                },
                cb: function() {
                    if (node.game.checkIsPracticeStage()) {
                        W.setInnerHTML('info', 'This is a practice stage.');
                        W.show('info');
                    }

                    node.once.data('RESULTS', function(message) {
                        var otherPlayer;
                        var otherPlayerChoice;

                        otherPlayer = 'RED';
                        otherPlayerChoice = message.data.choices.RED;

                        node.game.runningTotalPayoff.update(message.data.payoffs.BLUE);
                        node.game.totalPayoff += message.data.payoffs.BLUE;

                        W.setInnerHTML('payoff', message.data.payoffs.BLUE + ' ' + node.game.runningTotalPayoff.currency);

                        W.setInnerHTML('player', node.game.role.charAt(0).toUpperCase() + node.game.role.slice(1));
                        W.addClass(W.getElementById('player'), 'blue');
                        W.setInnerHTML('other-player', otherPlayer.charAt(0).toUpperCase() + otherPlayer.slice(1));
                        W.setInnerHTML('other-player-choice', otherPlayerChoice.toUpperCase());
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
        timer: {
            milliseconds: settings.bidTime,
            timeup: function() {
                node.done();
            }
        },
        cb: function() {
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
