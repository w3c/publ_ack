#!/usr/bin/env node

'use strict';

const fs = require('fs');

const { get_configuration } = require('./lib/get_config');
const { create_ack_section } = require('./lib/get_data');

async function main() {
    try {
        const config = await get_configuration();
        if (config) {
            const html_section = await create_ack_section(config);
            if (config.output) {
                fs.writeFileSync(config.output, html_section);
            } else {
                console.log(html_section);
            }
        }
    } catch (e) {
        console.error(`${e.toString()}`);
        process.exit();
    }
}

// Do it!
main();
