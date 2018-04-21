/**
 * # Player type implementation of the game stages (tutorial)
 * Copyright(c) 2018
 * MIT Licensed
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

    stager.setDefaultStepRule(stepRules.SOLO);

    stager.setOnInit(function() {
        // Initialize the client.

        // Setup page: header + frame.
        var header = W.generateHeader();
        var frame = W.generateFrame();

        var payoffs;
        var payoffTableA, payoffTableB;
        var redRowA, redRowB;
        var blueRowA, blueRowB;
        var tableClasses;

        var payoffStopRed, payoffStopBlue;

        // Add widgets.
        this.visualRound = node.widgets.append('VisualRound', header, {
            title: false
        });
        this.visualTimer = node.widgets.append('VisualTimer', header);
        this.runningTotalPayoff = node.widgets.append('MoneyTalks', header, {
            title: 'Points',
            currency: 'Points',
            precision: 0,
            showCurrency: false
        });
        this.doneButton = node.widgets.append('DoneButton', header);

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

        this.tutorialPay = 0;
        this.tutorialWorldState = '';

        this.infoText = 'This is only a tutorial of the game, ' +
                        'not the actual game.';

        this.selecttutorialRole = function(role) {
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

        this.clickWrong = function() {
            alert('Please follow the instructions! ' +
                  'Choose the specified selection.');
        };

        this.pA = (node.game.settings.PI * 100) + '%';
        this.pB = (node.game.settings.PIB * 100) + '%';
        
        this.addTables = function(color) {
            color = color ? ('-' + color) : '';
            W.getElementById('payoff-matrix-a' + color)
                .appendChild(node.game.payoffTables.A);
            W.getElementById('payoff-matrix-b' + color)
                .appendChild(node.game.payoffTables.B);

            W.setInnerHTML('probability-A-table' + color, '(' + this.pA + ')');
            // JS fails horribly with floating precision.
            W.setInnerHTML('probability-B-table' + color, '(' + this.pB + ')');
        }
    });

    stager.extendStep('mood', {
        widget: {
            name: 'MoodGauge',
            options: {
                title: false,
                panel: false
            }
        }
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
                    W.addLoadingDots(W.getElementById('awaiting-blue-decision'));
                    W.hide('stop-go-buttons');
                    W.hide('make-your-choice');
                },
                cb: function() {
                    var correctButton, wrongButton, stopGoButtons;
                    var payoffTable, s;
                    s = node.game.settings;

                    payoffTable = this.payoffTables[this.tutorialWorldState];

                    W.setInnerHTML('info', node.game.infoText);
                    W.setInnerHTML('tutorial-instructions', 'Please choose ' +
                                   '<strong>' + node.game.tutorialChoices.RED +
                                   '</strong> below. In a normal game you ' +
                                   'may choose whatever you like.');

                    W.show('info');
                    W.show('tutorial-instructions');

                    W.show('red');
                    
                    this.addTables('red');

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
                                       '<strong>Your choice: ' +
                                       node.game.tutorialChoices.RED +
                                       '</strong>');
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
                    W.addLoadingDots(W.getElementById('awaiting-red-decision'));
                    W.show('blue');
                }
            }
        }
    });

    stager.extendStep('blue-choice-tutorial', {
        role: function() { return this.role },
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

                    this.addTables('blue');
                    
                    W.setInnerHTML('payoff-stop-blue', this.payoffStopBlue +
                                   ' ' + node.game.runningTotalPayoff.currency);

                    // On small screens, table can be cut.
                    setTimeout(function() { W.adjustFrameHeight() });
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
        role: true,
        frame: 'results.htm',
        cb: function() {
            var payoffs;
            var otherPlayerRole;
            var payment;
            var playerChoice;
            var playerColorClass, otherPlayerColorClass;
            var payoffsGo;

            payoffs = node.game.settings.payoffs;
            otherPlayerRole = this.role === 'RED' ? 'BLUE' : 'RED';

            W.setInnerHTML('info', node.game.infoText);
            W.show('info');

            payoffsGo = payoffs.GO[this.tutorialWorldState];
            if (this.tutorialChoices.RED === 'GO') {
                payment = payoffsGo[this.tutorialChoices.BLUE][this.role];
            }
            else {
                payment = payoffs.STOP[this.role];
            }

            node.game.tutorialPay += payment;
            node.game.runningTotalPayoff.update(payment);

            playerChoice = this.tutorialChoices[this.role].toUpperCase();
            playerColorClass = this.role.toLowerCase();
            otherPlayerColorClass = otherPlayerRole.toLowerCase();

            W.setInnerHTML('player', this.role);
            W.setInnerHTML('player-choice', playerChoice);
            W.addClass(W.getElementById('player'), playerColorClass);

            W.setInnerHTML('other-player', otherPlayerRole);
            W.addClass(W.getElementById('other-player'),
                       otherPlayerColorClass);

            W.setInnerHTML('other-player-choice',
                           this.tutorialChoices[otherPlayerRole]);

            payment += ' ' + node.game.runningTotalPayoff.currency;            
            W.setInnerHTML('payoff', payment);
            W.setInnerHTML('world-state', node.game.tutorialWorldState);

            // Sets the role again.
            node.game.plot.updateProperty(node.game.getNextStep(),
                                          'role', this.role);

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
            node.game.runningTotalPayoff.update(0, true);
            node.say('tutorial-over');
        },
        cb: function() {
            var payoff, ex;
            W.setInnerHTML('info', node.game.infoText);
            W.show('info');
            W.setInnerHTML('tutorial-instructions', 'Click <strong>"Done"' +
                           '</strong> to be moved into the waiting room.');
            W.show('tutorial-instructions');
         
            payoff = node.game.tutorialPay + ' ';
            payoff += node.game.runningTotalPayoff.currency;
            W.setInnerHTML('total', payoff);
            ex = node.game.settings.EXCHANGE_RATE;
            payoff = (node.game.tutorialPay*ex).toFixed(2) + ' USD';
            W.setInnerHTML('total-in-money', payoff);

        }
    });

    stager.extendStep('instructions', {
        frame: 'instructions.htm',
        cb: function() {
            var payoffTables, s, str, mult;
            s = node.game.settings;
            
            payoffTables = this.payoffTables;

            W.setInnerHTML('probability-A', this.pA);
            // JS fails horribly with floating precision.
            W.setInnerHTML('probability-B', this.pB);

            W.setInnerHTML('probability-A-table', '(' + this.pA + ')');
            // JS fails horribly with floating precision.
            W.setInnerHTML('probability-B-table',  '(' + this.pB + ')');
            
            if (s.PI === 0.5) {
                str = 'A and B are equally likely';
            }
            else {
                if (s.PI > 0.5) {
                    mult = parseFloat(s.PI / (s.PIB)).toFixed(1);
                    if (mult.charAt(mult.length-1) === "0") {
                        mult = mult.substr(0, mult.length-2);
                    }
                    str = 'A is ' + mult + ' times more likely than B';
                }
                else {
                    mult = parseFloat((s.PIB) / s.PI).toFixed(1);
                    if (mult.charAt(mult.length-1) === "0") {
                        mult = mult.substr(0, mult.length-2);
                    }
                    str = 'B is ' + mult + ' times more likely than A';
                }
            }
            W.setInnerHTML('probability-explained', str);
            
            W.setInnerHTML('payoff-stop', node.game.payoffStopRed + ' ' +
                           node.game.runningTotalPayoff.currency);
            W.setInnerHTML('exchange_rate', s.EXCHANGE_RATE);
            W.getElementById('payoff-matrix-a').appendChild(payoffTables.A);
            W.getElementById('payoff-matrix-b').appendChild(payoffTables.B);
        }
    });
};
