import type {
	FastifyLoggerOptions,
	FastifyRequest,
	FastifyServerOptions,
} from "fastify";
import { IncomingMessage } from "http";
import pino from "pino";

interface PinoOptions {
	transport: TransportOptions;
}

interface TransportOptions {
	target: string;
	options: {
		levelFirst: boolean;
		sync: boolean;
		ignore?: string;
		messageFormat?: string;
		colorize?: boolean;
	};
}

const option: PinoOptions = {
	transport: {
		target: "pino-pretty",
		options: {
			levelFirst: true,
			sync: false,
		},
	},
};

if (process.env.NODE_ENV === "production") {
	option.transport.options.ignore = "pid,hostname,reqId,res,req,responseTime";
	option.transport.options.messageFormat =
		"{msg} [{req.method} {req.url}:> {responseTime}ms]";
	option.transport.options.colorize = true;
}

interface MyIncomingMessage extends IncomingMessage {
	body: string;
}

const pinocfg: FastifyLoggerOptions | FastifyServerOptions = {
	logger: pino(option),
	serializers: {
		req: function (req: FastifyRequest) {
			const body = (<MyIncomingMessage>req.raw).body;
			return {
				method: req.method,
				url: req.url,
				body,
				headers: {
					"content-type": req.headers["content-type"],
					"user-agent": req.headers["user-agent"],
					authorization: req.headers["authorization"],
				},
			};
		},
		res: function (res) {
			return {
				...pino.stdSerializers.res,
				statusCode: res.statusCode,
			};
		},
		err: pino.stdSerializers.err,
	},
};

export default pinocfg;
