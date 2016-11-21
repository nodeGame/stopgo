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

        // Add widgets.
        this.visualRound = node.widgets.append('VisualRound', header);
        this.visualTimer = node.widgets.append('VisualTimer', header);
        this.runningTotalPayoff = node.widgets.append('MoneyTalks', header);
        this.runningTotalPayoff.init({currency: 'USD'});
        this.doneButton = node.widgets.append('DoneButton', header);

        node.game.visualTimer.setToZero();

        // Add payoff tables
        node.game.totalPayoff = 0;
        var payoffs = node.game.settings.payoff;

        var payoffTableA = new W.Table();
        payoffTableA.addRow(['', 'Left', 'Right']);
        payoffTableA.addRow(['Red', payoffs.go['A']['redleft'], payoffs.go['A']['redright']]);
        payoffTableA.addRow(['Blue', payoffs.go['A']['blueleft'], payoffs.go['A']['blueright']]);

        var payoffTableB = new W.Table();
        payoffTableB.addRow(['', 'Left', 'Right'])
        payoffTableB.addRow(['Red', payoffs.go['B']['redleft'], payoffs.go['B']['redright']]);
        payoffTableB.addRow(['Blue', payoffs.go['B']['blueleft'], payoffs.go['B']['blueright']]);

        var payoffStopRed = payoffs.stop['red'];
        var payoffStopBlue = payoffs.stop['blue'];

        node.game.payoffTable = {};
        node.game.payoffTable['A'] = W.addClass(payoffTableA.parse(), 'table table-bordered');
        node.game.payoffTable['B'] = W.addClass(payoffTableB.parse(), 'table table-bordered');
        node.game.payoffStopRed = payoffStopRed;
        node.game.payoffStopBlue = payoffStopBlue;

        // Additional debug information while developing the game.
        // this.debugInfo = node.widgets.append('DebugInfo', header)

        node.game.checkIsPracticeStage = function() {
            var practiceStageNumber = node.game.plot.normalizeGameStage('practice').stage;
            return node.game.getCurrentGameStage().stage === practiceStageNumber;
        }

    });

    stager.extendStep('instructions', {
        frame: 'instructions.htm',
        cb: function() {
            W.getElementById('payoff-matrix-a').appendChild(node.game.payoffTable['A']);
            W.getElementById('payoff-matrix-b').appendChild(node.game.payoffTable['B']);
        }
    });

    // how can i distinguish between stages? so that i can adapt this to say something different
    // for practice stage
    stager.extendStep('stoporgo', {
        donebutton: false,
        frame: 'stopgostep.htm',
        init: function() {
            node.game.redChoice = null;
            node.game.role = null;
        },
        cb: function() {

            if (node.game.checkIsPracticeStage()) {
                W.setInnerHTML('info', 'This is a practice stage.');
                W.show('info');
            }

            node.on.data('ROLE_RED', function(msg) {
                // var buttonStop, buttonGo, payoffTableDiv;
                var buttonStop, buttonGo, payoffTableDiv1;

                node.game.role = 'red';
                node.game.worldState = msg.data;

                W.getElementById('payoff-table').appendChild(node.game.payoffTable[node.game.worldState]);
                W.show('red');
                // Write state of the world.
                W.setInnerHTML('state_of_world', node.game.worldState);

                // assumes same Stop payoff
                W.setInnerHTML('payoff-stop', node.game.payoffStopRed);

                buttonStop = W.getElementById('stop');
                buttonStop.disabled = false;
                buttonGo = W.getElementById('go');
                buttonGo.disabled = false;

                buttonStop.onclick = function() {
                    node.done('stop');
                };

                buttonGo.onclick = function() {
                    node.done('go');
                };

                // return;
                // Setup the timer.
                node.game.visualTimer.init({
                    milliseconds: node.game.settings.bidTime,
                    timeup: function() {
                        node.done(Math.floor(Math.random() * 2) ? 'stop':'go');
                    }
                });

                node.game.visualTimer.updateDisplay();
                node.game.visualTimer.startTiming();
            });

            node.on.data('ROLE_BLUE', function(msg) {
                var span;

                node.game.role = 'blue';
                node.game.visualTimer.setToZero();

                //                 node.game.visualTimer.clear();
                //                 node.game.visualTimer.startWaiting({
                //                     milliseconds: node.game.settings.bidTime,
                //                     timeup: false
                //                 });

                // Make the observer display visible.
                W.show('blue');
                // span = W.getElementById('dotsBlue');
                // W.addLoadingDots(span);

                node.on.data('redChoice', function(msg) {
                    node.game.redChoice = msg.data;
                    node.done();
                });

            });
        },
        done: function(choice) {
            var button, span;
            if (node.game.role === 'red') {
                button = W.getElementById('stop');
                button.disabled = true;
                button = W.getElementById('go');
                button.disabled = true;
                W.show('waiting_for_blue');
                // span = W.getElementById('dotsRed');
                // W.addLoadingDots(span);
                W.setInnerHTML('your_choice_red', 'Your choice: ' + choice);
            }
            else {
                W.hide('you_are_blue');
            }
        }
    });


    stager.extendStep('leftorright', {
        donebutton: false,
        cb: function() {
            var buttonLeft, buttonRight;
            if (node.game.role === 'blue') {
                W.show('make-blue-decision');
                W.setInnerHTML('red-choice', node.game.redChoice === 'stop' ? 'STOP' : 'GO');
                W.show('red-choice');

                buttonLeft = W.getElementById('left');
                buttonLeft.disabled = false;
                buttonRight = W.getElementById('right');
                buttonRight.disabled = false;

                buttonLeft.onclick = function() {
                    node.done('left');
                };

                buttonRight.onclick = function() {
                    node.done('right');
                };

                node.game.visualTimer.init({
                    milliseconds: node.game.settings.bidTime,
                    timeup: function() {
                        node.done(Math.floor(Math.random() * 2) ? 'left':'right');
                    }
                });

                node.game.visualTimer.updateDisplay();
                node.game.visualTimer.startTiming();

            }
            else {
                node.game.visualTimer.setToZero();
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
        cb: function() {

            if (node.game.checkIsPracticeStage()) {
                W.setInnerHTML('info', 'This is a practice stage.');
                W.show('info');
            }

            node.on.data('payoff', function(msg) {
                if (node.game.role === 'blue') {
                    W.setInnerHTML('payoff', msg.data.blue);
                    node.game.totalPayoff += msg.data.blue;
                    node.game.runningTotalPayoff.update(msg.data.blue);
                }
                else {
                    W.setInnerHTML('payoff', msg.data.red);
                    node.game.totalPayoff += msg.data.red;
                    node.game.runningTotalPayoff.update(msg.data.red);
                }

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
    });

    stager.extendStep('end', {
        donebutton: false,
        frame: 'end.htm',
        cb: function() {
            node.game.visualTimer.setToZero();
            W.setInnerHTML('total', node.game.totalPayoff);
            node.game.totalPayoff = 0;
        },
        done: function() {
            this.runningTotalPayoff.money = 0;
        }
    });

    stager.extendStep('practice-end', {
        frame: 'practice-end.htm',
        cb: function() {
            node.game.visualTimer.setToZero();
            W.setInnerHTML('total', node.game.totalPayoff);
            node.game.totalPayoff = 0;
        },
        done: function() {
            this.runningTotalPayoff.money = 0;
        }
    });

    game = setup;
    game.plot = stager.getState();
    return game;
};
