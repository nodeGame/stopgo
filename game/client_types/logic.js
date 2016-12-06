/**
* # Logic type implementation of the game stages
* Copyright(c) 2016 brenste <myemail>
* MIT Licensed
*
* http://www.nodegame.org
* ---
*/

"use strict";

var fs = require('fs');
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
            match: 'roundrobin',
            cycle: 'repeat',
            skipBye: false,
            sayPartner: false
        },
        cb: function() {
            assignTable();
            node.say('TABLE', node.game.roles.RED, node.game.payoffTable);

            node.once.data('done', function(msg) {
                var id, redChoice;
                var playerObj;

                id = msg.from;

                playerObj = node.game.pl.get(id);

                if (id === node.game.roles.RED) {
                    node.game.redChoice = msg.data.GO ? 'GO' : 'STOP';
                    redChoice = node.game.redChoice;

                    if (playerObj.clientType !== 'bot') {
                        if (node.game.redChoice === 'STOP') {
                            channel.numChooseStop += 1;
                        }
                        channel.numStopGoDecisions += 1;
                    }

                    // validate selection
                    // TODO: move validation to before node.game.redChoice is assigned
                    if (msg.data.GO || msg.data.STOP) {
                        node.say('RED-CHOICE', node.game.roles.BLUE, redChoice);
                    }
                    else {
                        node.err('Error: Invalid Red choice. ID of sender: '+id);
                    }
                }
                else {
                    node.err('Error: Sender not Red player. ID of sender: '+id);
                }
            });
        }
    });

    stager.extendStep('blue-choice', {
        cb: function() {
            // ??? should i use once or on?
            node.once.data('done', function(msg) {
                var id, blueChoice;
                var playerObj;

                id = msg.from;

                if (id === node.game.roles.BLUE) {
                    node.game.blueChoice = msg.data.LEFT ? 'LEFT' : 'RIGHT';

                    blueChoice = node.game.blueChoice;

                    playerObj = node.game.pl.get(id);
                    // playerObj = channel.registry.get(id);

                    if (playerObj.clientType !== 'bot') {
                        if (node.game.blueChoice === 'RIGHT') {
                            channel.numChooseRight += 1;
                        }
                        channel.numRightLeftDecisions += 1;
                        // console.log('RIGHT/LEFT: ' + channel.numChooseRight / channel.numRightLeftDecisions);
                    }

                    // TODO: move validation to before node.game.blueChoice is assigned
                    if (msg.data.LEFT || msg.data.RIGHT) {
                        node.say('BLUE-CHOICE', node.game.roles.RED, blueChoice);
                    }
                    else {
                        node.err('Error: Invalid Blue choice. ID of sender: '+id);
                    }
                }
                else {
                    node.err('Error: Sender not Blue player. ID of sender: '+id);
                }
            });
        }
    });

    stager.extendStep('results', {
        cb: function() {
            var payoffs, results;

            payoffs = calculatePayoffs();
            addData(node.game.roles.RED, payoffs.red);
            addData(node.game.roles.BLUE, payoffs.blue);

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
            node.on.data('done', function(msg) {
                saveAll();
            });
        }
    });

    function addData(playerId, data) {
        var item = node.game.memory.player[playerId].last();
        item.bonus = data;
    }

    function saveAll() {
        var gDir, line;
        gDir = channel.getGameDir();
        node.game.memory.save( gDir + 'data/data_' + node.nodename + '.json');

        line = node.nodename + ',' + channel.numStopGoDecisions + ',' + channel.numChooseStop +
            ',' + channel.numRightLeftDecisions + ',' + channel.numChooseRight + "\n";
        fs.appendFile(gDir + 'data/avgDecisions.csv', line, function(err) {
            if (err) console.log('An error occurred saving: ' + line);
        });
    }

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
        // console.log('THE STATE OF THE WORLD IS: ' + node.game.payoffTable);
    }

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),

    };

};
