// deno-lint-ignore-file no-explicit-any
/* eslint-disable no-else-return */
import { Person, DocumentConfig, ConfigFile, DocumentConfigRuntime, DocumentConfigMap } from "./types.ts";
import * as path    from "https://deno.land/std/path/mod.ts";
import { Command }  from 'npm:commander';


interface CommandLineConfig {
    config?:   string;
    document?: string;
    output?:   string
}

const user_config_name = '.publ_ack.json';

/**
 * Handle command line arguments
 * 
 * @returns Command line arguments
 */
function get_commands(): CommandLineConfig {
    const result: CommandLineConfig = {};
    const program = new Command();
    program
        .name('publ_ack')
        .description('Generate the acknowledgement section for W3C documents.')
        .version('2.0.0', '-v --version', 'Output program version')
        .usage('[options] [config]')
        .argument('[config]', "JSON Configuration file (overwrites option)")
        .option('-c --config [config]', "JSON Configuration file")
        .option('-d --document [document]', "document identifier")
        .option('-o --output [output]', "output file name (default: standard output)")
        .action((config, options) => {
            result.config = options.config;
            result.document = options.document;
            result.output = options.output;
            if (config) {
                result.config = config;
            }      
        })
        // This is just mimic the process.argv that is used for node.js
        .parse(["", "", ...Deno.args]);
    return result;
}


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
 * @returns Final configuration data, see the definition of the interface
 */
export async function get_configuration(): Promise<DocumentConfigRuntime> {
    /**
    * Fetches files
    *
    * @async
    * @param {string} url - file name
    * @param {boolean} json - whether the return value is supposed to be JSON
    * @returns {object} - either the parsed JSON content, or a text
    */
    const get_file = async (url: string, json = true): Promise<any> => {
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
    * @returns {object} - the parsed JSON content
    */
    const conf_file = (file_name: string): ConfigFile => {
        try {
            const file_c = Deno.readTextFileSync(file_name);
            return JSON.parse(file_c) as ConfigFile;
        } catch (e) {
            throw new Error(`ERROR: Could not find or configuration file: ${file_name}! \n    (${e})`);
        }
    };

    const check_final_config = (config: ConfigFile, group: string): boolean => {
        if (!config.documents) {
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
            return false;
        } else if (!config.documents[group].html_pattern) {
            console.log(`ERROR: no HTML template provided for document ${group}`);
            return false;
        } else {
            return true;
        }
    };

    const program: CommandLineConfig = get_commands();

    const file_config: ConfigFile = (program.config !== undefined) ? conf_file(program.config) : {};

    const home = Deno.env.get("HOME");
    const user_config: ConfigFile = (home) ? conf_file(path.join(home, user_config_name)) : {};

    const final_documents: DocumentConfigMap  = { ...user_config.documents, ...file_config.documents };
    const final_config: ConfigFile = { ...user_config, ...file_config };
    final_config.documents = final_documents;

    // Check if we have a configuration file in the first place!
    if (Object.keys(final_config).length > 0) {
        const tentative_group = program.document || final_config.default;
        if (tentative_group !== undefined) {
            const group: string = tentative_group as string;
            // check the configuration file, to see if it is valid
            if (!check_final_config(final_config, group)) {
                console.log('ERROR: Information incomplete or wrong');
                return {} as DocumentConfigRuntime;
            } else {
                const document_config: DocumentConfig = final_config.documents[group];

                // Get hold of the HTML template and the list of persons
                let list: Person[];
                let template: string;

                // the explicit list is not required, so it must be checked before trying to read it...
                if (document_config.explicit_list) {
                    const promises: Promise<any>[] = [get_file(document_config.explicit_list, true), get_file(document_config.html_pattern, false)];
                    const [list_raw, template_raw] = await Promise.all(promises);
                    list = list_raw as Person[];
                    template = template_raw as string;
                    // Retain only the persons with a name
                    list = list.filter((person: Person): boolean => person.name !== undefined);
                } else {
                    list = [];
                    template = await get_file(document_config.html_pattern, false) as string;
                }

                return {
                    id       : document_config.id,
                    output   : program.output,
                    list     : list,
                    template : template
                }
            }
        } else {
            console.log('ERROR: No group has been identified');
            return {} as DocumentConfigRuntime;
        }
    } else {
        console.log('ERROR: Empty configuration');
        return {} as DocumentConfigRuntime;
    }
}
