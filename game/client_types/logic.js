/**
* # Logic type implementation of the game stages
* Copyright(c) 2017 Stefano Balietti <ste@nodegame.org>
* MIT Licensed
*
* http://www.nodegame.org
* ---
*/

"use strict";

const ngc = require('nodegame-client');
const stepRules = ngc.stepRules;
const fs = require('fs');
const path = require('path');

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

    let node = gameRoom.node;
    let channel = gameRoom.channel;

    // Must implement the stages here.

    stager.setDefaultStepRule(stepRules.SOLO);

    stager.setOnInit(function() {

        // Saves time, id and worker id of connected clients (with timeout).
        (function() {

            let dumpDbInterval = 30000;

            let codesFile = path.join(gameRoom.dataDir, 'codes.csv');

            let cacheToSave = [];

            let timeOutSave;

            let saveWhoConnected = function(p) {

                cacheToSave.push(
                    Date.now() + "," + p.id + "," +
                        (p.WorkerId || 'NA') + "," +
                        (p.userAgent ? '"' + p.userAgent + '"' : 'NA')
                );

                if (!timeOutSave) {
                    // Keep JS setTimeout here instead of node.timer.setTimeout,
                    // no problem if it always runs.
                    timeOutSave = setTimeout(function() {
                        let txt = cacheToSave.join("\n") + "\n";
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
            // Move client to part2.
            // (async so that it finishes all current step operations).
            node.timer.setTimeout(function() {
                // console.log('moving to stopgo interactive: ', msg.from);
                channel.moveClientToGameLevel(msg.from, 'stopgo-interactive',
                                              gameRoom.name);
            }, 10);

            // Save client's data.
            if (node.game.memory.player[msg.from]) {
                let db = node.game.memory.player[msg.from];
                // node.game.memory.save('aa.json');
                db.save('data_tutorial.json', { flag: 'a' });
            }
        });

    });

    stager.setDefaultProperty('reconnect', function(player, obj) {
        let stage = player.disconnectedStage;
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
