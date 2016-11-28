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

    stager.extendStep('instructions', {
        cb: function() {
            console.log('Instructions.');
        }
    });

    stager.setOnGameOver(function() {

        // Something to do.

    });

    stager.extendStep('red-choice', {
        matcher: {
            roles: [ 'RED', 'BLUE', 'SOLO'],
            match: 'random',
            cycle: 'repeat',
            skipBye: false,
            sayPartner: false,
        },
        cb: function() {
            assignRolesAndMatches();
            assignTable();
            node.once.data('done', function(msg) {
                node.game.choices.red  = msg.data.choice;
                var id = msg.data.id;
                var redChoice = node.game.choices.red;

                // validate selection
                if (id === node.game.roles.RED && (redChoice === 'GO' || redChoice === 'STOP')) {
                    node.say('RED-CHOICE', node.game.roles.BLUE, redChoice);
                }
                else {
                    console.log('Error: Invalid Red choice.');
                }
            };
        }
    });

    stager.extendStep('blue-choice', {
        cb: function() {
            // ??? should i use once or on?
            node.once.data('done', function(msg) {
                node.game.choices.blue = msg.data.choice;
                var id = msg.data.id;
                var blueChoice = node.game.choices.blue;

                if (id === node.game.roles.BLUE && (blueChoice === 'LEFT' || blueChoice === 'RIGHT')) {
                    node.say('BLUE-CHOICE', node.game.roles.RED, blueChoice);
                }
                else {
                    console.log('Error: Invalid Blue choice');
                }
            }
        }
    });

    stager.extendStep('results', {
        cb: function() {
            calculatePayoffs();
            // saveResults();
            // updateBotAverages();
        }
    });

    stager.extendStep('end', {
        cb: function() {
            saveData();
            updateBotBehavior();
        }
    });

    function calculatePayoffs() {

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

    function assignRolesAndMatches() {
        var match, id1, id2, soloId;

            // Generates new random matches for this round.
            node.game.matcher.match(true)
            match = node.game.matcher.getMatch();

            // Resets all roles.
            node.game.roleMapper = {};

            // While we have matches, send them to clients.
            while (match) {
                id1 = match[node.game.roles.RED];
                id2 = match[node.game.roles.BLUE];

                if (id1 !== 'bot' && id2 !== 'bot') {
                    node.say('ROLE', id1, {
                        role: 'RED',
                        other: id2
                    });
                    node.say('ROLE', id2, {
                        role: 'BLUE',
                        other: id1
                    });
                    node.game.roleMapper[id1] = 'RED';
                    node.game.roleMapper[id2] = 'BLUE';
                }
                // else {
                //     // ???
                //     soloId = id1 === 'bot' ? id2 : id1;
                //     node.say('ROLE', soloId, {
                //         role: 'SOLO',
                //         other: null
                //     });
                //     node.game.roleMapper[soloId] = 'SOLO';
                //
                // }
                match = node.game.matcher.getMatch();
            }
            console.log('Matching completed.');
        }
    }

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),

    };

};
