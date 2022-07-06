type AsyncFn<T = unknown> = () => Promise<T>;

export class BatchQueue {
  readonly width: number;
  #hasStarted: boolean;
  #queued: AsyncFn[];
  #resolve: () => void
  #running: Promise<unknown>[];

  /** @param width - limit of concurrent jobs */
  constructor(width: number) {
    this.width = width;
    this.#queued = [];
    this.#running = [];
    this.#hasStarted = false;
    this.#resolve = () => {}
  }

  queue(...fn: AsyncFn[]) {
    return this.#queued.push(...fn);
  }

  get queued() {
    return this.#queued.length;
  }

  get running() {
    return this.#running.length;
  }

  get all() {
    return Promise.all(this.#running);
  }

  get allSettled() {
    return Promise.allSettled(this.#running);
  }

  #handleCompletion() {
    const nextTask = this.#queued.shift()
    if (!nextTask) return this.#resolve();
    const p = nextTask()
    p.then(() => this.#handleCompletion(), () => this.#handleCompletion())
    this.#running.push(p)
  }

  #getNextNTasks(n: number) {
    const tasks: AsyncFn[] = [];
    for (const _i of range({ start: 0, end: n, steps: n })) {
      const nextTask = this.#queued.shift();
      if (!nextTask) return tasks;

      tasks.push(nextTask);
    }

    return tasks;
  }

  run() {
    // if the queue is already running do nothing
    if (this.#hasStarted) return;
    this.#hasStarted = true;

    const toRun = this.#getNextNTasks(this.width)
    const proms = toRun.map(fn => {
      // start the task
      const p = fn()
      p.then(() => this.#handleCompletion(), () => this.#handleCompletion())
      return p
    })

    this.#running.push(...proms)

    return new Promise<void>((resolve) => {
      this.#resolve = resolve
    })
  }

  get started() {
    return this.#hasStarted;
  }
}

/**
 * Utility generator for a range of numbers
 * @param {start} the inclusive first number of the range
 * @param {end} the inclusive last number of the range
 * @param {steps} the number of steps in the range
 * @yields the numbers from start to end with number of steps
 * Usage `const t = [...range({ start: 0, end: 1, steps: 10 })]`
 */
export function* range({
  start,
  end,
  steps,
}: {
  start: number;
  end: number;
  steps: number;
}) {
  const stepSize = (end - start) / steps;
  for (let i = 0; i < steps; i += 1) {
    yield i * stepSize + start;
  }
}
