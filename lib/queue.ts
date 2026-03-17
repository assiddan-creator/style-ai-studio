/**
 * Simple in-memory queue to run AI generation tasks sequentially.
 * Prevents too many simultaneous requests to the PoYo/Kling API during high traffic.
 */
let queue: Array<() => Promise<void>> = [];
let processing = false;

export async function addToQueue<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      try {
        const result = await task();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    if (!processing) {
      processing = true;
      (async () => {
        while (queue.length > 0) {
          const job = queue.shift();
          if (job) await job();
        }
        processing = false;
      })();
    }
  });
}
