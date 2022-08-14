import fs from "fs";

const studentCodes = fs
	.readFileSync("src/assets/student-codes.txt", "utf8")
	.split("\r\n");

export default studentCodes;
