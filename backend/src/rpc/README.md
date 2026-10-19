# RPC

See [architecture](../../docs/orpc-architecture.md), [conventions](../../docs/rpc-style-guide.md), and [testing](../../docs/testing.md).

`contexts/baseContext.ts` defines transport dependencies. `middleware/demo-session.ts` demonstrates an expiring/revocable anonymous bearer session; production disables it. `middleware/appError.ts` maps application errors into declared contract errors. Routers remain thin and delegate database work to modules/services.
