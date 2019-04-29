#!/usr/bin/env node

'use strict';

const { get_configuration } = require('./lib/get_config');
const { create_ack_section } = require('./lib/get_data');

const debug = true;

async function main() {
    try {
        const config = await get_configuration();
        await create_ack_section(config);
        // if (config) {
        //     if (debug) console.log(JSON.stringify(config, null, 4));
        // }
    } catch (e) {
        console.error(`${e.toString()}`);
        process.exit();
    }
}

// Do it!
main();
