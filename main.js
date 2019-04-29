#!/usr/bin/env node

'use strict';

const { get_configuration } = require('./lib/get_config');

const debug = true;

async function main() {
    try {
        const config = await get_configuration();
        if (config) {
            if (debug) console.log(JSON.stringify(config, null, 4));
        }
    } catch (e) {
        console.error(`${e.toString()}`);
        process.exit();
    }
}

// Do it!
main();
