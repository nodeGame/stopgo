/**
* # Logic type implementation of the game stages
* Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
* MIT Licensed
*
* http://www.nodegame.org
* ---
*/

"use strict";

var ngc = require('nodegame-client');
var stepRules = ngc.stepRules;

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var node = gameRoom.node;
    var channel = gameRoom.channel;

    // Must implement the stages here.

    stager.setDefaultStepRule(stepRules.SOLO);

    stager.setOnInit(function() {

        node.on.data('tutorial-over', function(msg) {
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
                db.save('data_tutorial.json', { flag: 'a' });
            }
        });
    });
}
