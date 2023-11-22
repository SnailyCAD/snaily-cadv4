/** This process must be run separately from the server */
import { Queue } from "bullmq";
import { setupWorker } from "./setup-worker";

const queue = new Queue("workers", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});
queue.setMaxListeners(queue.getMaxListeners() + 100);

setupWorker("inactivity-worker.js", queue);
