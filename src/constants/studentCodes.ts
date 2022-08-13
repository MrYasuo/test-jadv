import fs from "fs";

const studentCodes = fs
	.readFileSync("src/assets/student-codes.txt", "utf8")
	.split("\n");

export default studentCodes;
