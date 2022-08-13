// @ts-ignore
import { fetch } from "node-fetch-cookies";
import CookieJar from "./MyCookieJar.js";

const fetchWithTimeout = async (
	cookieJar: CookieJar,
	url: string,
	options: any,
	timeout: number
) => {
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
