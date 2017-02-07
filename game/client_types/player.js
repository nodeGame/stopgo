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

    stager.setDefaultStepRule(stepRules.SOLO);

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

        node.game.tourRole = '';
        node.game.tourPay = 0;

        node.game.infoText = 'Reminder: this is a tour of the game. The computer is playing for you. Click "Done" when you are ready to see the next step. In a normal game you would make a selection to proceed to the next step. ';

        node.game.clickDone = function() {
            node.done({world: node.game.tourWorldState});
        };

        node.game.node.game.clickWrong = function() {
            alert('Please follow the instructions! Choose the specified selection.');
        };
    });

    stager.extendStep('choose-tour', { // why extend step not stage?
        donebutton: false,
        frame: 'choose-tour.htm',
        cb: function() {
            var redSelectButton = W.getElementById('tour-red-selection');
            var blueSelectButton = W.getElementById('tour-blue-selection');

            redSelectButton.onclick = function() {
                node.game.tourRole = 'RED';
                node.done({tourRole: 'RED'});
            };

            blueSelectButton.onclick = function() {
                node.game.tourRole = 'BLUE';
                node.done({tourRole: 'BLUE'});
            };
        }
    });

    stager.extendStep('red-choice-tour', {
        frame: 'stopgostep.htm',
        // caused a bug when single person for tour
        // stepRule: stepRules.SOLO_STEP, // can advance on own as long as stage is same
        done: function() {
            var roundNumber = node.game.getRound() - 1;
            var tourChoices = node.game.settings.tour[roundNumber];

            if (node.game.tourRole === 'RED') {
                W.show('waiting_for_blue');
                W.setInnerHTML('red-decision', 'Your choice: ' + tourChoices.RED);
            }
            // else if (node.game.tourRole === 'BLUE') {
            //     W.setInnerHTML('info', node.game.infoText +  'Please choose ' + tourChoices.BLUE);
            //
            //     W.show('make-blue-decision');
            //     W.hide('awaiting-red-decision');
            // }
            // else {
                // console.error('node.game.tourRole not set');
            // }
        },
        cb: function() {
            var roundNumber = node.game.getRound() - 1;
            var tourChoices = node.game.settings.tour[roundNumber];

            // save this value
            node.game.tourWorldState = Math.floor(Math.random() * 2) ? 'A' : 'B';

            if (node.game.tourRole === 'RED') {
                W.setInnerHTML('info', node.game.infoText +  'Please choose ' + tourChoices.RED);
                W.show('info');

                W.show('red');
                W.getElementById('payoff-table').appendChild(node.game.payoffTables[node.game.tourWorldState]);
                W.setInnerHTML('state_of_world', node.game.tourWorldState);
                W.setInnerHTML('payoff-stop', node.game.payoffStopRed + ' ' + node.game.runningTotalPayoff.currency);

                if (tourChoices.RED === 'STOP') {
                    W.getElementById('stop').onclick = node.game.clickDone;
                    W.getElementById('go').onclick = node.game.clickWrong;
                }
                else {
                    W.getElementById('go').onclick = node.game.clickDone;
                    W.getElementById('stop').onclick = node.game.clickWrong;
                }
            }
            else if (node.game.tourRole === 'BLUE') {
                W.setInnerHTML('info', node.game.infoText);
                W.show('info');

                W.show('blue');
            }
            else {
                console.error('node.game.tourRole not set');
            }
        }
    });

    stager.extendStep('blue-choice-tour', {
        // stepRule: stepRules.SOLO_STEP, // can advance on own as long as stage is same
        cb: function() {
            var roundNumber = node.game.getRound() - 1;
            var tourChoices = node.game.settings.tour[roundNumber];

            if (node.game.tourRole === 'BLUE') {
                W.setInnerHTML('info', node.game.infoText +  'Please choose ' + tourChoices.BLUE);

                W.show('make-blue-decision');
                W.hide('awaiting-red-decision');

                W.setInnerHTML('red-choice', tourChoices.RED);

                if (tourChoices.BLUE === 'LEFT') {
                    W.getElementById('left').onclick = node.game.clickDone;
                    W.getElementById('right').onclick = node.game.clickWrong;
                }
                else if (tourChoices.BLUE === 'RIGHT') {
                    W.getElementById('right').onclick = node.game.clickDone;
                    W.getElementById('left').onclick = node.game.clickWrong;
                }

                W.getElementById('payoff-matrix-a').appendChild(node.game.payoffTables.A);
                W.getElementById('payoff-matrix-b').appendChild(node.game.payoffTables.B);

                W.setInnerHTML('payoff-stop-blue', node.game.payoffStopBlue + ' ' + node.game.runningTotalPayoff.currency);
            }
        }
    });

    stager.extendStep('results-tour', {
        frame: 'results.htm',
        cb: function() {
            var roundNumber = node.game.getRound() - 1;
            var tourChoices = node.game.settings.tour[roundNumber];
            var payoffs = node.game.settings.payoffs;
            var otherPlayerRole = node.game.tourRole === 'RED' ? 'BLUE' : 'RED';
            var pay;

            W.setInnerHTML('info', node.game.infoText);
            W.show('info');

            if (tourChoices.RED === 'GO') {
                console.log(payoffs);
                pay = payoffs.GO[node.game.tourWorldState][tourChoices.BLUE][node.game.tourRole];
            }
            else {
                pay = payoffs.STOP[node.game.tourRole];
            }

            console.log(pay, node.game);
            node.game.tourPay += pay;
            node.game.runningTotalPayoff.update(pay);

            W.setInnerHTML('player', node.game.tourRole);
            W.setInnerHTML('player-choice', tourChoices[node.game.tourRole].toUpperCase());
            W.addClass(W.getElementById('player'), node.game.tourRole === 'RED' ? 'red' : 'blue'); // just lowercase somehow later
            W.setInnerHTML('other-player', otherPlayerRole);
            W.addClass(W.getElementById('other-player'), node.game.tourRole === 'RED' ? 'blue' : 'red'); // just lowercase somehow later
            W.setInnerHTML('other-player-choice', tourChoices[otherPlayerRole]);
            W.setInnerHTML('payoff', pay + ' ' + node.game.runningTotalPayoff.currency);
        }
    });

    stager.extendStep('tour-end', {
        frame: 'end.htm',
        done: function() {
            node.game.runningTotalPayoff.money = 0;
            node.game.runningTotalPayoff.update(0);

            node.say('tour-over');
        },
        cb: function() {
            W.setInnerHTML('info', node.game.infoText);
            W.show('info');
            W.setInnerHTML('total', node.game.tourPay + ' ' + node.game.runningTotalPayoff.currency);
        }
    });

    stager.extendStep('instructions', {
        frame: 'instructions.htm',
        cb: function() {
            W.setInnerHTML('payoff-stop', node.game.payoffStopRed + ' ' + node.game.runningTotalPayoff.currency);
            W.getElementById('payoff-matrix-a').appendChild(node.game.payoffTables.A);
            W.getElementById('payoff-matrix-b').appendChild(node.game.payoffTables.B);
        }
    });

    game = setup;
    game.plot = stager.getState();
    return game;
};
