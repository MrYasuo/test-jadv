import pino from "pino";
const option = {
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
const pinocfg = {
    logger: pino(option),
    serializers: {
        req: function (req) {
            const body = req.raw.body;
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
