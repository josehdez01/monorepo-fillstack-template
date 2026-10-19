# RPC conventions

- Declare input/output and recoverable domain errors in `contracts/src/orpc` first.
- Keep router handlers short; inject `context.em` into domain services.
- Validate/canonicalize email at the contract boundary and rely on database uniqueness for concurrent writes. Map only known constraint exceptions to `CONFLICT`; preserve unrelated database failures.
- Use `makeDemoSessionMiddleware` only for this template's nonproduction demonstration. It is not an authentication strategy.
- Add no global queue registration or ORM work at module scope.
- Return explicit DTO fields. Avoid returning entities or including bearer tokens in messages/logging.
- Use explicit source imports with `.ts`; tsdown emits production `.js` files. Development uses the `development` export condition; production uses built exports.
- Register new routers in the root router and contracts in the root contract. Queue scaffolding adds a shared producer contract and a separate backend implementation.
