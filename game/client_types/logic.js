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
var fs = require('fs');

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    var node = gameRoom.node;
    var channel = gameRoom.channel;

    // Must implement the stages here.

    stager.setDefaultStepRule(stepRules.SOLO);

    stager.setOnInit(function() {
        
        // Saves time, id and worker id of connected clients (with timeout).
        (function() {
            var saveWhoConnected;
            var cacheToSave, timeOutSave;
            var codesFile;        
            var dumpDbInterval;

            dumpDbInterval = 30000;

            codesFile = gameRoom.dataDir + 'codes.csv'
            
            cacheToSave = [];
            saveWhoConnected = function(p) {

                cacheToSave.push(
                    Date.now() + "," + p.id + "," +
                        (p.WorkerId || 'NA') + "," +
                        (p.userAgent ? '"' + p.userAgent + '"' : 'NA')
                );

                if (!timeOutSave) {
                    timeOutSave = setTimeout(function() {
                        var txt;
                        txt = cacheToSave.join("\n") + "\n";
                        cacheToSave = [];
                        timeOutSave = null;
                        fs.appendFile(codesFile, txt, function(err) {
                            if (err) {
                                console.log(txt);
                                console.log(err);
                            }
                        });
                    }, dumpDbInterval);
                }
            }
            if (node.game.pl.size()) node.game.pl.each(saveWhoConnected);
            node.on.pconnect(saveWhoConnected);
        })();
        //////////////////////////////////

        
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

    stager.setDefaultProperty('reconnect', function(player, obj) {
        var stage;
        stage = player.disconnectedStage;
        if (stage.stage === 3) {
            // Go to the beginning...
            obj.targetStep = '2.1.1';
            return;
        }

        // TODO: attempt to recover exact step. Too messy.
 //       var tutorialRole, world;
 //     
 //        // Tutorial Stage.
 //        if (stage.stage === 3) {
 //            tutorialRole = node.game.memory.player[player.id];
 //            if (tutorialRole) {
 //                tutorialRole = tutorialRole.selexec('tutorialRole').first();
 //                if (tutorialRole) tutorialRole = tutorialRole.tutorialRole;
 //            }
 //            // Something is wrong, client will be disposed.
 //            if (!tutorialRole) return false;
 // 
 //            // Results.
 //            if (stage.step === 3) {
 //                // Save info for the callback.
 //                obj.tutorialRole = tutorialRole;
 //                // Keep the role, do not check.
 //                obj.plot.role = true;
 //                // Set the role BEFORE plot.role is evaluated.
 //                obj.cb = function(opts) {
 //                    this.role = opts.tutorialRole;
 //                };
 //            }
 //            // Decision Blue.
 //            else if (stage.step === 2) {
 //                if (tutorialRole === 'RED') {
 //                world = node.game.memory.player[player.id].selexec('world');
 //                    if (world) world.first();
 //                    if (world) world = world.world;
 // 
 //                    // Something is wrong, client will be disposed.
 //                    if (!world) return false;
 //                }
 //                else {
 //                    // Random for blue.
 //                    world = Math.random() > 0.5 ? 'A' : 'B';
 //                }
 //                obj.world = world;
 //                obj.plot.role = tutorialRole;
 //                obj.plot.frame = 'stopgostep.htm';
 //                obj.cb = function(opts) {
 //                    this.tutorialWorldState = opts.world;
 //                    this.tutorialChoices =
 //                        this.settings.tutorial[(this.getRound()-1)];
 //                };
 //            }
 //            // Decision Red.
 //            else {
 //                obj.plot.role = tutorialRole;
 //            }
 //       }
    });
}
