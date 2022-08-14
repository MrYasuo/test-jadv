import CookieJar from "./MyCookieJar.js";
import getTokenCookie from "./get-token-cookie.js";
import ApiError from "./ApiError.js";
import fs from "fs";
// @ts-ignore
import { fetch } from "node-fetch-cookies";

const loginVnu = async (username: string, password: string): Promise<void> => {
	const cookieJar = new CookieJar(`src/assets/cookies/${username}.json`);
	// @ts-ignore
	await cookieJar.load();
	const LoginName = username;
	const Password = password;
	const __RequestVerificationToken = fs.readFileSync(
		`src/assets/tokens/${username}.txt`,
		"utf8"
	);
	const response = await fetch(
		cookieJar,
		"http://dangkyhoc.vnu.edu.vn/dang-nhap",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				__RequestVerificationToken,
				LoginName,
				Password,
			}),
		}
	);
	const html = await response.text();
	if (html.includes("<title>Error</title>")) {
		await getTokenCookie(username);
		return loginVnu(username, password);
	}
	if (html.includes("<title>Trang chủ")) {
		await Promise.all([
			cookieJar.save(),
			fs.promises.writeFile(`src/assets/data/${username}.txt`, password),
		]);
		return;
	} else if (html.includes("<title>Đăng nhập")) {
		throw new ApiError(
			403,
			"Please login with username and password of dangkyhoc.vnu.edu.vn"
		);
	} else throw new ApiError(500, "Some error occured. Please try again later.");
};

export default loginVnu;
