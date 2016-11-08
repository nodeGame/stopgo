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
    var channel =  gameRoom.channel;

    // Must implement the stages here.

    // Increment counter.
    counter = counter ? ++counter : settings.SESSION_ID || 1;

    stager.setOnInit(function() {

        // Initialize the client.

    });

    stager.extendStep('instructions', {
        cb: function() {
            console.log('Instructions.');
        }
    });

    stager.extendStep('stoporgo', {
        cb: function() {
            console.log('Game round: ' + node.player.stage.round);
            doStateOfTheWorld();
            doMatch();
            node.once.data('done', function(msg) {
                node.game.redChoice = msg.data.stop ? 'stop' : 'go';
                node.say('redChoice', node.game.bluePlayerId,
                         node.game.redChoice);
                console.log('RECEIVED DONE: ', msg);
            });
        }
    });

    stager.extendStep('leftorright', {
        cb: function() {
            node.on.data('done', function(msg) {
                node.game.blueChoice = msg.data.left ? 'left' : 'right';
                console.log('RECEIVED DONE: ', msg);
                // if the game is always played by two players, this works well

                node.done();
            });
        },
        stepRule: stepRules.SOLO
    });


    stager.extendStep('results', {
        cb: function() {
            computePayoff();
        }
    });

    stager.extendStep('end', {
        cb: function() {

            node.on.data('done', function(msg) {
                var item;
                item = node.game.memory
                    .select('player', '=', msg.from)
                    .last();
            });

            node.game.memory.save(channel.getGameDir() + 'data/data_' +
                                  node.nodename + '.json');
        }
    });

    stager.setOnGameOver(function() {

        // Something to do.

    });

    // Here we group together the definition of the game logic.
    return {
        nodename: 'lgc' + counter,
        // Extracts, and compacts the game plot that we defined above.
        plot: stager.getState(),

    };

    // Helper functions.

    function doStateOfTheWorld() {
        if (Math.random() > node.game.settings.pi) {
            node.game.worldState = 'A';
        }
        else {
            node.game.worldState = 'B';
        }
    }

    function doMatch() {
        var players, len;
        len = node.game.pl.size();
        players = node.game.pl.shuffle().id.getAllKeys();
        node.game.bluePlayerId = players[1];
        node.game.redPlayerId = players[0];
        node.say('ROLE_RED', players[0], node.game.worldState);
        node.say('ROLE_BLUE', players[1]);
    }

    function computePayoff() {
        // remember to recompute totals after practice round
        var p, blueP, redP;
        p = settings.payoff;
        if (node.game.redChoice === 'go') {
            blueP = p.go[node.game.worldState]['blue' + node.game.blueChoice];
            redP = p.go[node.game.worldState]['red' + node.game.blueChoice];
        }
        else {
            blueP = p.stop.blue;
            redP = p.stop.red;
        }
        node.say('payoff', 'ROOM', { blue: blueP, red: redP });
        // channel.registry.get(node.game.bluePlayerId).totalBonus =
        // node.game.memory

        node.on.data('done', function(msg) {
            var item = node.game.memory.select('player', '=', msg.from).last();

            if (msg.from === node.game.bluePlayerId) {
                item.bonus = blueP;
            }
            else {
                item.bonus = redP;
            }
        });
    }
};
