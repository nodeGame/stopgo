/**
* # Logic type implementation of the game stages
* Copyright(c) 2016 brenste <myemail>
* MIT Licensed
*
* http://www.nodegame.org
* ---
*/

"use strict";

var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;
var constants = ngc.constants;
var counter = 0;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var node = gameRoom.node;
    var channel = gameRoom.channel;

    // Must implement the stages here.

    // Increment counter.
    counter = counter ? ++counter : settings.SESSION_ID || 1;

    stager.setOnInit(function() {
        // Initialize the client.
        channel.numChooseStop = 0;
        channel.numStopGoDecisions = 0;
        channel.numChooseRight = 0;
        channel.numRightLeftDecisions = 0;
    });

    stager.extendStage('game', { // or whatever is the name of the stage
        minPlayers: [ 2, function(playerObj) {
            // Collect data about player (e.g. previous choices),
            // and pass them as parameter to the bot.
            // More sophisticated bots could use that info (at the moment no).
            channel.connectBot({
                // room: waitingRoom,
                setup: {
                    settings: {
                        botType: 'dynamic', // 'dynamic' for based on player results
                        chanceOfStop: 0.5,
                        chanceOfRight: 0.5
                    }
                }
            });
            // Mark the player as not allowed to reconnect in the registry.
            channel.registry.updateClient(playerObj.id, { allowReconnect: false });
        } ]
    });

    stager.extendStep('instructions', {
        cb: function() {
            console.log('Instructions.');
        }
    });

    stager.extendStep('red-choice', {
        matcher: {
            roles: ['RED', 'BLUE'],
            match: 'random_pairs', // should be random pairings, change this
            // cycle: 'repeat_invert', // what does this mean?
            skipBye: false,
            sayPartner: false,
        },
        cb: function() {
            assignTable();
            node.say('TABLE', node.game.roles.RED, node.game.payoffTable);

            node.once.data('done', function(msg) {
                var id, redChoice;

                node.game.redChoice = msg.data.GO ? 'GO' : 'STOP';

                id = msg.from;
                redChoice = node.game.redChoice;

                // validate selection
                // TODO: move validation to before node.game.redChoice is assigned
                if (id === node.game.roles.RED && (msg.data.GO || msg.data.STOP)) {
                    node.say('RED-CHOICE', node.game.roles.BLUE, redChoice);
                }
                else {
                    console.log('Error: Invalid Red choice.');
                }
            });
        }
    });

    stager.extendStep('blue-choice', {
        cb: function() {
            // ??? should i use once or on?
            node.once.data('done', function(msg) {
                var id, blueChoice;

                node.game.blueChoice = msg.data.LEFT ? 'LEFT' : 'RIGHT';
                id = msg.from;
                blueChoice = node.game.blueChoice;

                // TODO: move validation to before node.game.blueChoice is assigned
                if (id === node.game.roles.BLUE && (msg.data.LEFT || msg.data.RIGHT)) {
                    node.say('BLUE-CHOICE', node.game.roles.RED, blueChoice);
                }
                else {
                    console.log('Error: Invalid Blue choice');
                }
            });
        }
    });

    stager.extendStep('results', {
        cb: function() {
            var payoffs, results;

            payoffs = calculatePayoffs();
            results = {
                payoffs: payoffs,

                choices: {
                    red: node.game.redChoice,
                    blue: node.game.blueChoice
                }
            };

            node.say('RESULTS', 'ROOM', results);
        }
    });

    stager.extendStep('end', {
        cb: function() {
            // saveData();
            // updateBotBehavior();
        }
    });

    // returns payoffs as a object
    function calculatePayoffs() {
        var payoffs, bluePayoff, redPayoff;
        var blueChoice;

        payoffs = settings.payoffs;
        blueChoice = node.game.blueChoice.toLowerCase();

        if (node.game.redChoice === 'GO') {
            bluePayoff = payoffs.go[node.game.payoffTable][blueChoice].blue;
            redPayoff = payoffs.go[node.game.payoffTable][blueChoice].red;
        }
        else {
            bluePayoff = payoffs.stop.blue;
            redPayoff = payoffs.stop.red;
        }

        return {
            blue: bluePayoff,
            red: redPayoff
        };
    }

    function assignTable() {
        // TODO: double check is pi chance for A or B?
        if (Math.random() < node.game.settings.pi) {
            node.game.payoffTable = 'A';
        }
        else {
            node.game.payoffTable = 'B';
        }
    }

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),

    };

};
