import { type Queue, Worker } from "bullmq";
import { resolve } from "node:path";

let worker;
const FIVE_MIN_IN_MILL = 60 * 5 * 1000;
const DEFAULT_REMOVE_CONFIG = {
  removeOnComplete: {
    age: 3600,
  },
  removeOnFail: {
    age: 24 * 3600,
  },
};

export function setupWorker(filename: string, queue: Queue) {
  const path = resolve(__dirname, filename);
  worker = new Worker("workers", path, {
    connection: {
      host: "localhost",
      port: 6379,
    },
  });

  worker.on("active", (job) => {
    console.debug(`Processing job with id ${job.id}`);
  });

  worker.on("completed", (job, returnValue) => {
    console.debug(`Completed job with id ${job.id}`, returnValue);
  });

  worker.on("error", (failedReason) => {
    console.error("Job encountered an error", failedReason);
  });

  queue.add(
    "inactivity-worker",
    {},
    {
      repeat: { every: FIVE_MIN_IN_MILL },
      ...DEFAULT_REMOVE_CONFIG,
    },
  );
}
