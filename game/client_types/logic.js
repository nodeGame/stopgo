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

    stager.setDefaultStepRule(stepRules.SOLO);

    stager.setOnInit(function() {

        node.on.data('tour-over', function(msg) {
            var db;

            // Move client to part2.
            // (async so that it finishes all current step operations).
            setTimeout(function() {
                // console.log('moving to stopgo interactive: ', msg.from);
                channel.moveClientToGameLevel(msg.from, 'stopgo-interactive',
                                              gameRoom.name);
            }, 10);

            // Save client's data.
            if (node.game.memory.player[msg.from]) {
              db = node.game.memory.player[msg.from];
              // node.game.memory.save('aa.json');
              db.save('data_tour.json', { flag: 'a' });
            }
        });
    });

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
