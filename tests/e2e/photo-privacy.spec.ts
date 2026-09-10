import { test, expect, request as pwRequest } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const swatch = readFileSync(path.join(__dirname, "..", "fixtures", "swatch.jpg"));

async function signUpAndLogin(baseURL: string, tag: string) {
  const email = `priv_${tag}_${Date.now()}@example.com`;
  const password = "test-password-123";
  const ctx = await pwRequest.newContext({ baseURL });
  const su = await ctx.post("/api/auth/signup", {
    data: { name: tag, email, password },
  });
  expect(su.ok()).toBeTruthy();

  // Drive the NextAuth credentials callback to obtain a session cookie.
  const csrfRes = await ctx.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  await ctx.post("/api/auth/callback/credentials", {
    form: { csrfToken, email, password, json: "true" },
  });
  return ctx;
}

test("a user cannot fetch another user's photo bytes", async ({ baseURL }) => {
  const alice = await signUpAndLogin(baseURL!, "alice");
  const bob = await signUpAndLogin(baseURL!, "bob");

  const up = await alice.post("/api/photos", {
    multipart: {
      image: { name: "swatch.jpg", mimeType: "image/jpeg", buffer: swatch },
      label: "Baseline",
    },
  });
  expect(up.status()).toBe(201);
  const photo = await up.json();
  const id = photo.id as string;

  // Alice can read her own file.
  const own = await alice.get(`/api/photos/${id}/file`);
  expect(own.status()).toBe(200);
  expect(own.headers()["content-type"]).toContain("image/jpeg");

  // Bob cannot — ownership scope hides its existence.
  const cross = await bob.get(`/api/photos/${id}/file`);
  expect(cross.status()).toBe(404);

  // Anonymous is rejected outright.
  const anon = await pwRequest.newContext({ baseURL });
  expect((await anon.get(`/api/photos/${id}/file`)).status()).toBe(401);

  await alice.dispose();
  await bob.dispose();
  await anon.dispose();
});

test("upload rejects a non-image payload", async ({ baseURL }) => {
  const ctx = await signUpAndLogin(baseURL!, "malformed");
  const res = await ctx.post("/api/photos", {
    multipart: {
      image: {
        name: "evil.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("<?php system($_GET[c]); ?>"),
      },
      label: "Baseline",
    },
  });
  expect(res.status()).toBe(415);
  await ctx.dispose();
});
