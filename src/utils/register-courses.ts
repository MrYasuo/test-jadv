import CookieJar from "./MyCookieJar.js";
// @ts-ignore
import { fetch } from "node-fetch-cookies";
import { JSDOM } from "jsdom";
import getCourse from "./get-courses.js";
import loginVnu from "./login-vnu.js";

const pickCourse = async (
	cookieJar: CookieJar,
	dom: JSDOM,
	courseCode: string
) => {
	const course = dom.window.document.evaluate(
		`//td[text()="${courseCode}"]`,
		dom.window.document,
		null,
		dom.window.XPathResult.FIRST_ORDERED_NODE_TYPE,
		null
	).singleNodeValue;
	if (!course) return `${courseCode} not found`;
	const checkInput =
		course?.parentElement?.firstElementChild?.firstElementChild;
	if (!checkInput) return `${courseCode} is out of slots`;
	const dataRowIndex = checkInput.getAttribute("data-rowindex");
	let res = await fetch(
		cookieJar,
		`http://dangkyhoc.vnu.edu.vn/chon-mon-hoc/${dataRowIndex}/1/1`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		}
	);
	try {
		res = await res.json();
		if (!res.success) return "Session expired! Get course again";
		return `Picked ${courseCode}`;
	} catch (err) {
		return "Please login again";
	}
};

const registerCourses = async (
	username: string,
	password: string,
	codes: string[]
): Promise<void> => {
	const cookieJar = new CookieJar(`src/assets/cookies/${username}.json`);
	// @ts-ignore
	await cookieJar.load();
	const dom = await JSDOM.fromFile("src/public/data/all.html");
	let resArr = [];
	const res = await pickCourse(cookieJar, dom, codes[0]);
	if (res === "Session expired! Get course again") {
		await getCourse(username, password, "all");
		resArr = await Promise.all(
			codes.map((code) => pickCourse(cookieJar, dom, code))
		);
	} else if (res === "Please login again") {
		await loginVnu(username, password);
		await getCourse(username, password, "all");
		resArr = await Promise.all(
			codes.map((code) => pickCourse(cookieJar, dom, code))
		);
	} else
		resArr.push(
			...(await Promise.all(
				codes.slice(1).map((code) => pickCourse(cookieJar, dom, code))
			)),
			res
		);
	try {
		const response = await fetch(
			cookieJar,
			"http://dangkyhoc.vnu.edu/xac-nhan-dang-ky/1",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			}
		);
		return response.json();
	} catch (err) {
		// @ts-ignore
		if (err.code === "ENOTFOUND")
			throw new Error("Portal is not opened for register courses");
		else throw err;
	}
};

export default registerCourses;
