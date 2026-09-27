import { expect, test } from "bun:test"
import type { IncomingMessage, ServerResponse } from "node:http"
import { PasswordAuth, readLoginPassword } from "../server/auth"

function fixture() {
  let cookie = ""
  const req = {
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
  } as IncomingMessage
  const res = {
    setHeader: (_name: string, value: string) => {
      cookie = value
    },
  } as unknown as ServerResponse
  return { req, res, cookie: () => cookie }
}
test("reads the Recat password environment setting", () => {
  const previous = process.env.RECAT_PASSWORD
  try {
    process.env.RECAT_PASSWORD = "fixture-recat-password"
    expect(readLoginPassword() === "fixture-recat-password").toBe(true)
  } finally {
    if (previous === undefined) delete process.env.RECAT_PASSWORD
    else process.env.RECAT_PASSWORD = previous
  }
})
test("login expires after eight hours, rejects forged cookies, and logout invalidates a session", () => {
  let now = 1000
  const auth = new PasswordAuth("fixture-password", () => now)
  const { req, res, cookie } = fixture()
  req.headers.cookie = "recat_session=forged"
  expect(auth.authenticated(req)).toBe(false)
  expect(auth.login(req, res, "fixture-password")).toBe(200)
  expect(cookie()).toStartWith("recat_session=")
  req.headers.cookie = cookie().split(";")[0]
  expect(auth.authenticated(req)).toBe(true)
  now += 8 * 60 * 60 * 1000
  expect(auth.authenticated(req)).toBe(false)
  expect(auth.login(req, res, "fixture-password")).toBe(200)
  req.headers.cookie = cookie().split(";")[0]
  auth.logout(req, res)
  expect(auth.authenticated(req)).toBe(false)
  expect(cookie()).toContain("Max-Age=0")
})
test("missing password fails closed and repeated incorrect passwords are limited", () => {
  const { req, res } = fixture()
  expect(new PasswordAuth("").login(req, res, "")).toBe(503)
  let now = 1000
  const auth = new PasswordAuth("fixture-password", () => now)
  for (let i = 0; i < 5; i++)
    expect(auth.login(req, res, "incorrect")).toBe(401)
  expect(auth.login(req, res, "fixture-password")).toBe(429)
  now += 15 * 60 * 1000
  expect(auth.login(req, res, "fixture-password")).toBe(200)
})
