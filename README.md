# Script to generate the acknowledgement section in W3C documents

## What is it?

The script can be used to extract the current membership of a Working/Interest Group using the  [W3C API](https://w3c.github.io/w3c-api/) and generate an HTML fragment that can be pulled into the final document. More specifically, the script generates a separate (HTML) section, calling out the main contributors as well as the full group membership. The generated fragment can either be copy/pasted into the final document manually; if the document is edited using respec, the following also works:

```html
<section data-include="acknowledgements.html" data-include-replace="true"></section>
```

The content of the HTML fragment can be personalized via a simple template file.

(An example for the generated content can be seen, e.g., at the [WPUB spec's acknowledgement section](https://w3c.github.io/wpub/).)

## Usage

The tool is written in Javascript on top of `node.js`. The “entry point” is the `main.js` file, which accepts the following command line arguments:

```bash
Usage: node main.js [options] [file]

Options:
  -c, --config [config]   JSON configuration file
  -d, --document [group]  document identifier
  -o, --output [file]     output file name (default: standard output)
  -h, --help              output usage information

  file:                   JSON configuration file
```

The configuration file is at the heart of processing, and controls the various options; it is a local JSON file. A user level configuration file `~/.publ_ack.json` can also be used; this is combined with the configuration file provided on the command line. The document name is a key identifying the specific document parameters, listed in the configuration file (see below).

### The JSON configuration file

The file may contain the following fields:

* `api_key` : value is the API key that is necessary to use the W3C API. See the [relevant W3C page](https://w3c.github.io/w3c-api/) for obtaining it. (Beware! Avoid putting a configuration file on a public archive with this value included. The safest way is to store this value in `~/.publ_ack.json`.)
* `default` : the default document identifier (overwritten by the command line argument `-d`).
* `documents` : the value is an object; keys in this object are the document identifiers, each identifying an object with the following fields:
  * `id` : group ID. Ask your friendly W3C staff contact to provide you with the value for a specific group, but it is also part of the URL for the group’s participation list. See, for example, the URL for the [JSON-LD WG participants’ list](https://www.w3.org/2000/09/dbwg/details?group=100074).
  * `explicit_list`: URL identifying the separate list of users. This entry is optional if the acknowledgement section should only use the group membership.
  * `html_pattern` : URL identifying the HTML template file.

For an example configuration file, see, e.g., [test configuration](https://github.com/w3c/publ_ack/blob/master/test/config.json).

#### Separate users’ list

This list is used to identify users who should be listed separately in the acknowledgement section. The list is a JSON array of `person` objects, with the following fields (only `name` is required):

* `name` : the name of the person. Care should be taken to use _the same name_ as used in the person’s user profile at W3C.
* `chair` : value is a boolean (it can be omitted for `false`). Designates a (co-)chair for the group; the generated HTML list will explicitly note them as co-chairs.
* `editor` : value is a boolean (it can be omitted for `false`). Designates the editors of the document; these names will not appear anywhere in the generated lists (the model is that the editor(s) “acknowledges” the co-authors and contributors).
* `affiliation` : value is a string describing the affiliation of the person. In most of the cases this field is unnecessary; the affiliation data are fetched from the W3C database and added to the final listing. However, if the person appearing on the separate users’ list is on the Working Group not any more, this field should be added.

For an example configuration file, see, e.g., [test users’ list](https://github.com/w3c/publ_ack/blob/master/test/test_acks.json).

#### HTML Template

This is an HTML fragment. The final HTML file will be created by replacing two patterns in the text as follows:

* `%%EXPLICIT_LISTING%%` : replaced with a series of `<li>name (affiliation)</li>` for the persons appearing in the separate users’ list, with the editors removed.
* `%%GROUP_MEMBERS_LISTING%%` : replaces with a series of  `<li>name (affiliation)</li>` for all group members, with all persons in the separate users’ list removed.

### Examples

See examples in the `test` directory for a configuration, users’ list, and template file.

## Installation

Setup the project locally and install node.js dependencies:

```bash
git clone https://github.com/w3c/publ_ack.git
cd publ_ack
npm install
```

---

Maintainer: [Ivan Herman](https://github.com/iherman)
