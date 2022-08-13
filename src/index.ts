import { register } from "tsconfig-paths";
import tsConfig from "../tsconfig.json" assert { type: "json" };

register({
	baseUrl: tsConfig.compilerOptions.baseUrl,
	paths: tsConfig.compilerOptions.paths,
});

import { logger } from "#configs";
import { studentCodes } from "#constants";
import { ApiError, getCourse, loginVnu, registerCourses } from "#utils";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyEnv from "@fastify/env";
import fastifyFormBody from "@fastify/formbody";
import fastifyJwt from "@fastify/jwt";
import fastifyView from "@fastify/view";
import ejs from "ejs";
import type { FastifyReply, FastifyRequest } from "fastify";
import Fastify from "fastify";
import fs from "fs";
import path from "path";
// @ts-ignore
import fastifyStatic from "@fastify/static";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let fastify = Fastify({ logger });

fastify
	.register(fastifyEnv, {
		schema: {
			type: "object",
			required: ["PASETO_SECRET"],
			properties: {
				PASETO_SECRET: { type: "string" },
			},
		},
		dotenv: {
			path: path.join(__dirname, "../.env"),
		},
		data: process.env,
	})
	.after(() => {
		fastify.register(fastifyJwt, {
			// @ts-ignore
			secret: fastify.config.PASETO_SECRET,
			cookie: {
				cookieName: "token",
				signed: false,
			},
		});
	});
fastify.register(fastifyCors);
fastify.register(fastifyCookie);
fastify.register(fastifyStatic, {
	root: path.join(__dirname, "public"),
});
fastify.register(fastifyView, {
	engine: {
		ejs,
	},
});
fastify.register(fastifyFormBody);

fastify
	.decorate("auth", async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			// @ts-ignore
			await request.jwtVerify({ onlyCookie: true });
		} catch (err) {
			// @ts-ignore
			if (err.code === "FST_JWT_NO_AUTHORIZATION_IN_COOKIE") return;
			// @ts-ignore
			if (err.code === "FAST_JWT_MALFORMED")
				return reply.clearCookie("token").redirect("/login");
		}
		const token = request.cookies.token;
		// @ts-ignore
		const { username, password } = fastify.jwt.verify(token);
		if (fs.existsSync(`src/assets/data/${username}.txt`)) {
			const passwd = fs.readFileSync(
				`src/assets/data/${username}.txt`,
				"utf-8"
			);
			if (password === passwd) {
				request.user = {
					username,
					password,
				};
			}
		}
	})
	.decorate(
		"loginVnu",
		async (
			request: FastifyRequest<{ Body: { username: string; password: string } }>,
			reply: FastifyReply
		) => {
			const { username, password } = request.body;
			await loginVnu(username, password);
		}
	)
	.after(() => {
		fastify.get(
			"/login",
			// @ts-ignore
			{ preHandler: fastify.auth },
			async (request, reply) => {
				if (request.user) return reply.redirect("/home");
				return reply.view("/src/views/login.ejs");
			}
		);

		fastify.post<{ Body: { username: string; password: string } }>(
			"/login",
			// @ts-ignore
			{ preHandler: fastify.loginVnu },
			async (request, reply) => {
				const { username, password } = request.body;
				if (!studentCodes.includes(username))
					return reply.code(403).send({ message: "Invalid username" });
				const token = await reply.jwtSign({ username, password });
				return reply
					.setCookie("token", token, {
						httpOnly: true,
						secure: false,
					})
					.redirect("/home");
			}
		);

		fastify.get(
			"/home",
			// @ts-ignore
			{ preHandler: fastify.auth },
			async (request, reply) => {
				if (!request.user) return reply.redirect("/login");
				return reply.view("/src/views/home.ejs");
			}
		);

		fastify.post<{ Body: { type: string } }>(
			"/course",
			// @ts-ignore
			{ preHandler: fastify.auth },
			async (request, reply) => {
				if (!request.user)
					return reply.code(403).send({ message: "Please login" });
				const { type } = request.body;
				// @ts-ignore
				const { username, password } = request.user;
				try {
					const html = await getCourse(username, password, type);
					return reply.send({ html });
				} catch (err) {
					throw err;
				}
			}
		);

		fastify.post<{ Body: { codes: string[] } }>(
			"/register-course",
			// @ts-ignore
			{ preHandler: fastify.auth },
			async (request, reply) => {
				if (!request.user)
					return reply.code(403).send({ message: "Please login" });
				const { codes } = request.body;
				// @ts-ignore
				const { username, password } = request.user;
				const res = await registerCourses(username, password, codes);
				return reply.send({ message: res });
			}
		);

		fastify.post("/logout", (request, reply) => {
			return reply.clearCookie("token").redirect("/login");
		});
	});

fastify.setErrorHandler((error, request, reply) => {
	if (error instanceof ApiError)
		reply.code(error.code).send({ message: error.message });
	else reply.code(500).send({ message: error.message });
});

fastify.setNotFoundHandler((request, reply) => {
	if (request.url === "/") reply.redirect("/home");
	else throw new ApiError(404, "Not found");
});

// @ts-ignore
fastify.listen({ port: process.env.PORT || 8080 }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server listening at ${address}`);
});
