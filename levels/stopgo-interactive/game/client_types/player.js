/**
* # Player type implementation of the game stages
* Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
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

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    stager.setOnInit(function() {

        // Setup page: header + frame + infopanel.

        var header, frame, infoPanel;

        var payoffs;
        var payoffTableA, payoffTableB;
        var redRowA, redRowB;
        var blueRowA, blueRowB;
        var tableClasses;

        var payoffStopRed, payoffStopBlue;

        header = W.generateHeader();
        frame = W.generateFrame();
        infoPanel = W.generateInfoPanel(undefined, {
            onStep: 'close'
        });

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

        // History Div.
        this.historyButton = infoPanel.createToggleButton('History');
        this.historyButton.disabled = true;

        this.historyDiv = document.createElement('div');
        this.historyDiv.innerHTML = '<h3>Game history</h3>';
        W.addClass(this.historyDiv, 'history');
        infoPanel.infoPanelDiv.appendChild(this.historyDiv);

        header.appendChild(this.historyButton);
        // End History Div.

        this.doneButton = node.widgets.append('DoneButton', header);

        // Add payoff tables
        node.game.totalPayoff = 0;
        payoffs = node.game.settings.payoffs;

        redRowA = [ 'Red', payoffs.GO.A.LEFT.RED, payoffs.GO.A.RIGHT.RED ];
        blueRowA = [ 'Blue', payoffs.GO.A.LEFT.BLUE, payoffs.GO.A.RIGHT.BLUE ];

        payoffTableA = new W.Table();
        payoffTableA.addRow([ '', 'Left', 'Right' ]);
        payoffTableA.addRow(redRowA);
        payoffTableA.addRow(blueRowA);

        redRowB = [ 'Red', payoffs.GO.B.LEFT.RED, payoffs.GO.B.RIGHT.RED ];
        blueRowB = [ 'Blue', payoffs.GO.B.LEFT.BLUE, payoffs.GO.B.RIGHT.BLUE ];
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

        node.game.playerRole = null;
        node.game.redChoice = null;
        node.game.blueChoice = null;
        node.game.worldState = null;
        node.game.totalPayment = 0;

        node.game.history = new W.Table();
        node.game.history.addRow([
            'Round', 'Red Choice', 'Blue Choice',
            'World State', 'Red Payoff', 'Blue Payoff'
        ]);

        
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
        // Additional debug information while developing the game.
        // this.debugInfo = node.widgets.append('DebugInfo', header)
    });

    stager.extendStep('instructions-light', {
        frame: 'instructions-light.htm',
        cb: function() {
            var startsIn, s;

            // Display time left middle of page.
            s = node.game.settings;
            startsIn = W.getElementById('game-starts-in');
            startsIn.innerHTML = Math.floor(s.TIMER['instructions-light']/1000);
            node.game.visualTimer.gameTimer.addHook({
                hook: function() {
                    startsIn.innerHTML = Math.floor(this.timeLeft/1000);
                },
                ctx: node.game.visualTimer.gameTimer,
                name: 'extraTimer'
            });
            W.setInnerHTML('probability-A', this.pA);
        },
        exit: function() {
            if (this.visualTimer) {
                this.visualTimer.gameTimer.removeHook('extraTimer');
            }
        }
    });

    stager.extendStage('game', {
        init: function() {
            node.on.step(function() {
                 W.infoPanel.close();
            });
        }
    });

    stager.extendStep('red-choice', {
        donebutton: false,
        frame: 'stopgostep.htm',
        // role: function() { return this.role; },
        // partner: function() { return this.partner; },
        init: function() {
            node.game.redChoice = null;
            node.game.playerRole = this.role;
            if (this.getRound() > 1) this.historyButton.disabled = false;
        },
        roles: {
            RED: {
                timeup: function() {
                    var buttonId;
                    buttonId = Math.floor(Math.random() * 2) ? 'stop':'go';
                    W.getElementById(buttonId).click();
                },
                done: function(decision) {
                    if (!decision) return false;
                    node.game.redChoice = decision.redChoice;
                    W.getElementById('stop').disabled = true;
                    W.getElementById('go').disabled = true;
                },
                cb: function() {
                    var buttonStop, buttonGo, payoffTableDiv1;
                    var startTimer;
                    var payoffTable;

                    node.on.data('TABLE', function(message) {
                        node.game.worldState = message.data;
                        payoffTable = node.game
                                      .payoffTables[node.game.worldState];

                        W.show('red');
                        this.addTables('red');
                        
                        W.setInnerHTML('world-state', node.game.worldState);
                        W.setInnerHTML('payoff-stop', node.game.payoffStopRed +
                                       ' ' +
                                       node.game.runningTotalPayoff.currency);

                        buttonStop = W.getElementById('stop');
                        buttonStop.disabled = false;

                        buttonGo = W.getElementById('go');
                        buttonGo.disabled = false;

                        buttonStop.onclick = function() {
                            node.done({ redChoice: 'STOP' });
                        };

                        buttonGo.onclick = function() {
                            node.done({ redChoice: 'GO' });
                        };
                    });
                }
            },
            BLUE: {                
                cb: function() {
                    var dots;
                    W.show('blue');

                    dots = W.addLoadingDots(
                        W.getElementById('awaiting-red-decision'));

                    node.on.data('RED-CHOICE', function(msg) {
                        node.game.redChoice = msg.data;
                        dots.stop();
                        node.done();
                    });
                },
                // We just wait, when the partner times up,
                // we get a msg from server.
                timeup: null
            }
        }
    });

    stager.extendStep('blue-choice', {
        donebutton: false,
        role: function() { return this.role; },
        partner: function() { return this.partner; },
        init: function() {
            node.game.blueChoice = null;
        },
        roles: {
            RED: {
                cb: function() {
                    var dots;
                    W.show('awaiting-blue-decision');
                    
                    dots = W.addLoadingDots(
                        W.getElementById('awaiting-blue-decision'));
                    
                    W.hide('stop-go-buttons');
                    W.hide('make-your-choice');

                    W.setInnerHTML('red-decision', '<strong>Your choice: ' +
                                   node.game.redChoice + '.</strong>');

                    node.on.data('BLUE-CHOICE', function(msg) {
                        node.game.blueChoice = msg.data;
                        dots.stop();
                        node.done();
                    });
                },
                // We just wait, when the partner times up,
                // we get a msg from server.
                timeup: null
            },
            BLUE: {
                timeup: function() {
                    var buttonId;
                    buttonId = Math.floor(Math.random() * 2) ? 'left' : 'right';
                    W.getElementById(buttonId).click();
                },
                done: function(decision) {
                    if (!decision) return false;
                    node.game.blueChoice = decision.blueChoice;
                    W.getElementById('left').disabled = true;
                    W.getElementById('right').disabled = true;
                },
                cb: function() {
                    var buttonLeft, buttonRight;
                    var startTimer;

                    W.show('make-blue-decision');
                    W.hide('awaiting-red-decision');

                    W.setInnerHTML('red-choice', node.game.redChoice);
                    W.show('red-choice');

                    buttonLeft = W.getElementById('left');
                    buttonLeft.disabled = false;

                    buttonRight = W.getElementById('right');
                    buttonRight.disabled = false;

                    
                    this.addTables('blue');

                    W.setInnerHTML('payoff-stop-blue', this.payoffStopBlue +
                    ' ' + node.game.runningTotalPayoff.currency);

                    buttonLeft.onclick = function() {
                        node.done({ blueChoice: 'LEFT' });
                    };

                    buttonRight.onclick = function() {
                        node.done({ blueChoice: 'RIGHT' });
                    };
                }
            }
        }
    });

    stager.extendStep('results', {
        frame: 'results.htm',
        cb: function() {
            var payoffs, payment;
            var choices;
            var otherPlayerRole, otherPlayerChoice;
            var playerChoice;
            var playerColorClass, otherPlayerColorClass;
            var worldState;

            node.on.data('RESULTS', function(message) {
                payoffs = message.data.payoffs;
                choices = message.data.choices;
                worldState = message.data.world;

                otherPlayerRole = node.game.playerRole === 'RED' ?
                                  'BLUE' : 'RED';

                payment = payoffs[node.game.playerRole];
                playerChoice = choices[node.game.playerRole];
                otherPlayerChoice = choices[otherPlayerRole];

                node.game.totalPayment += payment;
                node.game.runningTotalPayoff.update(payment);

                playerColorClass = node.game.playerRole.toLowerCase();
                otherPlayerColorClass = otherPlayerRole.toLowerCase();

                W.setInnerHTML('player', node.game.playerRole);
                W.setInnerHTML('player-choice', playerChoice);
                W.addClass(W.getElementById('player'), playerColorClass);

                W.setInnerHTML('other-player', otherPlayerRole);
                W.addClass(W.getElementById('other-player'),
                           otherPlayerColorClass);

                W.setInnerHTML('other-player-choice',
                               otherPlayerChoice);

                W.setInnerHTML('payoff', payment + ' ' +
                node.game.runningTotalPayoff.currency);
                W.setInnerHTML('world-state', worldState);

                W.getElementById('payoff-table')
                    .appendChild(node.game.payoffTables[worldState]);

                if (choices['RED'] === 'GO') {
                    W.show('go-choice');
                }
                else {
                    W.show('stop-choice');
                }

                node.game.history.addRow([node.player.stage.round,
                                          choices['RED'], choices['BLUE'],
                                          worldState,
                                          payoffs['RED'], payoffs['BLUE']]);

                W.addClass(node.game.history.parse(), 'table table-bordered');
                node.game.historyDiv.appendChild(node.game.history.parse());
            });
        }
    });

    stager.extendStep('end', {
        init: function() {
            W.infoPanel.destroy();
            W.restoreOnleave();
        },
        donebutton: false,
        frame: 'end.htm',
        widget: {
            name: 'EndScreen',
            root: "body",
            options: {
                panel: false,
                title: false,
                showEmailForm: true,
                email: {
                    texts: {
                        label: 'Enter your email (optional):',
                        errString: 'Please enter a valid email and retry'
                    }
                }
            }
        }
    });

};
