import { get_configuration }     from './lib/get_config.ts';
import { create_ack_section }    from './lib/get_data.ts';
import { DocumentConfigRuntime } from "./lib/types.ts";


async function main() {
    try {
        const config: DocumentConfigRuntime = await get_configuration();
        if (config) {
            const html_section: string = await create_ack_section(config);
            if (config.output) {
                Deno.writeTextFileSync(config.output, html_section);
            } else {
                console.log(html_section);
            }
        }
    } catch (e) {
        console.error(`${e.toString()}`);
        Deno.exit();
    }
}

// Do it!
main();
