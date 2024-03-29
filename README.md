# Script to generate the acknowledgement section in W3C documents

## What is it?

The script can be used to extract the current membership of a Working/Interest Group using the  [W3C API](https://w3c.github.io/w3c-api/) and generate an HTML fragment that can be pulled into the final document. More specifically, the script generates a separate (HTML) section, calling out the main contributors as well as the full group membership. The generated fragment can either be copy/pasted into the final document manually; if the document is edited using respec, the following also works:

```html
<section data-include="acknowledgements.html" data-include-replace="true"></section>
```

The content of the HTML fragment can be personalized via a simple template file.

(An example for the generated content can be seen, e.g., at the [WPUB spec's acknowledgement section](https://w3c.github.io/wpub/).)

## Usage

The tool is written in Typescript on top of [deno](https://deno.com). The “entry point” is the `main.ts` file, which accepts the following command line arguments:

```bash
Usage: deno run -A main.ts [options] [conf]

Options:
  -c, --config [config]   JSON configuration file
  -d, --document [group]  document identifier
  -o, --output [output]   output file name (default: standard output)
  -h, --help              display help for command

  config:                 JSON configuration file
```

The configuration file is at the heart of processing, and controls the various options; it is a local JSON file. A user level configuration file `~/.publ_ack.json` can also be used; this is combined with the configuration file provided on the command line. The document name is a key identifying the specific document parameters, listed in the configuration file (see below).

### The JSON configuration file

The file may contain the following fields:

* `default` (optional): the default document identifier (overwritten by the command line argument `-d`).
* `documents` (required): the value is an object; keys in this object are the document identifiers, each identifying an object with the following fields:
  * `id` (required): group ID. Ask your friendly W3C staff contact to provide you with the value for a specific group, but it is also part of the URL for the group’s participation list. See, for example, the URL for the [JSON-LD WG participants’ list](https://www.w3.org/2000/09/dbwg/details?group=100074).
  * `explicit_list` (optional): URL identifying the separate list of users. This entry is optional if the acknowledgement section should only use the group membership.
  * `html_pattern` (required): URL identifying the HTML template file.

For an example configuration file, see, e.g., [test configuration](https://github.com/w3c/publ_ack/blob/master/test/correct_config.json).

#### Separate users’ list

This list is used to identify users who should be listed separately in the acknowledgement section. The list is a JSON array of `person` objects, with the following fields (only `name` is required):

* `name` (required): the name of the person. Care should be taken to use _the same name_ as used in the person’s user profile at W3C.
* `chair` (optional): value is a boolean (it can be omitted for `false`). Designates a (co-)chair for the group; the generated HTML list will explicitly note them as co-chairs.
* `editor` (optional): value is a boolean (it can be omitted for `false`). Designates the editors of the document; these names will not appear anywhere in the generated lists (the model is that the editor(s) “acknowledges” the co-authors and contributors).
* `keep` (optional): value is a boolean (it can be omitted for `false`). If a name should appear on _both_ the separate list and the overall list, this value should be set to `true`.
* `affiliation` (optional): value is a string describing the affiliation of the person. In most of the cases this field is unnecessary; the affiliation data are fetched from the W3C database and added to the final listing. However, if the person appearing on the separate users’ list is on the Working Group not any more, this field should be added.

For an example configuration file, see, e.g., [test users’ list](https://github.com/w3c/publ_ack/blob/master/test/correct_ack_list.json).

#### HTML Template

This is an HTML fragment. The final HTML file will be created by replacing two patterns in the text as follows:

* `%%EXPLICIT_LISTING%%` : replaced with a series of `<li>name (affiliation)</li>` for the persons appearing in the separate users’ list, with the editors removed.
* `%%GROUP_MEMBERS_LISTING%%` : replaces with a series of  `<li>name (affiliation)</li>` for all group members, with all persons in the separate users’ list removed.

For an example template file, see, e.g., [test html template](https://github.com/w3c/publ_ack/blob/master/test/correct_html_template.html).

## Installation

See the [deno homepage](https://deno.com) to download deno (version 1.37.2 or higher is required). 

---

Maintainer: [Ivan Herman](https://github.com/iherman)
