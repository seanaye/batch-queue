# Whats this?

A queue implementation for batching asynchronous tasks. The queue will attempt to keep the number of running tasks at the limit.

This is useful for when there are many network operations to perform. Like a list of files to download.

# Usage

```ts
import { BatchQueue } from "https://deno.land/x/batch-queue/mod.ts"

// allow 20 concurrent operations
const q = new BatchQueue(20)

function download(url: URL) {
  return async () => {
    const res = await fetch(url)
    const data = awit res.blob()
    await Deno.writeFile(url, data)
  }
}

const urls = [
  //...
]

q.queue(...urls.map(u => download(u)))

// this returns when every url has been downloaded
// it will not exceed 20 network requests
await q.run()
```
