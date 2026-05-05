import { app } from "./app";
import { env } from "./utils/env";

app.listen(env.port, () => {
  console.log(`[TrustScore] Backend listening on port ${env.port}`);
});
