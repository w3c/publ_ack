/* eslint-disable no-else-return */

'use strict';

const _                 = require('underscore');
const fs                = require('fs');
const path              = require('path');
const program           = require('commander');
const fetch             = require('node-fetch');

const user_config_name = '.publ_ack.json';

/**
 * Get the extended configuration for the main run:
 *
 * * Collects the program arguments
 * * Fetches the local configuration (JSON) file
 * * Fetches the local user configuration file
 * * Fetches the explicit-list for acknowledgement
 * * Fetches the html pattern
 * * Creates the structure that can be used to collect the data
 *
 * @async
 * @returns {Object} - Final configuration data, see the definition of the data collection
 */
async function get_configuration() {
    /**
    * Fetches files
    *
    * @async
    * @param {string} url - file name
    * @param {boolean} json - whether the return value is supposed to be JSON
    * @returns {object} - either the parsed JSON content, or a text
    */
    const get_file = async (url, json = true) => {
        const response =  await fetch(url);
        if (response.ok) {
            return (json) ? response.json() : response.text();
        } else {
            throw new Error(`ERROR: HTTP response for the file ${url}: ${response.status}: ${response.statusText} for ${url}`);
        }
    };

    /**
    * Read a configuration file
    *
    * @param {string} file_name - file name
    * @param {boolean} warn - whether warn for a non-existent file
    * @returns {object} - the parsed JSON content
    */
    const conf_file = (file_name, warn = true) => {
        try {
            const file_c = fs.readFileSync(file_name, 'utf-8');
            return JSON.parse(file_c);
        } catch (e) {
            if (warn) console.error(`ERROR: Could not find or configuration file: ${file_name}! \n    (${e})`);
            return {};
        }
    };

    const check_final_config = (config, group) => {
        if (!('api_key' in config)) {
            console.log('ERROR: W3C API key is missing');
            return false;
        } else if (!config.documents) {
            console.log('ERROR: no references to documents');
            return false;
        } else if (!group) {
            console.log('ERROR: no group identified');
            return false;
        } else if (!config.documents[group]) {
            console.log(`ERROR: invalid document identifier: ${group}`);
            return false;
        } else if (!config.documents[group].id) {
            console.log(`ERROR: no ID value provided for document ${group}`);
        } else if (!config.documents[group].html_pattern) {
            console.log(`ERROR: no HTML template provided for document ${group}`);
        } else {
            return true;
        }
    };

    program
        .usage('[options] [file]')
        .option('-c, --config [config]', 'JSON configuration file')
        .option('-d, --document [group]', 'document identifier')
        .option('-o, --output [file]', 'output file name (default: standard output)')
        .on('--help', () => {
            console.log('');
            console.log('  file:                   JSON configuration file');
        })
        .parse(process.argv);

    const file_config = (program.config !== undefined || program.args.length !== 0) ? conf_file(program.config || program.args[0]) : {};
    const user_config = (process.env.HOME) ? conf_file(path.join(process.env.HOME, user_config_name), false) : {};
    const final_documents = _.extend(user_config.documents, file_config.documents);
    const final_config = _.extend(user_config, file_config);
    final_config.documents = final_documents;

    // Check if we have a configuration file in the first place
    if (!_.isEmpty(final_config)) {
        const group = program.document || final_config.default;
        // check the configuration file, to see if it is valid
        if (!check_final_config(final_config, group)) {
            return undefined;
        } else {
            const document_config = final_config.documents[group];
            document_config.api_key = final_config.api_key;
            document_config.output = program.output;
            // the explicit list is not required...
            if (document_config.explicit_list) {
                const promises = [get_file(document_config.explicit_list, true), get_file(document_config.html_pattern, false)];
                [document_config.list, document_config.template] = await Promise.all(promises);
            } else {
                document_config.list = [];
                document_config.template = await get_file(document_config.html_pattern, false);
            }
            // filter out entries in separate list without a name
            document_config.list = _.filter(document_config.list, (person) => person.name);
            return document_config;
        }
    } else {
        console.log('ERROR: Empty configuration');
        return undefined;
    }
}

/* -------------------------------------------------------------------------------- */
module.exports = { get_configuration };
