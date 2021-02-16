/** The (necessary) data for a single person */
export interface Person {
    name?: string;
    editor?: string;
    chair?: string;
    affiliation?: string;
    
    /** This is an administrative flag if a person has to be removed from a specific list */
    remove?: boolean;

    /** for some patterns the people in the separate list are to be listed separately via the HTML template */
    keep?: boolean;
}

/**
 * Configuration for a single document, 
 * as part the configuration files.
 */
export interface DocumentConfig {
    /** This is the group ID, used as part of the api calls */
    id: string;

    /** Reference to a JSON file that contains a list of people to be treated separately (chairs, editors) */
    explicit_list?: string;

    /** Reference to a HTML source file, to be used as a template */
    html_pattern: string;
}

/** A mapping from document names to its configuration */
export interface DocumentConfigMap {
    [index: string]: DocumentConfig;
}

/** The structure of the configuration files */
export interface ConfigFile {
    /** API key, to be used with the W3C API calls */
    api_key: string;

    /** Just of the lazy user who does not want to type the document name... */
    default?: DocumentConfig;

    /** The list of document configurations, indexed by a document name */
    documents: DocumentConfigMap;
}

/**
 * Configuration for a single document, 
 * extracted from the general configuration files.
 */
export interface DocumentConfigRuntime {
    /** This is the group ID, used as part of the api calls */
    id: string;

    /** API key, to be used with the W3C API calls */
    api_key: string;

    /** Reference to the output file (if not there, standard output is used) */
    output?: string;

    /** Data extracted from the explicit list */
    list: Person[];

    /** HTML source, extracted from the HTML pattern */
    template: string;
}
