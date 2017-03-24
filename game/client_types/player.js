/**
 * # Player type implementation of the game stages (Tour)
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

        this.tourRole = '';
        this.tourPay = 0;
        this.tourWorldState = '';

        this.infoText = 'This is only a tour of the game, ' +
                        'not the actual game.';

        this.selectTourRole = function(role) {
            node.game.tourRole = role;
            // node.game.setRole(role, true);
            node.game.plot.setStepProperty(node.game.getNextStep(),
                                           'role', role);
            node.done({tourRole: role});
        };

        this.clickDone = function(obj) {
            var response;
            response = {
                world: node.game.tourWorldState
            };
            node.JSUS.mixin(response, obj);
            node.done(response);
        };

        node.game.node.game.clickWrong = function() {
            alert('Please follow the instructions! ' +
                  'Choose the specified selection.');
        };
    });

    stager.extendStep('choose-tour', { // why extend step not stage?
        donebutton: false,
        frame: 'choose-tour.htm',
        cb: function() {
            var redSelectButton;
            var blueSelectButton;

            redSelectButton = W.getElementById('tour-red-selection');
            blueSelectButton = W.getElementById('tour-blue-selection');

            redSelectButton.onclick = function() {
                node.game.selectTourRole('RED');
            };
            blueSelectButton.onclick = function() {
                node.game.selectTourRole('BLUE');
            };
        }
    });

    stager.extendStep('red-choice-tour', {
        frame: 'stopgostep.htm',
        init: function() {
            // save this value
            this.tourWorldState = Math.floor(Math.random() * 2) ? 'A' : 'B';
        },
        roles: {
            RED: {
                donebutton: false,
                done: function() {
                    W.show('waiting_for_blue');
                },
                cb: function() {
                    var roundNumber;
                    var tourChoices;
                    var correctButton, wrongButton, stopGoButtons;
                    var payoffTable;

                    roundNumber = this.getRound() - 1;
                    tourChoices = this.settings.tour[roundNumber];
                    payoffTable = this.payoffTables[node.game.tourWorldState];

                    W.setInnerHTML('info', node.game.infoText);
                    W.setInnerHTML('tour-instructions', 'Please choose ' +
                                   '<strong>' + tourChoices.RED +
                                   '</strong> below. In a normal game you ' +
                                   'may choose whatever you like.');

                    W.show('info');
                    W.show('tour-instructions');

                    W.show('red');
                    W.getElementById('payoff-table').appendChild(payoffTable);
                    W.setInnerHTML('world-state', node.game.tourWorldState);
                    W.setInnerHTML('payoff-stop', node.game.payoffStopRed +
                                   ' ' + node.game.runningTotalPayoff.currency);

                    stopGoButtons = W.getElementById('stop-go-buttons');

                    if (tourChoices.RED === 'STOP') {
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
                                       'Your choice: ' + tourChoices.RED);
                    };
                    wrongButton.onclick = node.game.clickWrong;

                    correctButton.disabled = false;
                    wrongButton.disabled = false;
                }
            },
            BLUE: {
                cb: function() {
                    W.setInnerHTML('info', node.game.infoText);
                    W.setInnerHTML('tour-instructions', 'Click ' +
                    '<strong>"Done"</strong> to receive Red\'s choice and ' +
                    'the results. In a normal game, you would wait for the ' +
                    'other player to make a selection (the "Done" button ' +
                    'would be disabled).');

                    W.show('info');
                    W.show('tour-instructions');

                    W.show('blue');
                }
            }
        }
    });

    stager.extendStep('blue-choice-tour', {
        role: true,
        roles: {
            BLUE: {
                donebutton: false,
                cb: function() {
                    var roundNumber;
                    var tourChoices;
                    var leftRightButtons;

                    roundNumber = node.game.getRound() - 1;
                    tourChoices = node.game.settings.tour[roundNumber];

                    W.setInnerHTML('info', node.game.infoText);
                    W.setInnerHTML('tour-instructions', 'Please choose ' +
                    '<strong>' + tourChoices.BLUE + '</strong> below. ' +
                    'In a normal game you may choose whatever you like.');

                    W.show('make-blue-decision');
                    W.hide('awaiting-red-decision');

                    W.setInnerHTML('red-choice', tourChoices.RED);

                    leftRightButtons = W.getElementById('left-right-buttons');

                    if (tourChoices.BLUE === 'LEFT') {
                        W.getElementById('left').onclick = function() {
                            node.game.clickDone();
                        };
                        W.getElementById('right').onclick = this.clickWrong;
                    }
                    else if (tourChoices.BLUE === 'RIGHT') {
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
                    W.setInnerHTML('tour-instructions', 'Click ' +
                    '<strong>"Done"</strong> to receive Blue\'s choice and ' +
                    'the results. In a normal game, you would wait for the ' +
                    'other player to make a selection (the "Done" button ' +
                    'would be disabled).');
                }
            }
        }
    });

    stager.extendStep('results-tour', {
        frame: 'results.htm',
        cb: function() {
            var roundNumber;
            var tourChoices;
            var payoffs;
            var otherPlayerRole;
            var payment;
            var playerChoice;
            var playerColorClass, otherPlayerColorClass;
            var payoffsGo;

            roundNumber = node.game.getRound() - 1;
            tourChoices = node.game.settings.tour[roundNumber];
            payoffs = node.game.settings.payoffs;
            otherPlayerRole = node.game.tourRole === 'RED' ? 'BLUE' : 'RED';

            W.setInnerHTML('info', node.game.infoText);
            W.show('info');

            payoffsGo = payoffs.GO[this.tourWorldState];

            if (tourChoices.RED === 'GO') {
                payment = payoffsGo[tourChoices.BLUE][this.tourRole];
            }
            else {
                payment = payoffs.STOP[node.game.tourRole];
            }

            node.game.tourPay += payment;
            node.game.runningTotalPayoff.update(payment);

            playerChoice = tourChoices[node.game.tourRole].toUpperCase();
            playerColorClass = node.game.tourRole.toLowerCase();
            otherPlayerColorClass = otherPlayerRole.toLowerCase();

            W.setInnerHTML('player', node.game.tourRole);
            W.setInnerHTML('player-choice', playerChoice);
            W.addClass(W.getElementById('player'), playerColorClass);

            W.setInnerHTML('other-player', otherPlayerRole);
            W.addClass(W.getElementById('other-player'),
                       otherPlayerColorClass);

            W.setInnerHTML('other-player-choice',
                           tourChoices[otherPlayerRole]);

            W.setInnerHTML('payoff', payment + ' ' +
            node.game.runningTotalPayoff.currency);
            W.setInnerHTML('world-state', node.game.tourWorldState);

            // Sets the role again.
            node.game.plot.updateProperty(node.game.getNextStep(),
                                          'role', node.game.tourRole);
        }
    });

    stager.extendStep('tour-end', {
        frame: 'practice-end.htm',
        done: function() {
            node.game.runningTotalPayoff.money = 0;
            node.game.runningTotalPayoff.update(0);

            node.say('tour-over');
        },
        cb: function() {
            W.setInnerHTML('info', node.game.infoText);
            W.show('info');
            W.setInnerHTML('tour-instructions', 'Click <strong>"Done"' +
                           '</strong> to be moved into the waiting room.');
            W.show('tour-instructions');
            W.setInnerHTML('total', node.game.tourPay + ' ' +
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
