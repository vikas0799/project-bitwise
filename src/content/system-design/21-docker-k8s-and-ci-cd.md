---
title: Docker, Kubernetes and CI/CD
description: How backends are packaged, run and shipped. What containers really are (namespaces, cgroups, images), Dockerfiles, layers and caching, multi-stage builds, image size, PID 1 and signals, memory limits, registries and tags, volumes and Docker Compose, Kubernetes pods, Deployments, Services, Ingress and Gateway API, config and secrets, probes, resources, autoscaling, rollouts, CI/CD pipelines, deployment strategies and GitOps.
author: Bitwise School
---

"It works on my machine" is one of the oldest problems in software. Your laptop has Node 22, the server has Node 18. The build needs a system library that production doesn't have. An environment variable is set on one machine and missing on another. A running program is never just its source code; it's the code **plus an environment**, and when environments drift apart, bugs show up in one place only.

Containers fix this by shipping the environment along with the code. Kubernetes runs those containers across many machines and keeps them healthy, and CI/CD pipelines build, test and ship them automatically. This chapter covers all three, from what a container actually is to a full pipeline that deploys a tested image with zero downtime.

The Docker experiments here were run for real with Docker 29: image sizes, rebuild times, memory limits, signal handling and a Compose stack. The Kubernetes manifests and the CI workflow use current, stable APIs and were checked as valid YAML, but weren't applied to a live cluster for this chapter.

## The problem containers solve

Before containers, you set up each server by hand or with scripts: install the right runtime, the right system packages, the right config. Every difference between your laptop, CI and production was a possible bug. It was like mailing someone a recipe and hoping their kitchen has the same oven and ingredients. A container mails the whole kitchen.

Containers give you three things:

- **Reproducibility.** The runtime, libraries and system packages are baked into the image, so there are no install steps to get wrong and no version drift between environments.
- **Isolation.** Two apps needing different versions of the same library run side by side on one machine without interfering.
- **Density and portability.** Containers are light enough to pack dozens onto one server, and the same image runs on a laptop, in CI and on any cloud.

> **The key idea:** a container makes "what runs in production" exactly the same as "what you built and tested". Docker, Kubernetes and CI/CD are machinery for building, shipping and running that one artifact.

## Containers vs virtual machines

The natural question is: isn't this just a virtual machine?

A **virtual machine** emulates hardware. A hypervisor gives each VM virtual CPUs, memory and disks, and each VM boots its own complete operating system with its own kernel. A **container** doesn't emulate anything. All containers on a host share the host's **one Linux kernel**, and the kernel keeps them apart.

![Virtual machines each run a guest OS and kernel on a hypervisor, while containers share the host kernel and only package their libraries and app](/images/system-design/vm-vs-container.svg "A VM carries a whole operating system. A container carries only what the app needs.")

| | Virtual machine | Container |
| --- | --- | --- |
| Isolates by | emulating hardware (hypervisor) | kernel features (namespaces and cgroups) |
| Operating system | a full guest OS and kernel each | shares the host's kernel |
| Size | gigabytes | megabytes |
| Start time | seconds to minutes (boots an OS) | milliseconds (starts a process) |
| Per host | tens | hundreds |
| Isolation | strong (separate kernels) | weaker (shared kernel) |

That last row is the real trade-off. Because containers share a kernel, a kernel vulnerability can let a process escape to the host, which is why cloud providers often run customers' containers inside lightweight VMs, and why container security focuses on running as non-root with minimal privileges.

## What a container actually is

There's no "container" object in the Linux kernel. **A container is an ordinary process that the kernel has been told to isolate**, using three features that existed long before Docker.

**1. Namespaces: what the process can see.** A namespace gives a process its own private view of a system resource. In its own **PID namespace**, the process thinks it's process 1 with no siblings. In its own **network namespace**, it has its own interfaces and ports. In its own **mount namespace**, it sees its own filesystem. You can try this without Docker:

```bash
sudo unshare --pid --fork --mount-proc ps aux
```

```text
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.0   7924  3872 ?        R    17:10   0:00 ps aux
```

Inside the new namespace, `ps` sees only itself, as PID 1. To the host, it's still a normal process. Running a Node container and looking from both sides:

```text
--- inside the container:
PID   USER     COMMAND
    1 root     node -e setInterval(() => {}, 1000)
--- on the host:
 7158 root     node -e setInterval(() => {}, 1000)
```

Same process: PID 1 inside, PID 7158 on the host.

**2. cgroups: how much the process can use.** Control groups cap CPU, memory, disk I/O and the number of processes. I started that container with `--memory=256m --cpus=0.5`, and the kernel's cgroup files inside it show exactly those limits:

```text
268435456      ← memory limit in bytes (256 MiB)
50000 100000   ← 50 ms of CPU time per 100 ms period (half a core)
```

Kubernetes resource limits are these same cgroup settings.

**3. An image: its own root filesystem.** The process gets its own `/` containing a runtime, libraries and your code, unpacked from an image. It can't see the host's files, only the image's, plus anything you explicitly mount in.

Because namespaces and cgroups are Linux features, containers are a Linux technology. Docker Desktop on macOS and Windows quietly runs a small Linux VM, and your containers run inside it.

## Images and layers

Two words that get mixed up:

- An **image** is an immutable template: a packaged filesystem plus metadata (which command to run, which port, which environment variables).
- A **container** is a running instance of an image.

It's the relationship between a class and its objects: build the image once, run many containers from it.

An image is stored as a stack of **read-only layers**, each holding the file changes made by one build step. A union filesystem merges them into a single view. Layers are identified by a hash of their contents, so identical layers are stored once and downloaded once: if ten images share the same Node base image, that base is on disk once.

When a container runs, it gets a thin **writable layer** on top. Anything it writes there (logs, uploads, database files) **disappears when the container is removed**. Persistent data must go in a volume or an external service. This catches out almost every beginner, but it's a feature: containers are disposable and can be replaced at any time.

## The Dockerfile

A Dockerfile is the recipe for an image. Here's the version most people write first:

```dockerfile
FROM node:22
WORKDIR /app
COPY . .
RUN npm install
CMD npm start
```

It works, and it has five problems, which the rest of this section fixes. First, the instructions:

| Instruction | What it does |
| --- | --- |
| `FROM` | the base image everything builds on |
| `WORKDIR` | sets (and creates) the working directory |
| `COPY` | copies files from the build context into the image (prefer it over `ADD`, which also unpacks archives and fetches URLs) |
| `RUN` | runs a command **at build time**; the result is saved as a layer |
| `ENV` | sets an environment variable in the image |
| `USER` | the user later instructions and the container run as |
| `EXPOSE` | documents the port the app listens on (it doesn't publish it) |
| `CMD` / `ENTRYPOINT` | what runs **when a container starts** |

Two common confusions: `RUN` happens when you **build** the image, `CMD` when you **start** a container. And the **build context** is the directory you pass to `docker build`; everything in it is sent to the builder unless a `.dockerignore` excludes it:

```text
node_modules
npm-debug.log
.git
.env*
Dockerfile*
coverage
```

Without it, your local `node_modules` (built for your OS, possibly with dev tools) and your `.env` file full of secrets get copied into the image.

### A production Dockerfile

```dockerfile
# syntax=docker/dockerfile:1

# ---- Stage 1: install production dependencies ----
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage 2: the image we ship ----
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
```

What changed, and why:

1. **A smaller base image** (`node:22-slim` instead of `node:22`).
2. **A multi-stage build**: dependencies are installed in one stage and only the result is copied into the final image. Anything used only for building (compilers for native modules, caches) stays behind.
3. **`npm ci --omit=dev`**: installs exactly what `package-lock.json` says, fails if it's out of date, and skips dev dependencies like TypeScript and ESLint.
4. **Cache-friendly order**: dependency files are copied and installed *before* the source code (explained next).
5. **A non-root user** (`USER node`, which exists in the official images with uid 1000).
6. **Exec-form `CMD`** with the JSON array, which matters for shutdown (explained below).

### Image size

I built the same Express + `pg` app several ways. The sizes are the compressed sizes, which is what every server downloads when it pulls the image:

| Image | Size |
| --- | ---: |
| naive: `node:22`, all dependencies | 424 MB |
| multi-stage on `node:22-slim` | 80 MB |
| multi-stage on `node:22-alpine` | 62 MB |
| multi-stage on distroless (`gcr.io/distroless/nodejs22-debian12`) | 53 MB |

Over 5× smaller from the same code. Smaller images pull faster (so new servers and autoscaled pods start sooner), cost less to store, and contain fewer packages that could have vulnerabilities.

Choosing a base:

- **`-slim`** (Debian with most extras removed): the safe default.
- **`alpine`**: smaller, but uses the musl C library instead of glibc, which occasionally breaks native modules or changes behaviour (DNS, performance).
- **distroless**: only Node.js and its runtime libraries. No shell, no package manager. An attacker who gets in has very little to work with, and neither do you: trying to open a shell fails.

```text
$ docker run --rm --entrypoint sh course-api:distroless -c 'echo hi'
... exec: "sh": executable file not found in $PATH
```

Debugging a distroless container means using its `:debug` variant or attaching a separate debug container.

### Layer caching: order matters

Docker caches every layer. On the next build it reuses each one as long as that instruction **and everything before it** is unchanged. As soon as one layer changes, it and **every layer after it** are rebuilt.

![Dockerfile instructions map to layers; after editing the source, the base, dependency and install layers come from cache and only the later layers rebuild](/images/system-design/image-layers.svg "Copy what changes rarely first, and what changes on every commit last.")

In the naive Dockerfile, `COPY . .` comes before `npm install`, so editing any source file invalidates the install step. I changed one line in `server.js` and rebuilt both versions:

```text
Dockerfile.naive rebuild after editing server.js: 4496 ms
Dockerfile rebuild after editing server.js: 618 ms
```

With a small app the difference is 4 seconds; with a large dependency tree it's minutes on every build, locally and in CI.

One more rule from the layer model: **clean up in the same `RUN`**. Deleting files in a later layer doesn't shrink the image, because the earlier layer still contains them:

```dockerfile
# Wrong: the package lists are still in the first layer
RUN apt-get update && apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# Right: one layer, cleaned before it is saved
RUN apt-get update && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*
```

### PID 1 and shutting down cleanly

When Docker or Kubernetes stops a container, it sends `SIGTERM` to the container's main process (PID 1), waits a grace period (10 seconds in Docker, 30 by default in Kubernetes), then sends `SIGKILL`. [Chapter 16](/system-design/16-graceful-shutdown/) showed how a Node server drains requests on `SIGTERM`. But that only works if the signal **reaches Node**.

I built the same image with three different `CMD` lines and timed `docker stop`:

| `CMD` | `docker stop` took | Exit code | What happened |
| --- | ---: | ---: | --- |
| `CMD node src/server.js` | 10,162 ms | 137 | `/bin/sh` was PID 1 and didn't pass `SIGTERM` on; Docker gave up and killed it |
| `CMD ["npm", "start"]` | 719 ms | 1 | npm was PID 1; the app never ran its shutdown handler, and npm logged an error |
| `CMD ["node", "src/server.js"]` | 152 ms | 0 | Node was PID 1: `SIGTERM received, draining` → `closed cleanly` |

The plain string (shell form) wraps your command in `/bin/sh -c`, and the shell doesn't forward signals. Every deploy then waits out the full timeout and kills requests mid-flight. **Use the exec form and run `node` directly.** If your app starts child processes, also run a tiny init process that reaps zombie processes and forwards signals: `docker run --init`, or `tini` in the image.

### Memory limits and Node.js

When a container goes over its memory limit, the kernel kills it immediately. I ran Node in a container limited to 128 MB and kept allocating:

```text
allocated 96 MB
allocated 112 MB
exit=137 OOMKilled=true
```

Exit code 137 means "killed by signal 9", and Docker (or Kubernetes, as `OOMKilled`) tells you why. There's no error message from the app because it never got the chance to write one.

V8 decides its own heap size, and it doesn't always fit the container. Setting the heap limit below the container limit makes Node garbage-collect harder before giving up, and fail with a clear message instead of a silent kill:

```text
$ docker run --memory=128m -e NODE_OPTIONS=--max-old-space-size=96 ...
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

A common rule is to give the heap about 75% of the container's memory limit, leaving room for buffers, native memory and the runtime itself.

## Running, registries and tags

The everyday commands:

```bash
docker build -t course-api:1.0.0 .
docker run -d --name api -p 3000:3000 -e DATABASE_URL=postgres://... course-api:1.0.0
docker logs -f api
docker push ghcr.io/bitwise/course-api:1.0.0
```

A **registry** stores images: Docker Hub, GitHub Container Registry, Amazon ECR, Google Artifact Registry. A **repository** is one image's name within it, and a **tag** names a version (`course-api:1.0.0`). Pushing and pulling only transfer the layers the other side doesn't already have.

**Don't deploy `:latest`.** It's just a tag that moves, not a guarantee of anything. Two servers pulling `:latest` an hour apart can run different code, which is exactly the inconsistency containers are meant to remove. Tag every build with something immutable, ideally the git commit (`course-api:git-9f2c1a7`), so you can always tell which code is running. For extra safety you can reference an image by its digest (`course-api@sha256:...`), which can never point to anything else.

Images follow the **OCI** (Open Container Initiative) standard, so an image built with Docker runs on containerd, CRI-O, Podman or Kubernetes without Docker installed.

## Networking, volumes and Docker Compose

### Networking

Each container has its own network namespace. Containers on the same user-defined Docker network can reach each other **by name**: the API connects to `postgres://db:5432`, and Docker's built-in DNS resolves `db` to the right container. Port publishing (`-p 3000:3000`) forwards a port on the host into a container so the outside world can reach it.

### Volumes

Because a container's writable layer is thrown away with the container, data that must survive goes in a **volume**:

| Type | Example | Use for |
| --- | --- | --- |
| **Named volume** | `dbdata:/var/lib/postgresql/data` | database files and other persistent data, managed by Docker |
| **Bind mount** | `./src:/app/src` | development: edit code on your machine, see it in the container |
| **tmpfs** | `--tmpfs /tmp` | scratch data kept only in memory |

The rule: **containers are disposable; state lives in volumes or managed services.** If deleting a container loses data, the data was in the wrong place.

### Docker Compose

A real app needs several containers: the API, a database, a cache, maybe a worker. Compose describes the whole stack in one file and starts it with one command:

```yaml
services:
  api:
    build: .
    image: course-api:1.0.0
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://app:app@db:5432/courses   # "db" is the service name, resolved by Docker's DNS
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy                       # wait until Postgres accepts connections
      cache:
        condition: service_started

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app                             # local development only
      POSTGRES_DB: courses
    volumes:
      - dbdata:/var/lib/postgresql/data                  # survives container restarts and re-creation
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d courses"]
      interval: 2s
      timeout: 3s
      retries: 15

  cache:
    image: redis:7-alpine

volumes:
  dbdata:
```

```text
$ docker compose up -d --wait
 Container app-db-1 Healthy
 Container app-api-1 Healthy
$ curl localhost:3000/courses
[{"id":1,"title":"System Design"},{"id":2,"title":"DSA"}]
```

`depends_on` with `service_healthy` makes the API wait until Postgres actually accepts connections, not just until its container has started. I then added a row, ran `docker compose down` (which removes the containers) and `up` again: the new row was still there, because it lived in the `dbdata` volume. `docker compose down -v` deletes volumes too, which is how you reset a local database.

Compose is perfect for local development, CI test environments and simple single-server deployments. It doesn't spread containers across machines, replace crashed ones on other servers, or autoscale. For that you need an orchestrator.

## Why orchestration?

Once you have dozens of containers on a fleet of servers, new questions appear:

| The question | What an orchestrator does |
| --- | --- |
| Which server should each container run on? | **scheduling** by available CPU and memory |
| A container or a whole server dies at 3 a.m. | **self-healing**: restart it or move it elsewhere |
| Traffic doubles, then drops | **scaling** the number of copies up and down |
| Containers move and change IPs | **service discovery and load balancing** with stable names |
| Ship a new version without downtime | **rolling updates and rollback** |
| Different settings per environment | **config and secrets** injected at run time |

Kubernetes (K8s) is the standard orchestrator. Managed versions (Amazon EKS, Google GKE, Azure AKS) run the hard parts for you.

### Declarative desired state

The idea that makes Kubernetes click: you don't give it step-by-step commands ("start a container on server 3"). You **declare the state you want** ("run 3 copies of this image, reachable at this name") and Kubernetes works continuously to make reality match.

Under the hood, controllers run **reconciliation loops**: compare desired state with actual state, act on any difference, repeat. If a pod dies, actual drops to 2, the loop notices and starts a third. You didn't do anything. Imperative is telling a driver every turn; declarative is setting the destination on an autopilot that corrects itself after every bump.

## Kubernetes architecture

A cluster has a **control plane** that decides what should run, and **worker nodes** where containers actually run. You only ever talk to the control plane's API.

![The control plane with api-server, etcd, scheduler and controller manager manages worker nodes that run kubelet, kube-proxy and pods](/images/system-design/k8s-architecture.svg "You send desired state to the api-server; the rest of the cluster makes it happen.")

| Component | Job |
| --- | --- |
| **api-server** | the single entry point; every read and write of cluster state goes through it |
| **etcd** | a distributed key-value store holding the whole cluster state |
| **scheduler** | picks a node for each new pod based on resource requests and constraints |
| **controller manager** | runs the reconciliation loops (Deployments, ReplicaSets and more) |
| **kubelet** | the agent on every node; starts and stops containers, reports their health |
| **kube-proxy** | sets up node networking so Service addresses reach the right pods |

On a managed service you never touch the control plane, but knowing the parts helps debugging: a pod stuck in `Pending` usually means the scheduler can't find a node with enough free CPU or memory.

## Pods

A **pod** is the smallest thing Kubernetes runs: one or more containers that are always placed on the same node and **share a network namespace and storage**. Containers in a pod talk to each other on `localhost`.

Usually a pod has exactly one container, your app. A second container is a **sidecar**: a log shipper, a metrics exporter or a service-mesh proxy that works alongside the app.

Pods are **disposable**. They're deleted and recreated during deploys, scaling and node failures, and each new pod gets a **new IP address**. Never hard-code a pod IP or rely on a particular pod staying alive. That's what Services and Deployments are for.

## Deployments and ReplicaSets

You almost never create pods directly, because a bare pod isn't replaced if it dies. You create a **Deployment**: "always keep N copies of this pod running". The Deployment manages a **ReplicaSet**, whose only job is maintaining the count, and the ReplicaSet manages the pods.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: course-api
  labels:
    app: course-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: course-api                # manage pods with this label
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                    # at most 1 extra pod during a rollout
      maxUnavailable: 0              # never drop below 3 ready pods
  template:                          # the pod template: every replica is created from this
    metadata:
      labels:
        app: course-api
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: api
          image: ghcr.io/bitwise/course-api:git-9f2c1a7    # an immutable tag, never :latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: course-api-config
            - secretRef:
                name: course-api-secrets
          env:
            - name: NODE_OPTIONS
              value: "--max-old-space-size=384"            # keep the JS heap below the memory limit
          resources:
            requests:
              cpu: 250m                                    # a quarter of a core reserved for scheduling
              memory: 256Mi
            limits:
              memory: 512Mi                                # above this the container is OOMKilled
          startupProbe:                                    # give a slow start up to 60 s
            httpGet:
              path: /healthz
              port: 3000
            periodSeconds: 2
            failureThreshold: 30
          livenessProbe:                                   # stuck? restart the container
            httpGet:
              path: /healthz
              port: 3000
            periodSeconds: 10
            failureThreshold: 3
          readinessProbe:                                  # not ready? take it out of the Service
            httpGet:
              path: /readyz
              port: 3000
            periodSeconds: 5
            failureThreshold: 2
          lifecycle:
            preStop:
              sleep:
                seconds: 5                                 # let load balancers notice before SIGTERM
          securityContext:
            runAsNonRoot: true
            runAsUser: 1000                                # numeric, so Kubernetes can verify it is not root
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
```

That's a lot of YAML, but each section answers one question, and the next sections go through them. (I checked that the app works with this level of lockdown by running the image with `--read-only --cap-drop ALL --security-opt no-new-privileges`; it served `/readyz` normally as uid 1000.)

Other workload types follow the same reconciliation idea with different guarantees:

- **StatefulSet**: pods with stable names and their own persistent storage, for databases and brokers.
- **DaemonSet**: one pod on every node, for log and metrics agents.
- **Job** and **CronJob**: run to completion, once or on a schedule, for migrations and batch work.

## Services, Ingress and Gateway API

Since pod IPs keep changing, traffic goes to a **Service**: a stable name and virtual IP in front of a changing set of pods. It finds its pods with a **label selector** and only sends traffic to pods that are **ready**.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: course-api
spec:
  type: ClusterIP              # reachable inside the cluster as http://course-api
  selector:
    app: course-api            # send traffic to ready pods with this label
  ports:
    - port: 80                 # the Service's port
      targetPort: 3000         # the container's port
```

Other services in the cluster now just call `http://course-api`, the same way Compose services used names.

![Traffic flows from users through an Ingress or Gateway to a Service, which forwards to ready pods that match its label selector; a pod failing readiness gets no traffic](/images/system-design/k8s-traffic.svg "The Service is the stable address; pods behind it come and go.")

Ways to expose a Service:

| Type | Reachable from | Use for |
| --- | --- | --- |
| `ClusterIP` (default) | inside the cluster | service-to-service calls |
| `NodePort` | a port on every node | testing, simple setups |
| `LoadBalancer` | the internet, via a cloud load balancer | exposing one TCP service directly |
| **Ingress** | the internet, via HTTP rules | host and path routing and TLS for many services through one entry point |
| **Gateway API** | the internet, via listeners and routes | the newer, more flexible replacement for Ingress |

An **Ingress** routes by hostname and path and terminates TLS:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: course-api
spec:
  ingressClassName: nginx
  tls:
    - hosts: [api.bitwise.example]
      secretName: api-tls
  rules:
    - host: api.bitwise.example
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: course-api
                port:
                  number: 80
```

Ingress is stable and everywhere, but its API is frozen, and Kubernetes recommends **Gateway API** for new setups. Gateway API splits the job into three resources, so a platform team can own the entry point while each app team owns its routes:

- **GatewayClass**: which controller implements gateways (Envoy Gateway, NGINX Gateway Fabric, a cloud load balancer and so on).
- **Gateway**: an actual entry point with listeners (protocols and ports).
- **HTTPRoute**: the routing rules (host, path) that attach to a Gateway and point at Services.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: envoy
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller   # the installed controller that implements it
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: public
spec:
  gatewayClassName: envoy
  listeners:
    - name: http
      protocol: HTTP
      port: 80
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: course-api
spec:
  parentRefs:
    - name: public               # attach to the Gateway above
  hostnames: ["api.bitwise.example"]
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /courses
      backendRefs:
        - name: course-api       # the Service
          port: 80
```

Both Ingress and Gateway API need a **controller** installed in the cluster to do anything; the YAML only describes what you want.

## Config and secrets

The same tested image should run in development, staging and production, with only configuration changing. So config is **injected at run time**, never baked into the image (the twelve-factor rule from [Chapter 14](/system-design/14-configuration-management/)). Kubernetes has **ConfigMaps** for ordinary settings and **Secrets** for sensitive values:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: course-api-config
data:
  LOG_LEVEL: info
  FEATURE_NEW_CHECKOUT: "false"
---
apiVersion: v1
kind: Secret
metadata:
  name: course-api-secrets
type: Opaque
stringData:                      # example only: real values come from a secret manager, never from git
  DATABASE_URL: postgres://app:change-me@db.internal:5432/courses
```

The Deployment above loads both as environment variables with `envFrom`. They can also be mounted as files, which can be updated without restarting the pod.

**Kubernetes Secrets aren't encrypted by default.** They're stored base64-encoded, and base64 is an encoding anyone can reverse, not encryption. Turn on encryption at rest for etcd, restrict who can read Secrets with RBAC, and for anything sensitive use an external secret manager (AWS Secrets Manager, Google Secret Manager, HashiCorp Vault) synced in with a tool like External Secrets Operator. Never commit real secret values to git.

## Probes and resources

### Three probes, three questions

Kubernetes can't guess whether your app is healthy; the app has to tell it.

- **Liveness**: *is the process stuck?* If it fails repeatedly, Kubernetes **restarts** the container. It catches deadlocks and hangs that don't crash the process.
- **Readiness**: *should this pod get traffic right now?* If it fails, the pod is **removed from the Service** but not restarted. It covers warming up, temporary overload and shutting down.
- **Startup**: *has a slow app finished starting?* Liveness and readiness checks wait until it passes, so a slow boot isn't mistaken for a hang.

Keep liveness checks simple: "is the event loop responding?" If liveness checks the database, a database outage makes Kubernetes restart every pod in a loop, which helps nothing. Put dependency checks in readiness. The example app uses `/healthz` (always `ok` while the process responds) for liveness and `/readyz` (checks the database, and fails during shutdown) for readiness.

Probes work together with graceful shutdown. On a rollout or scale-down, Kubernetes runs the `preStop` hook, sends `SIGTERM`, and waits up to `terminationGracePeriodSeconds`. The short `preStop` sleep gives load balancers time to stop routing to the pod before the app starts closing, and the app's `SIGTERM` handler fails readiness and drains in-flight requests ([Chapter 16](/system-design/16-graceful-shutdown/)). The `sleep` action is built into Kubernetes 1.30 and later, so it works even in images without a shell.

### Requests and limits

- A **request** is what the scheduler **reserves** for the container. It decides which node the pod fits on.
- A **limit** is the **ceiling** the kernel enforces through cgroups.

Go over the **memory limit** and the container is `OOMKilled`, as in the Docker experiment. Go over a **CPU limit** and it's **throttled**: slowed down, not killed. Throttling shows up as mysterious latency spikes, so many teams set CPU requests but no CPU limit, and always set a memory limit. Without requests, the scheduler packs pods blindly and they fight over resources.

## Scaling and rollouts

### Autoscaling

Scaling out means more pod replicas. You can set the number yourself (`kubectl scale deployment/course-api --replicas=6`), or let the **Horizontal Pod Autoscaler** adjust it based on a metric:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: course-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: course-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70     # % of the CPU *request*, so requests must be set
```

When average CPU across the pods goes above 70% of their requests, the HPA adds replicas; when it falls, it removes them. A target around 70% follows the utilization advice from [Chapter 18](/system-design/18-scaling-and-performance-part-1/): enough headroom to absorb a spike while new pods start. It only works because the app is stateless ([Chapter 19](/system-design/19-scaling-and-performance-part-2/)). When pods can't fit on existing nodes, a cluster autoscaler (or Karpenter on AWS) adds nodes.

### Rolling updates and rollback

Change the image tag and apply, and the Deployment does a **rolling update**: it starts a new pod, waits until it passes **readiness**, sends it traffic, removes an old pod, and repeats. With `maxSurge: 1` and `maxUnavailable: 0`, there are always at least 3 ready pods.

```bash
kubectl set image deployment/course-api api=ghcr.io/bitwise/course-api:git-4b7e2d1
kubectl rollout status deployment/course-api      # waits, and fails if the rollout gets stuck
kubectl rollout undo deployment/course-api        # back to the previous version
```

If the new version never becomes ready (it crashes, or can't reach the database), the rollout **stalls** with the old pods still serving, instead of taking the site down. Zero-downtime deploys are the combination of everything in this chapter: replicas, readiness probes, graceful shutdown and Services.

## CI/CD pipelines

Containers make the artifact reproducible. **CI/CD** makes the path from a commit to production automatic.

- **Continuous integration (CI)**: on every push and pull request, run linting and tests, and build the image.
- **Continuous delivery / deployment (CD)**: push the tested image to a registry and roll it out, either automatically or after one approval click.

![A pipeline goes from push to test, build, scan, push to registry and deploy; CI covers the checks and CD covers shipping](/images/system-design/ci-cd-pipeline.svg "Every change takes the same path. A failed step stops it.")

Here's a GitHub Actions workflow that tests against a real Postgres, builds and pushes an image tagged with the commit SHA, scans it, and deploys it:

```yaml
name: ci-cd

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read
  packages: write                  # push images to GitHub Container Registry

env:
  IMAGE: ghcr.io/${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:                    # a real database for integration tests
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 2s --health-retries 15
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm test
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/postgres

  build:
    needs: test
    if: github.ref == 'refs/heads/main'      # only build and ship from main
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ env.IMAGE }}:git-${{ github.sha }}
          cache-from: type=gha                  # reuse layers from earlier runs
          cache-to: type=gha,mode=max
      - name: Scan the image for known vulnerabilities
        run: |
          docker run --rm aquasec/trivy:0.67.0 image --exit-code 1 --severity CRITICAL,HIGH \
            --username "${{ github.actor }}" --password "${{ secrets.GITHUB_TOKEN }}" \
            "${{ env.IMAGE }}:git-${{ github.sha }}"

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production                   # can require a manual approval in GitHub settings
    steps:
      # cluster credentials are set up in an earlier step (for example your cloud provider's login action)
      - name: Roll out the new image
        run: |
          kubectl set image deployment/course-api api="${{ env.IMAGE }}:git-${{ github.sha }}"
          kubectl rollout status deployment/course-api --timeout=5m
```

Things worth copying from it:

- **Tests run against a real database** (a `services:` container), which catches far more than mocks ([Chapter 22](/system-design/22-automated-testing/)).
- **Pull requests run the tests, but only `main` builds and deploys.**
- **The image tag is the commit SHA**, so every running pod points back to exact source code, and rollback is redeploying an older tag.
- **Layer caching in CI** (`cache-from: type=gha`) keeps builds fast.
- **The deploy waits for `rollout status`**, so a stuck rollout fails the pipeline instead of passing silently.
- **Permissions are minimal**, and secrets come from the CI platform, never the repository.

## Deployment strategies and GitOps

Rolling updates are the default. For riskier changes, other strategies limit how many users a bad release can affect:

| Strategy | How it works | Trade-off |
| --- | --- | --- |
| **Rolling** | replace pods a few at a time | simple, zero downtime; old and new versions run together briefly |
| **Blue-green** | run the full new version beside the old one, then switch all traffic at once | instant switch and instant rollback; needs double capacity during the switch |
| **Canary** | send a small share of traffic (say 5%) to the new version, watch error rates and latency, then increase | safest for risky changes; needs good metrics and traffic splitting |

Because old and new versions run at the same time in rolling and canary deploys, changes must be **backward compatible**: database migrations that add columns before code uses them, APIs that accept both old and new formats. **Feature flags** go further, separating *deploying* code from *releasing* a feature, so you can turn something on for 1% of users, or off instantly, without a deploy.

### GitOps

In the pipeline above, CI pushes changes into the cluster. **GitOps** reverses the direction: the desired state of the cluster (all the YAML) lives in a git repository, and an agent running inside the cluster (**Argo CD** or **Flux**) continuously pulls from git and reconciles the cluster to match.

It's the reconciliation loop again, one level up: git is the desired state, the cluster is the actual state, and the agent closes the gap. You deploy by merging a pull request that changes an image tag, roll back with `git revert`, and get a complete, reviewed history of every change to production. Manual changes made directly in the cluster are detected and reverted.

The same idea appears at every level of this chapter: a container keeps the artifact identical everywhere, a Deployment keeps the running pods matching a spec, and GitOps keeps the whole cluster matching git. **Declare the desired state, and let a loop make reality match it.**

## Quick revision

| Concept | Remember |
| --- | --- |
| Container | an isolated process: namespaces (what it sees), cgroups (what it uses), an image (its files) |
| vs VM | shares the host kernel; lighter and faster, weaker isolation |
| Image vs container | immutable template vs running instance |
| Layers | cached and shared; a changed layer rebuilds everything after it |
| Writable layer | disappears with the container; use volumes |
| Dockerfile | `RUN` at build time, `CMD` at start; `.dockerignore` the context |
| Multi-stage | build in one stage, ship only the result (424 MB → 53–80 MB) |
| Base image | slim (default), alpine (musl), distroless (no shell) |
| PID 1 | exec-form `CMD ["node", ...]` so `SIGTERM` reaches the app |
| Memory | over the limit = OOMKilled (137); set `--max-old-space-size` |
| Tags | immutable version or git SHA; never deploy `:latest` |
| Compose | multi-container stack on one host; healthchecks and volumes |
| Kubernetes | declare desired state; controllers reconcile |
| Pod / Deployment | disposable unit / keeps N replicas, rolling updates |
| Service | stable name for ready pods, selected by label |
| Ingress / Gateway API | HTTP entry point; Gateway API is the newer standard |
| ConfigMap / Secret | config injected at run time; Secrets aren't encrypted by default |
| Probes | liveness → restart, readiness → traffic, startup → slow boots |
| Requests / limits | reserved for scheduling / enforced ceiling |
| HPA | scales replicas on a metric relative to requests |
| CI/CD | test → build → scan → push → deploy, tagged by SHA |
| Strategies | rolling, blue-green, canary; feature flags |
| GitOps | git is the source of truth; Argo CD or Flux reconcile |

## Interview questions

1. What problem do containers solve?
2. How is a container different from a virtual machine? What's the security trade-off?
3. What are namespaces and cgroups, and what does each one do for a container?
4. What's the difference between an image and a container? Why are images built in layers?
5. Why does instruction order in a Dockerfile affect build speed? Show a good order for a Node.js app.
6. What is a multi-stage build and why use one?
7. Compare `slim`, `alpine` and distroless base images.
8. Why can `CMD npm start` or the shell form of `CMD` break graceful shutdown?
9. A container keeps restarting with exit code 137. What does that mean and how would you investigate?
10. Why shouldn't you deploy images tagged `:latest`?
11. What's the difference between a named volume and a bind mount?
12. What does Docker Compose do, and when do you outgrow it?
13. What does "declarative desired state" mean in Kubernetes? What is a reconciliation loop?
14. Describe the main components of a Kubernetes cluster.
15. What is a pod? Why do you use Deployments instead of creating pods directly?
16. Why do Services exist? How does a Service know which pods to send traffic to?
17. Compare Ingress and Gateway API.
18. Are Kubernetes Secrets secure? How would you handle secrets properly?
19. What's the difference between liveness, readiness and startup probes? Why shouldn't liveness check the database?
20. What are resource requests and limits? What happens when a container exceeds each?
21. How does a rolling update achieve zero downtime? What happens if the new version is broken?
22. Walk through a CI/CD pipeline for a containerised Node.js service.
23. Compare rolling, blue-green and canary deployments.
24. What is GitOps and what are its benefits?

## Further reading

- [Docker docs: Building best practices](https://docs.docker.com/build/building/best-practices/) and [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Node.js Docker best practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Kubernetes docs: Concepts](https://kubernetes.io/docs/concepts/) and the [interactive tutorial](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
- [Kubernetes: Liveness, readiness and startup probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)
- [Gateway API](https://gateway-api.sigs.k8s.io/)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [The Twelve-Factor App](https://12factor.net/)
- [Argo CD](https://argo-cd.readthedocs.io/) and [Flux](https://fluxcd.io/)

Next: [Chapter 22, Automated Testing](/system-design/22-automated-testing/).
