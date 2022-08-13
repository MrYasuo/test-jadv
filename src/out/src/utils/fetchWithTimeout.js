// @ts-ignore
import { fetch } from "node-fetch-cookies";
const fetchWithTimeout = async (cookieJar, url, options, timeout) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(cookieJar, url, {
        ...options,
        signal: controller.signal,
    });
    clearTimeout(id);
    return response;
};
export default fetchWithTimeout;
