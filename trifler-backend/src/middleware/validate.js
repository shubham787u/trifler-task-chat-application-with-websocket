// Checks a request part against a zod schema BEFORE the controller runs.
// Invalid -> the ZodError goes to errorHandler.js, which returns a 400 with
// a list of { field, message }. Valid -> cleaned data replaces the raw input
// (trimmed, lowercased, unknown fields stripped).
//
// Usage:
//   router.post("/register", validate(registerSchema), register);
//   router.get("/", validate(searchSchema, "query"), listUsers);
const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) return next(result.error);

    if (source === "body") {
      req.body = result.data;
    } else {
      // In Express 5 req.query is read-only, so cleaned query/params
      // are available on req.validated instead.
      req.validated = { ...req.validated, [source]: result.data };
    }

    next();
  };

export default validate;
