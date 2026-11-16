---
title: Configuration Management
description: All the settings that decide how the same code behaves in different places. Kinds of configuration, environment variables and .env files, YAML config files, secret managers, merging sources by priority, per-environment values, feature flags and gradual rollouts, keeping secrets safe, and validating everything at startup, with Node.js code.
author: Bitwise School
---

> **Configuration management** is the systematic way you organise, store, access and maintain all the **settings** of your backend.

Configuration is your app's DNA. The **same code** can run very differently on your laptop, in CI, in staging and in production, purely because of its configuration. That's by design.

## It's much more than secrets

Say "config" and most people think of database passwords, JWT secrets and API keys. Those matter, but thinking config is only secrets is like thinking a car is only its engine. Configuration also decides:

- **how the app starts**: which port, which modules to load,
- **how it connects** to databases, caches, queues and third-party APIs,
- **how it behaves per environment**: development vs staging vs production,
- **what it logs**, at what level, and where,
- **where metrics go**,
- **which features are on**, and for which users.

For a course platform, the configuration might include:

| Setting | Example | Secret? | Changes how often? | Same everywhere? |
| --- | --- | --- | --- | --- |
| database connection | host, port, user, password, timeouts | password: **yes** | rarely | no |
| payment gateway keys | Razorpay or Stripe API keys | **yes** | on rotation | no (test vs live keys) |
| feature flags | "new checkout on for 20% of users in India" | no | often, during rollouts | no |
| performance tuning | DB pool size, request timeout | no | sometimes | no |
| security settings | session lifetime, allowed CORS origins | partly | rarely | no |
| business rules | max cart value, coupon limits | no | monthly or quarterly | often yes |

Each kind needs different handling: secrets must never leak, flags need to change quickly, business rules can be fairly static. That variety is why configuration needs a real strategy.

## Why the stakes are high

Modern backends are distributed: several services, databases, caches, queues, auth providers, email and payment gateways. Every connection point needs configuration, plus settings for how to handle failures (timeouts, retries), how to perform (pool sizes) and how to stay secure.

A misconfigured **frontend** might show the wrong button. A misconfigured **backend** can expose customer data, charge cards wrongly or take the whole platform down. And backends run in many places (cloud VMs, containers, Kubernetes, serverless and edge functions), each with its own way of supplying configuration.

Without a system, you get **configuration chaos**:

- values hard-coded and scattered through the codebase,
- different behaviour in each environment for no obvious reason,
- secrets leaked into git, logs and screenshots,
- bugs nobody can reproduce, because nobody knows which settings production actually had.

## Kinds of configuration

**Application settings.** Log level (`debug` locally so you see everything; `info` in production so logs stay useful), port, connection pool size and timeouts.

Timeouts are a good example of config deciding success or failure. If generating an AI image takes 80 seconds but your server or proxy times out at 60, every such request fails with **504 Gateway Timeout**, even though nothing is broken.

**Database settings.** Host, port, user, password, database name, query timeout. Usually combined into one connection URL like `postgres://user:pass@host:5432/coursehub`.

**External services.** Almost every provider (email, payments, SMS, auth, AI) needs an API key, and often a base URL or region.

**Feature flags.** Switch features on or off without deploying code, and target them at specific users (covered below).

**Others.** Infrastructure settings, security settings (JWT and session secrets, CORS origins), runtime tuning (Node's `--max-old-space-size`, Go's `GOMAXPROCS`) and business rules you'd rather change in config than in code.

## Where configuration lives

### Environment variables

The most common source. Environment variables are a feature of the **operating system**: key-value pairs every process can read. In Node.js you read them from `process.env`.

Locally, people keep them in a **`.env` file**. Libraries like `dotenv` read that file into the environment, but recent Node versions can do it themselves:

```bash
node --env-file=.env server.js
```

```js
process.loadEnvFile(".env");   // the same, from code (Node 20.12+ / 21.7+)
```

```bash
# .env: local development only. Commit a .env.example with dummy values instead.
DATABASE_URL=postgres://dev:dev@localhost:5432/coursehub
JWT_SECRET=dev-secret-that-is-at-least-32-chars-long
LOG_LEVEL=debug
```

**Never commit `.env`**: add it to `.gitignore`, and commit a `.env.example` listing every variable with fake values so new teammates know what to set.

In deployment there's no `.env` file. The platform (Kubernetes, Docker, Vercel, Render, a CI/CD pipeline) injects environment variables when the app starts, often fetching the secret ones from a secret manager first. The **Twelve-Factor App** guidelines popularised this idea: keep config in the environment, separate from code, so one build artifact can run anywhere.

### Config files

For structured, non-secret settings, files are tidier than dozens of environment variables:

| Format | Comments? | Notes |
| --- | --- | --- |
| JSON | **no** | can't explain *why* a value is what it is |
| YAML | yes | the most common choice for config today (Docker Compose, Kubernetes, GitHub Actions) |
| TOML | yes | simple and explicit; popular in Rust and Python tools |

JSON's lack of comments is a real drawback for config: a team can't leave notes like "keep this below 50 or the database runs out of connections". Many open-source servers ship a single `config.yaml` with server, logging, storage and session settings.

```yaml
# Settings shared by every environment (no secrets here)
server:
  port: 3000
  requestTimeoutMs: 30000
db:
  poolMax: 10
features:
  newCheckout:
    enabled: false
    countries: []
    rolloutPercent: 0
```

```yaml
# Production overrides
db:
  poolMax: 50
features:
  newCheckout:
    enabled: true
    countries: ["IN"]
    rolloutPercent: 20
```

### Key-value stores and secret managers

- **Key-value config stores** like **Consul** and **etcd** hold shared settings that many services read, and can notify services when a value changes.
- **Secret managers** like **HashiCorp Vault**, **AWS Secrets Manager / SSM Parameter Store**, **Azure Key Vault** and **Google Secret Manager** store secrets centrally, with encryption, access control, audit logs and rotation built in. Use one as soon as you have real users and real secrets.

### Hybrid: merge several sources by priority

Most real apps combine sources: defaults in a file, per-environment overrides in another file, deploy-time values in environment variables, and secrets from a secret manager. You decide the **priority order**, merge them into one object, and validate it.

![Defaults, an environment file, environment variables and a secret manager merged by priority, validated with Zod into one frozen config object](/images/system-design/config-layers.svg "Code reads one validated object. It never reaches into process.env directly.")

```js
// config.js: load settings from several sources, merge by priority, validate, freeze.
import fs from "node:fs";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

// Local development convenience: read .env if present (built into Node 20.12+ / 21.7+)
if (fs.existsSync(".env") && process.env.NODE_ENV !== "production") process.loadEnvFile(".env");

const readYaml = (file) => (fs.existsSync(file) ? parseYaml(fs.readFileSync(file, "utf8")) ?? {} : {});

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
const deepMerge = (base, override) => {
  const out = { ...base };
  for (const [key, value] of Object.entries(override ?? {})) {
    out[key] = isObject(value) && isObject(base?.[key]) ? deepMerge(base[key], value) : value;
  }
  return out;
};

const ConfigSchema = z.object({
  env: z.enum(["development", "test", "staging", "production"]),
  logLevel: z.enum(["debug", "info", "warn", "error"]),
  server: z.object({
    port: z.coerce.number().int().min(1).max(65535),
    requestTimeoutMs: z.coerce.number().int().positive(),
  }),
  db: z.object({
    url: z.url(),
    poolMax: z.coerce.number().int().min(1).max(200),
  }),
  jwtSecret: z.string().min(32, "must be at least 32 characters"),
  features: z.object({
    newCheckout: z.object({
      enabled: z.boolean(),
      countries: z.array(z.string().length(2)),
      rolloutPercent: z.number().min(0).max(100),
    }),
  }),
});

export function loadConfig(env = process.env, secrets = {}) {
  const name = env.NODE_ENV ?? "development";
  // Lowest priority first: defaults < file for this environment < environment variables < secret manager
  const merged = [
    readYaml("config/default.yaml"),
    readYaml(`config/${name}.yaml`),
    {
      env: name,
      logLevel: env.LOG_LEVEL ?? (name === "production" ? "info" : "debug"),
      server: { port: env.PORT },
      db: { url: env.DATABASE_URL, poolMax: env.DB_POOL_MAX },
      jwtSecret: env.JWT_SECRET,
    },
    secrets,
  ].reduce((acc, layer) => deepMerge(acc, stripUndefined(layer)), {});

  const result = ConfigSchema.safeParse(merged);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid configuration for "${name}":\n${problems}`);
  }
  return deepFreeze(result.data);
}

function stripUndefined(obj) {
  if (!isObject(obj)) return obj;
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined).map(([k, v]) => [k, stripUndefined(v)]));
}
function deepFreeze(obj) {
  for (const v of Object.values(obj)) if (v && typeof v === "object") deepFreeze(v);
  return Object.freeze(obj);
}

export const config = loadConfig(process.env, await fetchSecrets());   // fetchSecrets(): read from your secret manager (or return {} locally)
```

What it produced in tests:

```text
development: {"env":"development","logLevel":"debug","poolMax":10,"port":3000, ...}       ← .env + default.yaml
production:  {"env":"production","logLevel":"info","poolMax":50,"port":8080, ...}         ← production.yaml + env vars + secrets

Invalid configuration for "production":
  - server.port: Too big: expected number to be <=65535
  - db.url: Invalid input: expected string, received undefined
  - jwtSecret: Invalid input: expected string, received undefined
```

Every module imports `config` and reads typed, validated values like `config.db.poolMax`. **Nothing else touches `process.env`.** That one rule removes a whole class of "it works on my machine" bugs. The object is frozen, so code can't change settings at runtime by accident.

## Why each environment has different settings

Each environment has different priorities:

| Environment | Top priority |
| --- | --- |
| **Development** (your laptop) | developer speed and easy debugging |
| **Test** (CI, e.g. GitHub Actions) | automated, repeatable checks |
| **Staging** | behaving as much like production as possible |
| **Production** | reliability, security and performance |

The code stays the same; only the configuration changes. Take the database pool size:

| Environment | Max pool size | Why |
| --- | --- | --- |
| development | 10 | plenty for one developer |
| staging | 2 | only testers use it, so save cloud costs and accept a little slowness |
| production | 50 | real traffic and spikes |

Staging is meant to mirror production, but a full copy would double the cloud bill. Keeping some settings smaller there is a deliberate, config-driven trade-off, possible only because the value lives in config and not in code.

## Feature flags

A **feature flag** turns a feature on or off without a deploy, and can target it at specific users. Uses:

- **Gradual rollout**: turn the new checkout on for 5% of users, watch errors and conversions, then 20%, 50%, 100%.
- **Targeting**: new checkout for users in India first, everyone else later.
- **A/B testing**: compare two versions on real users.
- **Kill switch**: if the new feature misbehaves at 2 AM, switch it off in seconds, no deploy needed.

The rollout must be **stable**: a user who sees the new checkout once should keep seeing it. Hashing the user id into a bucket from 0 to 99 does that:

```js
import crypto from "node:crypto";

export function isEnabled(flag, user) {
  if (!flag.enabled) return false;
  if (flag.countries.length > 0 && !flag.countries.includes(user.country)) return false;
  const bucket = crypto.createHash("sha256").update(String(user.id)).digest().readUInt32BE(0) % 100;
  return bucket < flag.rolloutPercent;   // the same user always lands in the same bucket
}

if (isEnabled(config.features.newCheckout, req.user)) return newCheckout(req, res);
return oldCheckout(req, res);
```

With `countries: ["IN"]` and `rolloutPercent: 20`, a test over 10,000 users (half in India) switched the flag on for 1,012 Indian users, about 20% of them, and for none outside India.

Flags in a config file need a redeploy or restart to change. To flip them instantly, teams store flags in a database or Redis, or use a flag service (LaunchDarkly, Unleash, GrowthBook, Flagsmith). **Clean flags up** once a rollout reaches 100%. Old flags pile up into confusing dead branches.

## Keeping configuration safe

1. **Never hard-code secrets.** They end up in git history (forever, even after you delete the line), in screenshots and in logs.
2. **Use a secret manager.** It encrypts secrets at rest and in transit, controls who can read each one, keeps an audit log and helps with rotation. When it comes to secrets, a little over-engineering is fine.
3. **Least privilege.** Frontend developers need the API URL, not the database password. Backend developers need the database and Redis, not cloud admin credentials. Each service should be able to read only its own secrets.
4. **Rotate secrets** regularly, and **immediately** if one might have leaked. Rewriting git history isn't enough: assume anything that ever reached a public repository is compromised, and revoke it.
5. **Scan for leaks.** Tools like `gitleaks`, or GitHub's secret scanning, catch keys before or right after they're pushed.
6. **Don't log config.** A startup log line that prints the whole config object prints your secrets too. Log what loaded, not the values.

### Validate everything, at startup

If you take one thing from this chapter: **validate your configuration at startup, wherever it comes from.** A missing variable otherwise surfaces hours later as a strange bug for one unlucky user. Validation turns it into a loud, immediate failure with a clear message, before the app accepts traffic ([Chapter 12](/system-design/12-error-handling-and-fault-tolerance/)). With rolling deployments, a new version that fails validation never goes live, and the old one keeps serving users.

| Language | Library |
| --- | --- |
| JavaScript / TypeScript | Zod |
| Python | pydantic-settings |
| Go | go-playground/validator (often with envconfig or Viper) |
| Java / Spring | `@ConfigurationProperties` with Jakarta Validation |

Mark each setting as required or optional, give optional ones defaults in code, and check types and ranges (a port is 1 to 65535; a pool size isn't 0 or 10,000).

## Quick revision

| Idea | One line |
| --- | --- |
| Configuration | every setting that changes behaviour without changing code |
| Scope | startup, connections, environments, logging, metrics, features, not just secrets |
| Chaos | hard-coded values, inconsistent environments, leaked secrets, unreproducible bugs |
| Env vars | OS key-values; `.env` locally (`node --env-file`), injected by the platform in deployment |
| Files | YAML/TOML for structured, commented, non-secret settings |
| Secret managers | Vault, AWS, Azure, GCP: encrypted, access-controlled, audited, rotatable |
| Hybrid | defaults < env file < env vars < secrets, merged then validated |
| Per environment | same code, different values (pool 10 / 2 / 50) |
| Feature flags | rollouts, targeting, A/B tests, kill switches; stable hashing |
| Safety | no hard-coded secrets, least privilege, rotation, leak scanning |
| Validation | at startup; exit with a clear list if anything is wrong |

## Interview questions

1. What counts as configuration besides secrets?
2. Why should configuration be separate from code? What does the Twelve-Factor App say about it?
3. How do environment variables reach a Node.js app locally, and in production?
4. Why is YAML often preferred over JSON for config files?
5. What does a secret manager give you over environment variables alone?
6. How would you combine defaults, files, environment variables and secrets? In what priority order?
7. Why might staging use a smaller connection pool than production?
8. What are feature flags used for? How do you roll a feature out to 20% of users consistently?
9. A secret was committed to a public repository. What do you do?
10. Why validate configuration at startup? What happens if you don't?

## Further reading

- [The Twelve-Factor App: config](https://12factor.net/config)
- [Node.js: --env-file and process.loadEnvFile](https://nodejs.org/api/cli.html#--env-filefile)
- [HashiCorp Vault](https://developer.hashicorp.com/vault/docs), [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/), [Google Secret Manager](https://cloud.google.com/secret-manager/docs)
- [OWASP: Secrets management cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Martin Fowler: Feature toggles](https://martinfowler.com/articles/feature-toggles.html)

Next: [Chapter 15, Logging and Observability](/system-design/15-logging-and-observability/).
