

/**
 * Data for a single person
 */
export interface Person {
    name?:          string;
    affiliation?:   string;
    editor?:        boolean;
    chair?:         boolean;
    staff_contact?: boolean;

    /** This is an administrative flag: signals that a person has to be removed from a specific list eventually */
    remove?: boolean;

    /**
     * For some HTML templates the people in the separate list are to be listed separately via the HTML template
     * A true value means to keep the person in the full list; false or missing value means to remove it from there.
     * If the editors and chairs are listed separately, then this value is missing (or is false), otherwise set to true. If the formulation
     * of the HTML template is such that the editors thank the WG members, then their name should not be kept in the final list, so these
     * values are missing; everyone else's (chair's) is set to true.
     */
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
    /** Just of the lazy user who does not want to type the document name... */
    default?: DocumentConfig;

    /** The list of document configurations, indexed by a document name */
    documents?: DocumentConfigMap;
}

/**
 * Configuration for a single document,
 * extracted from the general configuration files.
 */
export interface DocumentConfigRuntime {
    /** This is the group ID, used as part of the api calls */
    id: string;

    /** Reference to the output file (if not there, standard output is used) */
    output?: string;

    /** Data extracted from the explicit list */
    list: Person[];

    /** HTML source, extracted from the HTML pattern */
    template: string;
}
