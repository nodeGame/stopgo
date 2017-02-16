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
        'instructions-light': 20000
        // instructions: 60000
    },

    bidTime: 60000,

    // # Game specific properties

    // Number of game rounds repetitions in practice.
    REPEAT_PRACTICE: 3,

    tour: [
        {
            RED: 'GO',
            BLUE: 'LEFT'
        },
        {
            RED: 'GO',
            BLUE: 'RIGHT'
        },
        {
            RED: 'STOP',
            BLUE: 'RIGHT' // eventually make it use RANDOM as a keyword
        }
    ],

    // Number of game rounds repetitions.
    REPEAT: 3,

    // Payoffs of the game.
    payoffs: {
    	STOP: {
            RED: 3,
    		BLUE: 3
    	},
    	GO: {
    		A: {
                LEFT: {
                    RED: 0,
                    BLUE: 6
                },
                RIGHT: {
                    RED: 10,
                    BLUE: 0
                }
    		},
    		B: {
                LEFT: {
                    RED: 6,
                    BLUE: 0
                },
                RIGHT: {
                    RED: 0,
                    BLUE: 10
                }
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
