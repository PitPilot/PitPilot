#!/usr/bin/env node

/**
 * Minimal HTTP load test harness for PitPilot endpoints.
 *
 * Example:
 * node scripts/loadtest.mjs \
 *   --url https://pitpilot.org \
 *   --path /api/health \
 *   --method GET \
 *   --concurrency 20 \
 *   --requests 1000
 */

import { performance } from "node:perf_hooks";
import process from "node:process";

function argValue(flag, fallback = null) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function argNumber(flag, fallback) {
  const raw = argValue(flag, null);
  if (raw === null) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function argList(flag) {
  const values = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === flag && process.argv[i + 1]) {
      values.push(process.argv[i + 1]);
    }
  }
  return values;
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  const idx = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor((p / 100) * sortedValues.length))
  );
  return sortedValues[idx];
}

function parseHeaders(values) {
  const headers = {};
  for (const entry of values) {
    const splitAt = entry.indexOf(":");
    if (splitAt <= 0) continue;
    const key = entry.slice(0, splitAt).trim();
    const value = entry.slice(splitAt + 1).trim();
    if (!key) continue;
    headers[key] = value;
  }
  return headers;
}

async function main() {
  const baseUrl = argValue("--url", "http://localhost:3000");
  const path = argValue("--path", "/api/health");
  const method = (argValue("--method", "GET") ?? "GET").toUpperCase();
  const concurrency = Math.max(1, argNumber("--concurrency", 10));
  const requests = Math.max(1, argNumber("--requests", 500));
  const timeoutMs = Math.max(1000, argNumber("--timeout-ms", 15000));
  const p95BudgetMs = argNumber("--p95-budget-ms", 1500);
  const maxErrorRate = Math.max(0, Math.min(1, argNumber("--max-error-rate", 0.02)));
  const bodyRaw = argValue("--body", null);
  const headers = parseHeaders(argList("--header"));
  const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  let nextRequest = 0;
  let completed = 0;
  let failed = 0;
  const latencies = [];
  const statusCounts = new Map();
  const startedAt = performance.now();

  async function runWorker() {
    while (true) {
      const id = nextRequest;
      if (id >= requests) return;
      nextRequest += 1;

      const started = performance.now();
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(url, {
          method,
          headers,
          body: bodyRaw,
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(timer);

        const elapsed = performance.now() - started;
        latencies.push(elapsed);
        completed += 1;
        statusCounts.set(response.status, (statusCounts.get(response.status) ?? 0) + 1);
        if (response.status >= 400) failed += 1;
      } catch {
        const elapsed = performance.now() - started;
        latencies.push(elapsed);
        completed += 1;
        failed += 1;
        statusCounts.set("network_error", (statusCounts.get("network_error") ?? 0) + 1);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => runWorker());
  await Promise.all(workers);
  const elapsedMs = performance.now() - startedAt;

  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  const avg = sorted.reduce((sum, v) => sum + v, 0) / Math.max(1, sorted.length);
  const rps = completed / Math.max(1, elapsedMs / 1000);
  const errorRate = failed / Math.max(1, completed);

  console.log("=== Load Test Summary ===");
  console.log(`URL: ${url}`);
  console.log(`Method: ${method}`);
  console.log(`Total requests: ${completed}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Duration: ${(elapsedMs / 1000).toFixed(2)}s`);
  console.log(`Throughput: ${rps.toFixed(2)} req/s`);
  console.log(`Average latency: ${avg.toFixed(1)} ms`);
  console.log(`p50 latency: ${p50.toFixed(1)} ms`);
  console.log(`p95 latency: ${p95.toFixed(1)} ms`);
  console.log(`p99 latency: ${p99.toFixed(1)} ms`);
  console.log(`Error rate: ${(errorRate * 100).toFixed(2)}%`);
  console.log("Status counts:", Object.fromEntries(statusCounts.entries()));

  const passed = errorRate <= maxErrorRate && p95 <= p95BudgetMs;
  if (!passed) {
    console.error(
      `Load test failed thresholds: p95<=${p95BudgetMs}ms and errorRate<=${(
        maxErrorRate * 100
      ).toFixed(2)}%`
    );
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
