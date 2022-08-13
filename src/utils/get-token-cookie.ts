import fs from "fs";
// @ts-ignore
import { fetch } from "node-fetch-cookies";
import CookieJar from "./MyCookieJar.js";

const getTokenCookie = async (username: string) => {
	const cookieJar = new CookieJar();
	const response = await fetch(
		cookieJar,
		"http://dangkyhoc.vnu.edu.vn/dang-nhap"
	);
	const html = await response.text();
	const __RequestVerificationToken = html.match(
		/<.*?__RequestVerificationToken.*?value="(.*?)".*?\/>/
	)[1];

	await Promise.all([
		fs.promises.writeFile(
			`src/assets/tokens/${username}.txt`,
			__RequestVerificationToken
		),
		cookieJar.save(`src/assets/cookies/${username}.json`),
	]);
};

export default getTokenCookie;
