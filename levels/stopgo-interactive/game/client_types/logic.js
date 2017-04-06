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
        node.game.totals = {};

        //node.on.pconnect(function(player) {
        //    console.log('SOMEBODY CONNECTED!!! ', player);
        //    gameRoom.setupClient(player.id);
        //});

        node.on.pdisconnect(function(player) {
            player.allowReconnect = false; // check if registry maybe

            var bot = channel.connectBot({
                room: gameRoom,
                // id: player.id, Otherwise it gets the wrong clinetType
                clientType: 'bot',
                setup: {
                    settings: {
                        botType: 'dynamic',
                        // 'dynamic' for based on player results
                        chanceOfStop: 0.5,
                        chanceOfRight: 0.5
                    }
                },
                // TODO: if replaceId is set should options from old data.
                replaceId: player.id,
                gotoStep: node.player.stage,
                gotoStepOptions: {
                    plot: { role: node.game.matcher.getRoleFor(player.id) }
                }
            });
            
            //bot.on('PLAYER_CREATED', function() {
            setTimeout(function() {
                return;
                debugger
                node.game.matcher.replaceId(player.id, bot.player.id);

                bot.game.start({ step: false });
                
                bot.game.gotoStep(node.player.stage, {
                    role: node.game.matcher.getRoleFor(player.id)
                });
            }, 3000);

        });


        // stager.setDefaultProperty('minPlayers', [
        //    1,
        //    function() {
    });

    stager.extendStep('red-choice', {
        matcher: {
            roles: [ 'RED', 'BLUE' ],
            fixedRoles: true,
            canMatchSameRole: false,
            match: 'roundrobin',
            cycle: 'repeat'//,
            // skipBye: false,
            // sayPartner: false
        },
        cb: function() {
            var allMatchesInRound;
            var i;
            var match;
            var roles;
            var payoffTable;

            allMatchesInRound = node.game.matcher.getMatches('ARRAY_ROLES_ID');

            // allMatchesInRound = node.game.matcher.getMatches();

            for (i = 0; i < allMatchesInRound.length; i++) {
                // was:
                // match = allMatchesInRound[i];
                // roles = getRoles(match[0], match[1]);

                roles = allMatchesInRound[i];
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

                console.log('DONE: '+id);

                if (id === roles.RED) {
                    redChoice = msg.data.redChoice;
                    node.game.choices[roles.RED] = { redChoice: redChoice };

                    if (playerObj.clientType !== 'bot') {
                        if (redChoice === 'STOP') {
                            channel.numChooseStop += 1;
                        }
                        channel.numStopGoDecisions += 1;
                    }

                    // validate selection
                    // TODO: move validation to before node.game.redChoice
                    // is assigned.
                    if (msg.data.redChoice) {
                        node.say('RED-CHOICE', roles.BLUE, redChoice);
                    }
                    else {
                        // console.log('aaaaaah',msg)
                        node.err('Error: Invalid Red choice. '+
                                 'ID of sender: '+id);
                    }
                }
            });
        }
    });

    stager.extendStep('blue-choice', {
        cb: function() {
            node.on.data('done', function(msg) {
                var id, otherId;
                var blueChoice;
                var playerObj;
                var roles;

                id = msg.from;
                otherId = node.game.matcher.getMatchFor(id);
                roles = getRoles(id, otherId);

                if (id === roles.BLUE) {
                    blueChoice = msg.data.blueChoice;

                    node.game.choices[roles.RED].blueChoice = blueChoice;

                    playerObj = node.game.pl.get(id);

                    if (playerObj.clientType !== 'bot') {
                        if (node.game.choices[roles.RED].blueChoice
                            === 'RIGHT') {
                            channel.numChooseRight += 1;
                        }
                        channel.numRightLeftDecisions += 1;
                        // console.log('RIGHT/LEFT: ' + channel.numChooseRight
                        // / channel.numRightLeftDecisions);
                    }

                    // TODO: move validation to before
                    // node.game.choices[roles.RED].blueChoice is assigned
                    if (msg.data.blueChoice) {
                        node.say('BLUE-CHOICE', roles.RED, blueChoice);
                    }
                    else {
                        console.log('missing blueChoice ', id);
                        node.err('Error: Invalid Blue choice. ' +
                                 'ID of sender: '+id);
                    }
                }
                else {
                    console.log('IT IS RED ', id);
                }
            });
        }
    });

    stager.extendStep('results', {
        cb: function() {
            var payoffs, results;
            var allMatchesInRound;
            var match;
            var roles;
            var i;

            allMatchesInRound = node.game.matcher.getMatches('ARRAY_ROLES_ID');

            for (i = 0; i < allMatchesInRound.length; i++) {
                // was:
                // match = allMatchesInRound[i];
                // roles = getRoles(match[0], match[1]);

                roles = allMatchesInRound[i];

                payoffs = calculatePayoffs(node.game.choices[roles.RED],
                                           node.game.tables[roles.RED]);

                if (!node.game.totals[roles.RED]) {
                    node.game.totals[roles.RED] = 0;
                }
                node.game.totals[roles.RED] += payoffs.RED;;

                if (!node.game.totals[roles.BLUE]) {
                    node.game.totals[roles.BLUE] = 0;
                }
                node.game.totals[roles.BLUE] += payoffs.BLUE;;

                addData(roles.RED, payoffs.RED);
                addData(roles.BLUE, payoffs.BLUE);

                results = {
                    payoffs: payoffs,

                    choices: {
                        RED: node.game.choices[roles.RED].redChoice,
                        BLUE: node.game.choices[roles.RED].blueChoice
                    },

                    world: node.game.tables[roles.RED]
                };

                node.say('RESULTS', roles.RED, results);
                node.say('RESULTS', roles.BLUE, results);

            }
        }
    });

    stager.extendStep('end', {
        cb: function() {
            var code;
            var allMatchesInRound;
            var roles;
            var i;

            allMatchesInRound = node.game.matcher.getMatches('ARRAY_ROLES_ID');

            // allMatchesInRound = node.game.matcher.getMatches();

            for (i = 0; i < allMatchesInRound.length; i++) {
                roles = allMatchesInRound[i];
                code = channel.registry.getClient(roles.RED);

                node.say('WIN', roles.RED, {
                    total: node.game.totals[roles.RED],
                    exit: code.ExitCode
                });

                code = channel.registry.getClient(roles.BLUE);

                node.say('WIN', roles.BLUE, {
                    total: node.game.totals[roles.BLUE],
                    exit: code.ExitCode
                });
            }

            node.on.data('email', function(msg) {
                var id, code;
                id = msg.from;

                code = channel.registry.getClient(id);
                if (!code) {
                    console.log('ERROR: no codewen in endgame:', id);
                    return;
                }

                // Write email.
                appendToCSVFile(msg.data, code, 'email');
            });

            node.on.data('feedback', function(msg) {
                var id, code;
                id = msg.from;

                code = channel.registry.getClient(id);
                if (!code) {
                    console.log('ERROR: no codewen in endgame:', id);
                    return;
                }

                // Write email.
                appendToCSVFile(msg.data, code, 'feedback');
            });

            node.on.data('done', function(msg) {
                saveAll();
            });
        }
    });

    function appendToCSVFile(email, code, fileName) {
        var row, gameDir;

        gameDir = channel.getGameDir();
        row  = '"' + (code.id || code.AccessCode || 'NA') + '", "' +
            (code.workerId || 'NA') + '", "' + email + '"\n';

        fs.appendFile(gameDir + 'data/' + fileName + '.csv', row,
                      function(err) {
            if (err) {
                console.log(err);
                console.log(row);
            }
        });
    }

    function getRoles(id1, id2) {
        var redId, blueId;

        console.log('getRoleFor '+id1+': '+node.game.matcher.getRoleFor(id1));
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
        blueChoice = choices.blueChoice;

        if (choices.redChoice === 'GO') {
            bluePayoff = payoffs.GO[table][blueChoice].BLUE;
            redPayoff = payoffs.GO[table][blueChoice].RED;
        }
        else {
            bluePayoff = payoffs.STOP.BLUE;
            redPayoff = payoffs.STOP.RED;
        }

        return {
            RED: redPayoff,
            BLUE: bluePayoff
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
        var gameDir, line;
        gameDir = channel.getGameDir();
        node.game.memory.save(gameDir + 'data/data_' + node.nodename +
                              '.json');

        line = node.nodename + ',' + channel.numStopGoDecisions +
               ',' + channel.numChooseStop +
               ',' + channel.numRightLeftDecisions +
               ',' + channel.numChooseRight + "\n";

        fs.appendFile(gameDir + 'data/avgDecisions.csv', line, function(err) {
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
