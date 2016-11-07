/**
* # Bot type implementation of the game stages
* Copyright(c) 2016 brenste <myemail>
* MIT Licensed
*
* http://www.nodegame.org
* ---
*/

"use strict";

module.exports = function(treatmentName, settings, stager, setup, gameRoom) {

  var channel = gameRoom.channel;
  var node = gameRoom.node;

  var game;

  game.nodename = 'bot';

  stager.extendStep('instructions',{
    cb: function() {
      node.timer.randomDone();
    }
  });

  stager.extendStep('results',{
    cb: function() {
      node.timer.randomDone();
    }
  });

  stager.extendStep('end',{
    cb: function() {
      node.timer.randomDone();
    }
  });

  stager.extendStep('stoporgo', {
    cb: function() {
      node.on.data('ROLE_RED', function() {
        var randomDoneValue = Math.floor(Math.random() * 2) ? 'stop':'go';
        node.done(randomDoneValue);
      });
    }
  });

  stager.extendStep('leftorright', {
    cb: function() {
      if (node.game.role === 'blue') {
        var randomDoneValue = Math.floor(Math.random() * 2) ? 'right':'left';
        node.done(randomDoneValue);
      }
    }
  });

  game.plot = stager.getState();

  return game;

};
