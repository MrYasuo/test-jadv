// @ts-ignore
import { CookieJar } from "node-fetch-cookies";
import fs from "fs";
class MyCookieJar extends CookieJar {
    constructor(...args) {
        super(...args);
    }
    async save(file = super.file) {
        await fs.promises.writeFile(file, JSON.stringify([...super.cookiesAll()]));
    }
}
export default MyCookieJar;
