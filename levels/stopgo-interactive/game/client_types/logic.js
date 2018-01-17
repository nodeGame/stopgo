/**
 * # Logic type implementation of the game stages
 * Copyright(c) 2018 Stefano Balietti <ste@nodegame.org>
 * MIT Licensed
 *
 * http://www.nodegame.org
 * ---
 */

"use strict";

var fs = require('fs');
var path = require('path');
var ngc = require('nodegame-client');

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var node = gameRoom.node;
    var channel = gameRoom.channel;

    // Must implement the stages here.

    // Adjust according to the value in waiting room.
    stager.setDefaultProperty('minPlayers', channel.waitingRoom.GROUP_SIZE);

    // Push slow/failed players.
    stager.setDefaultProperty('pushPlayers', true);

    stager.setOnInit(function() {

        // Initialize the client.
        readBotData('avgDecisions.csv');

        node.game.choices = {};
        node.game.tables = {};
        
        // Add session name to data in DB.
        this.memory.on('insert', function(o) {
            o.room = node.nodename;
            o.treatment = treatmentName;
            o.bot = !!channel.bots[o.player];
        });
        
        ////////////////////////////////
        // Test. Make sure we know when a client is done.
        node.game.stepDone = {};
        node.on.data('done', function(msg) {
            node.game.stepDone[msg.from] = true;
            // This fucks up things!
            // channel.registry.updateClient(msg.from, { stageLevel: 100 });
        });
        node.on.step(function() {
            node.game.stepDone = {};
        });
        ////////////////////////////////
        
        node.on.pdisconnect(function(player) {
            var role, options, gameStage;

            player.allowReconnect = false;
            
            gameStage = node.player.stage;
            // Do nothing in the EndScreen stage.
            if (gameStage.stage > 2) return;

            if (channel.registry.isRemote(player)) {

                options = {
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
                    replaceId: player.id,
                    gotoStep: node.player.stage,
                    ready: function(bot) {
                        node.game.tables[bot.player.id] =
                            node.game.tables[player.id];

                        // Save the Red choice, if it was done already.
                        if (node.game.choices[player.id]) {
                            node.game.choices[bot.player.id] =
                                node.game.choices[player.id];
                        }   
                    }
                };

                options.gotoStepOptions = { plot: {} };

                // Add role and partner if in the game stage.
                if (gameStage.stage === 2) {
                    if (gameStage.step !== 3) {
                        options.gotoStepOptions = {
                            plot: { 
                                partner: node.game.matcher.getMatchFor(player.id),
                                role: node.game.matcher.getRoleFor(player.id)
                            }
                        };
                    }
                    console.log(options.gotoStepOptions);
                }
                
                if (node.game.stepDone[player.id]) {
                    options.gotoStepOptions.beDone = true;
                    options.gotoStepOptions.plot.autoSet = null;
                }

                // In theory the 'replaceId' option should take care of 
                // everything. In practice, it can be the stageLevel is
                // not yet updated even after a DONE message has been sent.
                // Moreover, we do not know if a role/partner set earlier
                // is still valid. We need to rework the method.
                channel.connectBot(options);
                
            }

        });
    });

    stager.extendStep('red-choice', {
        matcher: {
            validity: 'stage',
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
            
            console.log('LOGIC>>>>>>>>>>>>>RED-CHOICE-STAGE');

            allMatchesInRound = node.game.matcher.getMatches('ARRAY_ROLES_ID');

            for (i = 0; i < allMatchesInRound.length; i++) {
                roles = allMatchesInRound[i];
                payoffTable = getRandomTable();
                node.game.tables[roles.RED] = payoffTable;
                node.say('TABLE', roles.RED, payoffTable);
            }

            node.on.data('done', function(msg) {
                var id, otherId;
                var playerObj;
                var role;
                var redChoice;
                
                id = msg.from;
                role = node.game.matcher.getRoleFor(id);
                otherId = node.game.matcher.getMatchFor(id);
                // Add info to data, so that it is saved in database.
                msg.data.partner = otherId;

                // console.log('RedStep----------done ',
                // role, id, otherId, msg.data.redChoice);
                
                if (role === 'RED') {
                    playerObj = node.game.pl.get(id);
                    redChoice = msg.data.redChoice;
                    node.game.choices[id] = { redChoice: redChoice };

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
                        node.say('RED-CHOICE', otherId, redChoice);
                    }
                    else {
                        node.err('Invalid Red choice. ID of sender: ' + id);
                    }
                }
            });
        }
    });

    stager.extendStep('blue-choice', {
        cb: function() {
            console.log('LOGIC>>>>>>>>>>>>>BLUE-CHOICE-STAGE');

            node.on.data('done', function(msg) {
                var id, otherId;
                var blueChoice;
                var playerObj;
                var role;
                var choices;

                id = msg.from;
                role = node.game.matcher.getRoleFor(id);
    
                // console.log('BlueStep----------done ', role, id,
                // otherId, msg.data.blueChoice);
                
                if (role === 'BLUE') {
                    otherId = node.game.matcher.getMatchFor(id);
                    choices = node.game.choices;
                    blueChoice = msg.data.blueChoice;
                    choices[otherId].blueChoice = blueChoice;

                    playerObj = node.game.pl.get(id);

                    if (playerObj.clientType !== 'bot') {
                        if (choices[otherId].blueChoice === 'RIGHT') {
                            channel.numChooseRight += 1;
                        }
                        channel.numRightLeftDecisions += 1;
                        // console.log('RIGHT/LEFT: ' + channel.numChooseRight
                        // / channel.numRightLeftDecisions);
                    }

                    // TODO: move validation to before
                    // node.game.choices[roles.RED].blueChoice is assigned
                    if (msg.data.blueChoice) {
                        node.say('BLUE-CHOICE', otherId, blueChoice);
                    }
                    else {
                        node.err('Invalid Blue choice. ID of sender: ' + id);
                    }
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
            var client;

            console.log('LOGIC>>>>>>>>>>>>>RESULTS-STAGE');

            allMatchesInRound = node.game.matcher.getMatches('ARRAY_ROLES_ID');

            for (i = 0; i < allMatchesInRound.length; i++) {

                roles = allMatchesInRound[i];

                payoffs = calculatePayoffs(node.game.choices[roles.RED],
                                           node.game.tables[roles.RED]);

                // Respondent payoff.
                client = channel.registry.getClient(roles.RED);
                client.win = client.win ?
                    client.win + payoffs.RED : payoffs.RED;


                client = channel.registry.getClient(roles.BLUE);
                client.win = client.win ?
                    client.win + payoffs.BLUE : payoffs.BLUE;

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
            
            gameRoom.computeBonus({
                header: [ 'id', 'type', 'workerid', 'hitid',
                          'assignmentid', 'exit', 'bonus' ],
                headerKeys: [ 'id', 'clientType', 'WorkerId',
                              'HITId', 'AssignmentId', 'ExitCode', 'win' ],
                say: true,   // default false
                dump: true,  // default false
                print: true  // default false                
            });

            // Would be nice something like:
            // node.on.data('email').toFile('email');
            
            node.on.data('email', function(msg) {
                var id, code;
                id = msg.from;

                code = channel.registry.getClient(id);
                if (!code) {
                    console.log('ERROR: no code in endgame:', id);
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
                    console.log('ERROR: no code in endgame:', id);
                    return;
                }

                // Write email.
                appendToCSVFile(msg.data, code, 'feedback');
            });

            // Save db and avgDecisions.
            saveAll();
        }
    });

    function appendToCSVFile(email, code, fileName) {
        var row;

        row  = '"' + (code.id || code.AccessCode || 'NA') + '", "' +
            (code.workerId || 'NA') + '", "' + email + '"\n';

        fs.appendFile(gameRoom.dataDir + fileName + '.csv', row, function(err) {
            if (err) {
                console.log(err);
                console.log(row);
            }
        });
    }

    function addData(playerId, data) {
        if (node.game.memory.player[playerId]){
            var item = node.game.memory.player[playerId].last();
            item.bonus = data;
        }
    }

    // returns payoffs as a object
    function calculatePayoffs(choices, table) {
        var payoffs, bluePayoff, redPayoff;
        var blueChoice;

        payoffs = settings.payoffs;
        blueChoice = choices.blueChoice;

        if (choices.redChoice === 'GO') {
            //             console.log('CHOICES');
            //             console.log(choices);
            //             console.log('PAYOFFS.GO');
            //             console.log(payoffs.GO);
            //             console.log(choices);
            try {
                bluePayoff = payoffs.GO[table][blueChoice].BLUE;
                redPayoff = payoffs.GO[table][blueChoice].RED;
            }
            catch(e) {
                debugger;
            }
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
        if (Math.random() < node.game.settings.PI) payoffTable = 'A';
        else payoffTable = 'B';        
        return payoffTable;
        // console.log('THE STATE OF THE WORLD IS: ' + node.game.payoffTable);
    }

    function saveAll() {
        var gameDir, line, avgDecisionFilePath;
        gameDir = channel.getGameDir();
        node.game.memory.save('db.json');
        node.game.memory.save('db.csv', {
            bool2num: true,
            headers: [
                "room", "treatment",
                "time", "timeup", "timestamp", "player", "bot", 
                "stage.stage", "stage.step","stage.round",
                "redChoice", "blueChoice", "bonus", "partner"
            ]
        });

        avgDecisionFilePath = path.resolve(gameDir, 'data', 'avgDecisions.csv');

        if (!fs.existsSync(avgDecisionFilePath)) {
            fs.appendFile(avgDecisionFilePath,
                          'Node,StopGo,Stop,RightLeft,Right\n');
        }

        line = node.nodename + ',' + channel.numStopGoDecisions +
            ',' + channel.numChooseStop +
            ',' + channel.numRightLeftDecisions +
            ',' + channel.numChooseRight + '\n';

        fs.appendFile(avgDecisionFilePath, line, function(err) {
            if (err) console.log('An error occurred saving: ' + line);
        });
    }

    // should be moved out of logic init so only led once
    function readBotData(fileName) {
        var filePath;
        var db;
        var lastLine;
        var decisions;

        filePath = path.resolve(channel.getGameDir(), 'data', fileName);
        if (fs.existsSync(filePath)) {
            db = new ngc.NDDB();
            db.loadSync(filePath);
            lastLine = db.last();
            // console.log(lastLine);
            decisions = lastLine;
            setDecisionsProbabilities(decisions.StopGo,
                                      decisions.Stop,
                                      decisions.RightLeft,
                                      decisions.Right);
        }
        else {
            setDecisionsProbabilities(0, 0, 0, 0);
        }
    }

    function setDecisionsProbabilities(totalStopGo,
                                       totalStop,
                                       totalRightLeft,
                                       totalRight) {

        channel.numStopGoDecisions = totalStopGo;
        channel.numChooseStop = totalStop;
        channel.numRightLeftDecisions = totalRightLeft;
        channel.numChooseRight = totalRight;
    }
}
