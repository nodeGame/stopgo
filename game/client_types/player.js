/**
 * # Player type implementation of the game stages (tutorial)
 * Copyright(c) 2016
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

    stager.setDefaultStepRule(stepRules.SOLO);

    stager.setOnInit(function() {
        // Initialize the client.
        // Setup page: header + frame.
        var header = W.generateHeader();
        var frame = W.generateFrame();
        W.setHeaderPosition('top');

        var payoffs;
        var payoffTableA, payoffTableB;
        var redRowA, redRowB;
        var blueRowA, blueRowB;
        var tableClasses;

        var payoffStopRed, payoffStopBlue;

        // Add widgets.
        this.visualRound = node.widgets.append('VisualRound', header);
        this.visualTimer = node.widgets.append('VisualTimer', header);
        this.runningTotalPayoff = node.widgets.append('MoneyTalks', header,
                                                      {currency: 'USD'});
        this.doneButton = node.widgets.append('DoneButton', header,
                                              {text: 'Done'});

        // node.player.stage.round

        // Add payoff tables
        node.game.totalPayoff = 0;
        payoffs = node.game.settings.payoffs;

        redRowA = ['Red', payoffs.GO.A.LEFT.RED, payoffs.GO.A.RIGHT.RED];
        blueRowA = ['Blue', payoffs.GO.A.LEFT.BLUE, payoffs.GO.A.RIGHT.BLUE];

        payoffTableA = new W.Table();
        payoffTableA.addRow(['', 'Left', 'Right']);
        payoffTableA.addRow(redRowA);
        payoffTableA.addRow(blueRowA);

        redRowB = ['Red', payoffs.GO.B.LEFT.RED, payoffs.GO.B.RIGHT.RED];
        blueRowB = ['Blue', payoffs.GO.B.LEFT.BLUE, payoffs.GO.B.RIGHT.BLUE];
        payoffTableB = new W.Table();
        payoffTableB.addRow(['', 'Left', 'Right']);
        payoffTableB.addRow(redRowB);
        payoffTableB.addRow(blueRowB);

        payoffStopRed = payoffs.STOP.RED;
        payoffStopBlue = payoffs.STOP.BLUE;

        tableClasses = 'table table-bordered';

        this.payoffTables = {};
        this.payoffTables.A = W.addClass(payoffTableA.parse(), tableClasses);
        this.payoffTables.B = W.addClass(payoffTableB.parse(), tableClasses);
        this.payoffStopRed = payoffStopRed;
        this.payoffStopBlue = payoffStopBlue;

        // Additional debug information while developing the game.
        // this.debugInfo = node.widgets.append('DebugInfo', header)

        this.tutorialRole = '';
        this.tutorialPay = 0;
        this.tutorialWorldState = '';

        this.infoText = 'This is only a tutorial of the game, ' +
                        'not the actual game.';

        this.selecttutorialRole = function(role) {
            node.game.tutorialRole = role;
            // node.game.setRole(role, true);
            node.game.plot.setStepProperty(node.game.getNextStep(),
                                           'role', role);
            node.done({tutorialRole: role});
        };

        this.clickDone = function(obj) {
            var response;
            response = {
                world: node.game.tutorialWorldState
            };
            node.JSUS.mixin(response, obj);
            node.done(response);
        };

        node.game.node.game.clickWrong = function() {
            alert('Please follow the instructions! ' +
                  'Choose the specified selection.');
        };
    });

    stager.extendStep('choose-tutorial', {
        donebutton: false,
        frame: 'choose-tutorial.htm',
        cb: function() {
            var redSelectButton;
            var blueSelectButton;

            redSelectButton = W.getElementById('tutorial-red-selection');
            blueSelectButton = W.getElementById('tutorial-blue-selection');

            redSelectButton.onclick = function() {
                node.game.selecttutorialRole('RED');
            };
            blueSelectButton.onclick = function() {
                node.game.selecttutorialRole('BLUE');
            };
        }
    });

    stager.extendStep('red-choice-tutorial', {
        frame: 'stopgostep.htm',
        init: function() {
            // Save this values.
            this.tutorialWorldState = Math.floor(Math.random() * 2) ? 'A' : 'B';
            this.tutorialChoices = this.settings.tutorial[(this.getRound()-1)];
        },
        roles: {
            RED: {
                donebutton: false,
                done: function() {
                    W.show('awaiting-blue-decision');
                    W.addLoadingDots(W.getElementById('awaiting-blue-decision'),
                     5);
                    W.hide('stop-go-buttons');
                    W.hide('make-your-choice');
                },
                cb: function() {
                    var correctButton, wrongButton, stopGoButtons;
                    var payoffTable;

                    payoffTable = this.payoffTables[this.tutorialWorldState];

                    W.setInnerHTML('info', node.game.infoText);
                    W.setInnerHTML('tutorial-instructions', 'Please choose ' +
                                   '<strong>' + node.game.tutorialChoices.RED +
                                   '</strong> below. In a normal game you ' +
                                   'may choose whatever you like.');

                    W.show('info');
                    W.show('tutorial-instructions');

                    W.show('red');
                    W.getElementById('payoff-table').appendChild(payoffTable);
                    W.setInnerHTML('world-state', node.game.tutorialWorldState);
                    W.setInnerHTML('payoff-stop', node.game.payoffStopRed +
                                   ' ' + node.game.runningTotalPayoff.currency);

                    stopGoButtons = W.getElementById('stop-go-buttons');

                    if (this.tutorialChoices.RED === 'STOP') {
                        correctButton = W.getElementById('stop');
                        wrongButton = W.getElementById('go');
                    }
                    else {
                        correctButton = W.getElementById('go');
                        wrongButton = W.getElementById('stop');
                    }
                    correctButton.onclick = function() {
                        // Disable buttons.
                        correctButton.disabled = true;
                        wrongButton.disabled = true;

                        node.game.clickDone();
                        W.setInnerHTML('red-decision',
                                       'Your choice: ' +
                                       node.game.tutorialChoices.RED);
                    };
                    wrongButton.onclick = node.game.clickWrong;

                    correctButton.disabled = false;
                    wrongButton.disabled = false;
                }
            },
            BLUE: {
                cb: function() {
                    W.setInnerHTML('info', node.game.infoText);
                    W.setInnerHTML('tutorial-instructions', 'Click ' +
                    '<strong>"Done"</strong> to receive Red\'s choice and ' +
                    'the results. In a normal game, you would wait for the ' +
                    'other player to make a selection (the "Done" button ' +
                    'would be disabled).');

                    W.show('info');
                    W.show('tutorial-instructions');
                    W.addLoadingDots(W.getElementById('awaiting-red-decision'),
                     5);
                    W.show('blue');
                }
            }
        }
    });

    stager.extendStep('blue-choice-tutorial', {
        role: true,
        roles: {
            BLUE: {
                donebutton: false,
                cb: function() {
                    var leftRightButtons;

                    W.setInnerHTML('info', node.game.infoText);
                    W.setInnerHTML('tutorial-instructions', 'Please choose ' +
                    '<strong>' + this.tutorialChoices.BLUE +
                    '</strong> below. ' +
                    'In a normal game you may choose whatever you like.');

                    W.show('make-blue-decision');
                    W.hide('awaiting-red-decision');

                    W.setInnerHTML('red-choice', this.tutorialChoices.RED);

                    leftRightButtons = W.getElementById('left-right-buttons');

                    if (this.tutorialChoices.BLUE === 'LEFT') {
                        W.getElementById('left').onclick = function() {
                            node.game.clickDone();
                        };
                        W.getElementById('right').onclick = this.clickWrong;
                    }
                    else if (this.tutorialChoices.BLUE === 'RIGHT') {
                        W.getElementById('right').onclick = function() {
                            node.game.clickDone();
                        };
                        W.getElementById('left').onclick = this.clickWrong;
                    }

                    W.getElementById('payoff-matrix-a')
                    .appendChild(node.game.payoffTables.A);
                    W.getElementById('payoff-matrix-b')
                    .appendChild(node.game.payoffTables.B);

                    W.setInnerHTML('payoff-stop-blue', this.payoffStopBlue +
                    ' ' + node.game.runningTotalPayoff.currency);
                }
            },
            RED: {
                cb: function() {
                    W.setInnerHTML('tutorial-instructions', 'Click ' +
                    '<strong>"Done"</strong> to receive Blue\'s choice and ' +
                    'the results. In a normal game, you would wait for the ' +
                    'other player to make a selection (the "Done" button ' +
                    'would be disabled).');
                }
            }
        }
    });

    stager.extendStep('results-tutorial', {
        frame: 'results.htm',
        cb: function() {
            var payoffs;
            var otherPlayerRole;
            var payment;
            var playerChoice;
            var playerColorClass, otherPlayerColorClass;
            var payoffsGo;
            var tutorialRole;

            payoffs = node.game.settings.payoffs;
            otherPlayerRole = node.game.tutorialRole === 'RED' ? 'BLUE' : 'RED';

            W.setInnerHTML('info', node.game.infoText);
            W.show('info');

            payoffsGo = payoffs.GO[this.tutorialWorldState];
            tutorialRole = this.tutorialRole;
            if (this.tutorialChoices.RED === 'GO') {
                payment = payoffsGo[this.tutorialChoices.BLUE][tutorialRole];
            }
            else {
                payment = payoffs.STOP[this.tutorialRole];
            }

            node.game.tutorialPay += payment;
            node.game.runningTotalPayoff.update(payment);

            playerChoice = this.tutorialChoices[node.game.tutorialRole]
                           .toUpperCase();
            playerColorClass = node.game.tutorialRole.toLowerCase();
            otherPlayerColorClass = otherPlayerRole.toLowerCase();

            W.setInnerHTML('player', node.game.tutorialRole);
            W.setInnerHTML('player-choice', playerChoice);
            W.addClass(W.getElementById('player'), playerColorClass);

            W.setInnerHTML('other-player', otherPlayerRole);
            W.addClass(W.getElementById('other-player'),
                       otherPlayerColorClass);

            W.setInnerHTML('other-player-choice',
                           this.tutorialChoices[otherPlayerRole]);

            W.setInnerHTML('payoff', payment + ' ' +
            node.game.runningTotalPayoff.currency);
            W.setInnerHTML('world-state', node.game.tutorialWorldState);

            // Sets the role again.
            node.game.plot.updateProperty(node.game.getNextStep(),
                                          'role', node.game.tutorialRole);

            W.getElementById('payoff-table')
            .appendChild(this.payoffTables[this.tutorialWorldState]);

            if (this.tutorialChoices['RED'] === 'GO') {
                W.show('go-choice');
            }
            else {
                W.show('stop-choice');
            }

        }
    });

    stager.extendStep('tutorial-end', {
        frame: 'practice-end.htm',
        done: function() {
            node.game.runningTotalPayoff.money = 0;
            node.game.runningTotalPayoff.update(0);

            node.say('tutorial-over');
        },
        cb: function() {
            W.setInnerHTML('info', node.game.infoText);
            W.show('info');
            W.setInnerHTML('tutorial-instructions', 'Click <strong>"Done"' +
                           '</strong> to be moved into the waiting room.');
            W.show('tutorial-instructions');
            W.setInnerHTML('total', node.game.tutorialPay + ' ' +
            node.game.runningTotalPayoff.currency);
        }
    });

    stager.extendStep('instructions', {
        frame: 'instructions.htm',
        cb: function() {
            var payoffTables;
            payoffTables = this.payoffTables;

            W.setInnerHTML('payoff-stop', node.game.payoffStopRed + ' ' +
                           node.game.runningTotalPayoff.currency);
            W.getElementById('payoff-matrix-a').appendChild(payoffTables.A);
            W.getElementById('payoff-matrix-b').appendChild(payoffTables.B);
        }
    });

    game = setup;
    game.plot = stager.getState();
    return game;
};
