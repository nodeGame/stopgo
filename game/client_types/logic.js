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

        node.game.choices = {};
        node.game.tables = {};
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
            var allMatchesInRound;
            var i;
            var match;
            var roles;
            var payoffTable;

            allMatchesInRound = node.game.matcher.matcher.getMatch(node.game.getCurrentGameStage().round);

            for (i = 0; i < allMatchesInRound.length; i++) {
                match = allMatchesInRound[i];

                roles = getRoles(match[0], match[1]);
                console.log('ROLES -----');
                console.log(roles);

                payoffTable = getRandomTable();
                node.game.tables[roles.RED] = payoffTable;

                node.say('TABLE', roles.RED, payoffTable);
            }

            node.on.data('done', function(msg) {
                var id, otherId;
                var playerObj;
                var roles;
                var redChoice;

                id = msg.from;
                playerObj = node.game.pl.get(id);
                otherId = node.game.matcher.getMatchFor(id);
                roles = getRoles(id, otherId);

                if (id === roles.RED) {
                    // TODO: fix this so red choice is stored elsewhere
                    redChoice = msg.data.GO ? 'GO' : 'STOP';
                    node.game.choices[roles.RED] = { redChoice: redChoice };

                    if (playerObj.clientType !== 'bot') {
                        if (redChoice === 'STOP') {
                            channel.numChooseStop += 1;
                        }
                        channel.numStopGoDecisions += 1;
                    }

                    // validate selection
                    // TODO: move validation to before node.game.redChoice is assigned
                    if (msg.data.GO || msg.data.STOP) {
                        node.say('RED-CHOICE', roles.BLUE, redChoice);
                    }
                    else {
                        node.err('Error: Invalid Red choice. ID of sender: '+id);
                    }
                }
                // else {
                // node.err('Error: Sender not Red player. ID of sender: '+id);
                // }
            });
        }
    });

    stager.extendStep('blue-choice', {
        cb: function() {
            // ??? should i use once or on?
            node.on.data('done', function(msg) {
                var id, otherId;
                var blueChoice;
                var playerObj;
                var roles;

                id = msg.from;
                otherId = node.game.matcher.getMatchFor(id);
                roles = getRoles(id, otherId);

                if (id === roles.BLUE) {
                    blueChoice = msg.data.LEFT ? 'LEFT' : 'RIGHT';

                    node.game.choices[roles.RED].blueChoice = blueChoice;

                    playerObj = node.game.pl.get(id);

                    if (playerObj.clientType !== 'bot') {
                        if (node.game.choices[roles.RED].blueChoice === 'RIGHT') {
                            channel.numChooseRight += 1;
                        }
                        channel.numRightLeftDecisions += 1;
                        // console.log('RIGHT/LEFT: ' + channel.numChooseRight / channel.numRightLeftDecisions);
                    }

                    // TODO: move validation to before node.game.choices[roles.RED].blueChoice is assigned
                    if (msg.data.LEFT || msg.data.RIGHT) {
                        node.say('BLUE-CHOICE', roles.RED, blueChoice);
                    }
                    else {
                        node.err('Error: Invalid Blue choice. ID of sender: '+id);
                    }
                }
                // else {
                // node.err('Error: Sender not Blue player. ID of sender: '+id);
                // }
            });
        },
        stepRule: stepRules.SOLO
    });

    stager.extendStep('results', {
        cb: function() {
            var payoffs, results;
            var allMatchesInRound;
            var match;
            var roles;
            var i;

            allMatchesInRound = node.game.matcher.matcher.getMatch(node.getCurrentGameStage().round);

            for (i = 0; i < allMatchesInRound.length; i++) {
                match = allMatchesInRound[i];
                roles = getRoles(match[0], match[1]);
                payoffs = calculatePayoffs(node.choices[roles.RED], node.tables[roles.RED]);

                addData(node.game.roles.RED, payoffs.red);
                addData(node.game.roles.BLUE, payoffs.blue);

                results = {
                    payoffs: payoffs,

                    choices: {
                        red: node.game.choices[roles.RED].redChoice,
                        blue: node.game.choices[roles.RED].blueChoice
                    }
                };

                node.say('RESULTS', roles.RED, results);
                node.say('RESULTS', roles.BLUE, results);

            }
        }
    });

    stager.extendStep('end', {
        cb: function() {
            node.on.data('done', function(msg) {
                saveAll();
            });
        }
    });

    function getRoles(id1, id2) {
        var redId, blueId;

        if (node.game.matcher.getRoleFor(id1) === 'RED') {
            redId = id1;
            blueId = id2;
        }
        else {
            redId = id2;
            blueId = id1;
        }

        return {
            RED: redId,
            BLUE: blueId
        };
    }

    function addData(playerId, data) {
        var item = node.game.memory.player[playerId].last();
        item.bonus = data;
    }

    // returns payoffs as a object
    function calculatePayoffs(choices, table) {
        var payoffs, bluePayoff, redPayoff;
        var blueChoice;

        payoffs = settings.payoffs;
        blueChoice = choices.blueChoice.toLowerCase();

        if (choices.redChoice === 'GO') {
            bluePayoff = payoffs.go[table][blueChoice].blue;
            redPayoff = payoffs.go[table][blueChoice].red;
        }
        else {
            node.game.worldState = 'B';
        }
    }

    function getRandomTable() {
        var payoffTable;

        // TODO: double check is pi chance for A or B?
        if (Math.random() < node.game.settings.pi) {
            payoffTable = 'A';
        }
        else {
            payoffTable = 'B';
        }

        return payoffTable;
        // console.log('THE STATE OF THE WORLD IS: ' + node.game.payoffTable);
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


    return {
        nodename: 'lgc' + counter,
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),
        // If debug is false (default false), exception will be caught and
        // and printed to screen, and the game will continue.
        debug: settings.DEBUG,
        // Controls the amount of information printed to screen.
        verbosity: -100
    };
}
