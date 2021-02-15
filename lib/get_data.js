/* eslint-disable no-underscore-dangle */
/**
 *
 *
 * The data is downloaded via the W3C API. Be patient: if the group is large, at some point it sends out a large number of
 * HTTP requests to get the data of all people...
 *
 * Note that the code includes, in comments, alternatives to cases when _all_, ie, including former, group members are listed.
 * At the moment, there seem to be no requirement for this, but it may come in future...
 *
 */

const fetch = require('node-fetch');

const EXPLICIT_LISTING = '%%EXPLICIT_LISTING%%';
const MEMBER_LISTING   = '%%GROUP_MEMBERS_LISTING%%';

const apicore    = 'https://api.w3.org';

/**
 * Generic function to get to some data in JSON through the W3C API. A standard usage of fetch
 * that returns JSON data.
 *
 * The function relies on the global apikey, necessary for the W3C API call.
 *
 * @param {string} url: the URL that should be used to retrieve data
 * @param {string} key: the W3C API Key to authorize API calls
 * @returns: a Promise with the json representation of the fetched data
 *
 */
async function getData(url, key) {
    const response =  await fetch(`${url}apikey=${key}`);
    if (response.ok) {
        return response.json();
    } else {
        throw new Error(`HTTP response ${response.status}: ${response.statusText}`);
    }
}

/**
 * Get the data of one user
 *
 * @param {string} user_url: the URL identifying the user in the W3C API system
 * @param {string} key: the W3C API Key to authorize API calls
 * @param {number} num: the number of time this has been called (to avoid an infinite cycle...)
 * @returns: a Promise with an object of the form {name, affiliation}
 */
async function getUserData(user_url, key, num = 1) {
    let user_info;
    let affiliation_info;
    try {
        user_info = await getData(`${user_url}?`, key);
        affiliation_info = await getData(`${user_info._links.affiliations.href}?`, key);
        const affiliations = affiliation_info._links.affiliations;
        return {
            name        : user_info.name,
            affiliation : (affiliations) ? affiliations[0].title : 'No affiliation'
        };
    } catch (err) {
        if (num > 5) {
            console.error(`User data not found for ${user_url}`);
            return { name: undefined, affiliation: undefined };
        } else {
            console.error(`Attempt no. ${num} to user data at ${user_url} (${err.message}) failed, trying again`);
            const try_again = await getUserData(user_url, key, num + 1);
            return try_again;
        }
    }
}

/**
 * Get a list of users.
 *
 * @param {string} groupid: Group identification number
 * @param {string} key: the W3C API Key to authorize API calls
 * @param {boolean} former: whether this should include the former members, too
 */
async function getUsers(groupid, key, former) {
    // Set up the URL-s for the first and the second pages to be retrieved.
    const api_url1 = (former) ? `${apicore}/groups/${groupid}/users?former=true&` : `${apicore}/groups/${groupid}/users?`;
    const api_url2 = `${api_url1}page=2&`;

    // Get the data. To speed up, spawn two requests and run them in parallel
    const [user_infos1, user_infos2] = await Promise.all([getData(api_url1, key), getData(api_url2, key)]);

    // Extract the URL-s identifying each user. The result is an array of URL-s
    let user_urls = user_infos1._links.users.map((info) => info.href);
    if (user_infos2._links.users) {
        user_urls = user_urls.concat(user_infos2._links.users.map((info) => info.href));
    }
    return user_urls;
}

/**
 * Clean up the member lists. This means:
 * - Remove duplicates within each list; this may mean that the same person got onto the list twice
 *   with different affiliations. This should not happen, but it does:-(
 * - Remove names from the "all" list that are also on the "current" list, ie, to get a clean list
 *   of former members
 * - Filter out both lists v.a.v. the special ack list, enriching the latter with affiliation on the fly
 *
 * @param {Array} separate_acks: list of people to be acknowledged separately
 * @param {Array} current_members: list of current WG members
 * @return the three lists in a three-tuple
 */
function clean_up(separate_acks, current_members /* all_members */) {

    const clean_list = (members) => members
        .map((member, index, list) => {
            // Repeated values means that two consecutive entries have the same name
            const next = list[index + 1];
            if (next !== undefined && next.name === member.name) {
                if (member.affiliation !== undefined) {
                    if (next.affiliation !== undefined) {
                        member.affiliation = `${member.affiliation}, ${next.affiliation}`;
                    }
                } else if (next.affiliation !== undefined) {
                    member.affiliation = next.affiliation;
                }
                next.remove = true;
            }

            // A rare case that also happens
            if (member.affiliation === undefined) {
                member.affiliation = 'No affiliation';
            }

            // The system says "W3C Invited Experts" as an affiliation; this should be put into singular
            if (member.affiliation === 'W3C Invited Experts') {
                member.affiliation = 'W3C Invited Expert';
            }

            return member;
        })
        .filter((member) => member.remove === undefined);


    const combine_separate = (members) => members
        .map((member) => {
            const special = separate_acks.find((sp) => sp.name === member.name);
            if (special) {
                // role flags should be taken into account to get the final affiliation
                // the special's affiliation should be set
                if (special.chair) {
                    member.affiliation = `${member.affiliation}, chair`;
                }
                if (special.editor) {
                    member.affiliation = `${member.affiliation}, editor`;
                }
                special.affiliation = member.affiliation;

                if (!special.keep) {
                    member.remove = true;
                }
            }
            return member;
        })
        .filter((member) => member.remove === undefined);


    // Basic cleanup of the lists
    let cleaned_current = clean_list(current_members);

    // // Filter the "all" list by removing the current members and then clean it
    // let cleaned_all = clean_list(all_members.filter((past_m) => {
    //         return cleaned_current.find((current_m) => current_m.name === past_m.name) === undefined;
    //     })
    // );

    // Remove the persons appearing on the special list
    cleaned_current = combine_separate(cleaned_current);
    // cleaned_all = combine_separate(cleaned_all);

    return [separate_acks, cleaned_current];
    // return [separate_acks, cleaned_current, cleaned_all];
}


/**
 * The main entry point:
 * - gets the group data based on the group id
 * - for each user the name and affiliation is gathered
 * - combines the result in an HTML structure
 *
 * The configuration object's relevant fields:
 * * `list` : the array containing the predefined names to be listed explicitly (as Objects)
 * * `template` : HTML template for the final result
 * * `id` : the W3C id for the group
 * * `api_key` : the W3C api key
 *
 * @param {Object} config - Generic configuration
 */
async function create_ack_section(config) {
    const generate_list = (members) => members
        .filter((person) => !(person.editor))
        .map((person) => `        <li>${person.name} (${person.affiliation})</li>`)
        .join('\n');

    try {
        // Get the list of special acknowledgments' persons
        const separate_acks = config.list;

        // Get the list of current and all WG members' URLs. Let that be done in parallel for former included and not included...
        // const [current_user_urls, all_user_urls] = await Promise.all([
        //     getUsers(config.id, config.api_key, former = false),
        //     getUsers(config.id, config.api_key, former = true)
        // ]);
        const current_user_urls = await getUsers(config.id, config.api_key, false);

        // Get hold of all the names and affiliations.
        // const [current_user_data, all_user_data] = await Promise.all([
        //         await Promise.all(current_user_urls.map((user) => getUserData(user, key))),
        //         await Promise.all(all_user_urls.map((user) => getUserData(user, key)))
        //     ]);

        const current_user_data = await Promise.all(current_user_urls.map((user) => getUserData(user, config.api_key)));

        // const [final_separate_acks, final_current, final_past] = clean_up(separate_acks, current_user_data, all_user_data);
        const [final_separate_acks, final_current] = clean_up(separate_acks, current_user_data);

        // eslint-disable-next-line max-len
        return config.template.replace(EXPLICIT_LISTING, generate_list(final_separate_acks)).replace(MEMBER_LISTING, generate_list(final_current));
    } catch (err) {
        console.error(`Something is wrong... \n${err.toString()}`);
    }
}


// ======================================================================================
module.exports = { create_ack_section };
