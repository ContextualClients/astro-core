# Contextual Astro Core

****

## Deployment

`DEPLOYMENT` chooses how the site is built and served: `AGENT` (the default) or `WORKER`. It's read when the site is built.

- **`AGENT`** builds the site for a Contextual site agent, which serves it and signs visitors in.
- **`WORKER`** builds a standalone server for the `site-worker` managed worker. The worker's `gateway` signs visitors in and forwards each request to the site on the Pod's loopback with the visitor's site user, which the site reads into `Astro.locals`.

### As a Worker

The `Dockerfile` builds the site with `DEPLOYMENT=WORKER` into an image for the `site-worker` managed worker:

```sh
ctxl workers create my-site --size small --managed site-worker:0.2.0 --build . --option SITE_ID=my-site
```

The image serves on `127.0.0.1:4321` and exits as soon as the Pod stops it, after the gateway has stopped taking requests.
