/**
 * # Game settings definition file
 * Copyright(c) 2016 brenste <myemail>
 * MIT Licensed
 *
 * The variables in this file will be sent to each client and saved under:
 *
 *   `node.game.settings`
 *
 * The name of the chosen treatment will be added as:
 *
 *    `node.game.settings.treatmentName`
 *
 * http://www.nodegame.org
 * ---
 */
module.exports = {

    // Variables shared by all treatments.

    // #nodeGame properties:

    /**
     * ## SESSION_ID (number)
     *
     * The name of the first session of the channel
     *
     * The waiting room assigns sequential session ids to every newly
     * spawn game room. The session id is saved in each entry in the
     * memory database of the logics, and used as the name of the
     * session folder in the data/ directory.
     */ 
    SESSION_ID: 1,

    /**
     * ### TIMER (object) [nodegame-property]
     *
     * Maps the names of the steps of the game to timer durations
     *
     * If a step name is found here, then the value of the property is
     * used to initialize the game timer for the step.
     */
    TIMER: {
        instructions: 60000
    },

    // # Game specific properties

    // Number of game rounds repetitions in practice.
    REPEAT_PRACTICE: 3,
    
    // Number of game rounds repetitions.
    REPEAT: 3,
    
    // Payoffs of the game.
    payoff: {
    	stop: {
    		blue: 3,
    		red: 3
    	},
    	go: {
    		A: {
    			redleft: 0,
    			blueleft: 6,
    			redright: 10,
    			blueright: 0
    		},
    		 
    		B: {
    			redleft: 6,
    			blueleft: 0,
    			redright: 0,
    			blueright: 10
    		}
    	}
    },
    
    // Probability of A vs B.
    pi: 0.5,
    
    
    // # Treatments definition.

    // They can contain any number of properties, and also overwrite
    // those defined above.

    // If the `treatments` object is missing a treatment named _standard_
    // will be created automatically, and will contain all variables.

    treatments: {

        standard: {
            fullName: "Standard Treatment",
            description: "Standard time"
        }
    }
};
