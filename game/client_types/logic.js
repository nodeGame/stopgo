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

    stager.extendStep('red-choice', {
        matcher: {
            roles: ['RED', 'BLUE'],
            match: 'roundrobin', // what does this mean???
            // cycle: 'repeat_invert', // what does this mean???
            skipBye: false,
            sayPartner: false,
        },
        cb: function() {
            assignTable();
            node.once.data('done', function(msg) {
                node.game.redChoice = msg.data.choice;
                var id = msg.data.id;
                var redChoice = node.game.redChoice;

                // validate selection
                if (id === node.game.roles.RED && (redChoice === 'GO' || redChoice === 'STOP')) {
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
                node.game.blueChoice = msg.data.choice;
                var id = msg.data.id;
                var blueChoice = node.game.blueChoice;

                if (id === node.game.roles.BLUE && (blueChoice === 'LEFT' || blueChoice === 'RIGHT')) {
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
                payoffs: payoff,

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

        blueChoice = node.game.blueChoice;

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
