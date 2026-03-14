import express, { type Request, type Response } from "express";
import { Receiver } from "@upstash/qstash";
import { processJob } from "./jobs/router";

const app = express();

// Parse raw body for QStash signature verification
app.use(
  express.json({
    verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// QStash receiver — verifies every incoming request signature
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? "",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "",
});

// Health check — Railway uses this to confirm service is live
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "chapterhouse-worker", ts: new Date().toISOString() });
});

// Main job processing endpoint — QStash delivers here
app.post("/process-job", async (req: Request & { rawBody?: Buffer }, res: Response) => {
  // SECURITY: Verify QStash signature before doing anything
  const signature = req.headers["upstash-signature"] as string | undefined;
  const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

  if (!signature) {
    console.warn("[worker] Missing upstash-signature header — rejecting");
    res.status(401).json({ error: "Missing signature" });
    return;
  }

  // Skip verification in local dev if signing keys are not set
  const hasSigningKeys = process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY;

  if (hasSigningKeys) {
    try {
      const isValid = await receiver.verify({ signature, body: rawBody });
      if (!isValid) {
        console.warn("[worker] Invalid QStash signature — rejecting");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }
    } catch (err) {
      console.error("[worker] Signature verification error:", err);
      res.status(401).json({ error: "Signature verification failed" });
      return;
    }
  } else {
    console.warn("[worker] QSTASH signing keys not set — skipping verification (dev mode only)");
  }

  const { jobId, type, payload } = req.body as {
    jobId: string;
    type: string;
    payload: Record<string, unknown>;
  };

  if (!jobId || !type) {
    res.status(400).json({ error: "Missing jobId or type" });
    return;
  }

  // Acknowledge immediately — QStash doesn't wait for job completion
  res.status(200).json({ received: true, jobId });

  // Process async — don't await
  processJob(jobId, type, payload ?? {}).catch((err) => {
    console.error(`[worker] Unhandled error processing job ${jobId}:`, err);
  });
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`[worker] Chapterhouse worker running on port ${PORT}`);
});
