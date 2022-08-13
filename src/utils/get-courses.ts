import CookieJar from "./MyCookieJar.js";
import loginVnu from "./login-vnu.js";
// @ts-ignore
import luxon from "#configs/luxon";
import fs from "fs";
import fetch from "./fetchWithTimeout.js";

const getCourse = async (
	username: string,
	password: string,
	type: string
): Promise<void> => {
	const cookieJar = new CookieJar(`src/assets/cookies/${username}.json`);
	const urlType = type === "major" ? 1 : 2;
	// @ts-ignore
	await cookieJar.load();
	try {
		const res = await fetch(
			cookieJar,
			`http://dangkyhoc.vnu.edu.vn/danh-sach-mon-hoc/1/${urlType}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			},
			10000
		);
		let html = await res.text();
		if (html.includes("<title>Error</title>")) {
			// @ts-ignore
			await loginVnu(username, password);
			return getCourse(username, password, type);
		}
		if (html.includes("The service is unavailable."))
			throw new Error("The service is unavailable! Please try again later");
		html = html
			.replace(/>\s+|\s+<|\s+\(|\)\s+/g, (m: string) => m.trim())
			.replace(/(<span>|<\/span>|<b>|<\/b>)/g, "")
			.replace(/(.)(\(TH\)|\(LT\))/g, "$1 $2");
		html = `<strong>Updated at ${luxon.DateTime.now().toFormat(
			"dd/MM/yyyy HH:mm"
		)}</strong><table>${html}</table>`;
		fs.writeFileSync(`src/public/data/${type}.html`, html);
		return html;
	} catch (err) {
		// @ts-ignore
		if (err.name === "AbortError")
			throw new Error("Request timeout! Please try again later");
		throw err;
	}
};

export default getCourse;
