const compose = require("koa-compose");

class KoalaEvent {
  constructor() {
    this.middleware = [];
  }

  // Add a middleware function that recieves a ctx {event: [string], data: [object]} param
  use(fn) {
    if (typeof fn !== "function") throw new TypeError("middleware must be a function!");

    // console.debug("use %s", fn._name || fn.name || "-");

    this.middleware.push(fn);
    return this;
  }

  // Create a new emitter that is run through .use'd middleware
  newEmitter(emitter) {
    const fn = compose(this.middleware); // compose the assigned middleware

    // prep for the closure below
    let old_emit_local = emitter.emit;
    let self = this;

    const newEmitter = function newEmitter() {
      // console.debug("Intercepted", arguments);

      // Assemble the context (ctx) from the original event's input
      const ctx = {
        event: arguments[0],
        data: arguments.length > 2 ? Object.values(arguments).slice(1) : arguments[1],
      };

      old_emit_local.apply(emitter, arguments); // trigger the original emitter
      return self.handleEvent(ctx, fn); // process our middleware style emitter
    };

    return newEmitter;
  }

  // Handle the middleware style events that come through
  handleEvent(ctx, fnMiddleware) {
    return (
      fnMiddleware(ctx)
        // .then(() => console.log("done?")) // would be used for a final action
        .catch(console.error)
    );
  }
}

class EventRouter extends KoalaEvent {
  constructor() {
    super();
    this.eventMap = Object.create({});
  }

  // register responses to specific events
  on(event, fn) {
    if (!this.eventMap[event]) {
      this.eventMap[event] = [];
    }

    this.eventMap[event].push(fn);
    return this
  }

  // attach the middleware now
  useMiddleware() {
    const keys = Object.keys(this.eventMap);
    for (let keyIndex in keys) {
      let composition = compose(this.eventMap[keys[keyIndex]]);

      // Create a middleware to exec the composition if the event matches what was registered.
      const handlingOfKey = async (ctx, next) => {
        if (ctx.event == keys[keyIndex]) {
          return await composition(ctx);
        } else {
          return await next();
        }
      }

      super.use(handlingOfKey)
    }
  }

  // create the new emitter
  newEmitter(emitter) {
    this.useMiddleware();
    return super.newEmitter(emitter);
  }
}

module.exports = {};
module.exports.KoalaEvent = KoalaEvent;
module.exports.EventRouter = EventRouter;
