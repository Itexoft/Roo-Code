import https from "https"
import { AddressInfo } from "net"

import { afterAll, beforeAll, describe, expect, it } from "vitest"
import nock from "nock"

import { allowNetConnect } from "../../../../vitest.setup"
import { getTlsOptions, withTlsFetchInit } from "../tls"

type TestServer = {
	url: string
	close: () => Promise<void>
}

const TEST_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCiVx+Hmme9q/HR
aj1+gWTXwfAIYMBUykwwuCY3plFG5VoYQuWYLOmoZurVKzjru1u3AQIaFw5X0Eoy
zLLPwnrsmGIOmqBXkOaV28S7T86jArqCywUKD/DRehINDQcu9sib6vSlLs/hi2L2
BX5DDTkpwLlHHqkJBz4c4ibkVL/vCKG6Z33Hta4xAcB811XQ1CtFpFKo1bsK6k00
S2RM+r+7+ZMeYGCLa0juKI3uGmeoCqWZHqnMTh3DBUEAIm3PhHcKvweMVHfV+Ndi
/CQ+BID8Sv1FI5fBWebsyTsYV5RErZc9H9TKnzlzAv46rCT8MgEpy1UnJ9FhvDRM
wakjDXUDAgMBAAECggEANFnAEyyZs7KVIqEN/5Oef21NCIaavz0VYMihmmSJ5UDk
0toPzAj/uIynweJUUsByjQtIMD2rJGpI4yTbrN/cYBur02XNuy9BDKZ4RKcxzaN9
ndv2Xg5R7FtfItJGtMBkZNNZ3ULBSsx2NzwCQYEsI+jAVszuWbj6MLpFLHCgDGbK
gXHfU2X6FCnGklNO6YInYkiwtR8Eu80cmMCBnw76D0Cd0jQ9oTqcG29DvlWYi5tm
rdb2GPphmgddAG0PbrWdaN9KvXOZILKX3DPnHYMP//9Wa0MiEzmJ2uFI++ulLikq
p5dcjyAMFn49HwkY+5xTQ3mlC6iBMi5XMD3xTBZwwQKBgQDXf89bUWgmvpRxo7jn
8EC51C7ZGMYK5N41BFkTZeDaCBei483v5dENYoNBxCHunncN4m7YRUCX+jzLBxx2
+nYonA2s7sfNubkg2lEDh6tkb7AuZPCY0iLfGKRM8BAU8gyW8Rfu1ABSQrqIIgsK
2HUzRGTSSTy29gMMjfQHXJVn0QKBgQDA2bVd01ctccAa1ThJuLwh84FPPdcfDAeu
MtchKGh/j8C8OqTapMafk1t3K6yoaNwGp8SIY44uikqkDcjXwKs4FvwfCKZvMDDI
Zz0sLa9dALSaqSNah60YyDYJJ7bmrL8tZbXqGaUKuN4KIMp7AyMgOD5cnzOmnEdM
icIOrCNYkwKBgGxYsDJjbY/9RbkU7cR/QKutiJhSIlAb3bSeKQLdt/0nEGsvSb0R
uNeX7hJEwCKuvYDXlY9a0i0W/TW+r4sKRhoIy79klkRS2kcwPIcf0QZAOT46NdU/
4ZR1WTXthMhjIf1J3hSPtlGlhw8mvpKHXfWWr3IirEn4ynOnc0e4Ps3hAoGANujF
/yUBmWrd68Xx9OuohXIzy0AsVCa0uSC4qDQ9LLTdh7qa3bY055KpZFEHJBxXKX3z
M3JFNXMitXtHSEcPeTTyLFPmL5plCWp7vGx1leFxiufFrS0cWAYJfKnWJe/hryda
mIEcwOTKM9AKVuQZyD67YtvhdPriQiSnIE5a8gkCgYA4TFYW7BLlK+Kl8IPFGutS
5T7n33UvD/nw9SAa2gcEQ4s75tXnIyKBNJstujhgsXX2bA7fs7CKJYz8uHPipCGQ
Viel2STsIAujLQc/2p/OzGdl2CI1Hvgfi3dm2n/Q3eaOhVOCp/IiQ8ioQm5MHumQ
GDa122aS4I+lgUTkhN43cg==
-----END PRIVATE KEY-----`

const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIIDGjCCAgKgAwIBAgIUY4EvV4yBjcQ0qaL7I8HYMaAcEhowDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJMTI3LjAuMC4xMB4XDTI1MTIwODAyNTEyNFoXDTM1MTIw
NjAyNTEyNFowFDESMBAGA1UEAwwJMTI3LjAuMC4xMIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAolcfh5pnvavx0Wo9foFk18HwCGDAVMpMMLgmN6ZRRuVa
GELlmCzpqGbq1Ss467tbtwECGhcOV9BKMsyyz8J67JhiDpqgV5DmldvEu0/OowK6
gssFCg/w0XoSDQ0HLvbIm+r0pS7P4Yti9gV+Qw05KcC5Rx6pCQc+HOIm5FS/7wih
umd9x7WuMQHAfNdV0NQrRaRSqNW7CupNNEtkTPq/u/mTHmBgi2tI7iiN7hpnqAql
mR6pzE4dwwVBACJtz4R3Cr8HjFR31fjXYvwkPgSA/Er9RSOXwVnm7Mk7GFeURK2X
PR/Uyp85cwL+Oqwk/DIBKctVJyfRYbw0TMGpIw11AwIDAQABo2QwYjAdBgNVHQ4E
FgQUwSeVYgvOSpV0Ygb2zjYhTGiPp4IwHwYDVR0jBBgwFoAUwSeVYgvOSpV0Ygb2
zjYhTGiPp4IwDwYDVR0TAQH/BAUwAwEB/zAPBgNVHREECDAGhwR/AAABMA0GCSqG
SIb3DQEBCwUAA4IBAQBswR0B/cnCGKGdFRuHfBeyx0KoS3M3XrDUiMJIKD9hwSHl
M+vIrG7Id+E00jG1aDa16NKqTeKto05oyNHwaJUbO6jCQumO7bWo6RAwwenG74fe
3BBfvCejV1FexTBbbqbOvznMi9d7rx/RX8WA1ZA8Ce/7XEpRHwavz9hBkCqwteF1
5oYwJott34rUE/Z1gRs8pqwEqdMjCNK3VNjX7PPCrHPcfoL0v9RqmCxcPxq9kA/e
MTNObpPZfq087GKvd+UqzWUyLeg+EifsOsvxuN7SmGpNrMVUh97O5eFgeQtJFvFP
x5QiadBMqcc6k2EoPB+GPeSHmDckWcnfR6tcmNXe
-----END CERTIFICATE-----`

function startSelfSignedServer(body: unknown): Promise<TestServer> {
	const server = https.createServer({ key: TEST_KEY, cert: TEST_CERT }, (_req, res) => {
		res.writeHead(200, { "content-type": "application/json" })
		res.end(JSON.stringify(body))
	})

	return new Promise((resolve, reject) => {
		server.listen(0, "127.0.0.1", () => {
			const address = server.address() as AddressInfo
			resolve({
				url: `https://127.0.0.1:${address.port}`,
				close: () =>
					new Promise<void>((closeResolve, closeReject) => {
						server.close((err) => {
							if (err) {
								closeReject(err)
							} else {
								closeResolve()
							}
						})
					}),
			})
		})
		server.on("error", reject)
	})
}

describe("tls utils", () => {
	beforeAll(() => {
		// Allow local connections for this integration-style test.
		allowNetConnect(/127\.0\.0\.1/)
	})

	afterAll(() => {
		nock.disableNetConnect()
	})

	it("returns empty options when disabled", () => {
		expect(getTlsOptions(false)).toEqual({})
		expect(withTlsFetchInit(undefined, false)).toBeUndefined()
	})

	it("caches insecure agents and dispatcher", () => {
		const first = getTlsOptions(true)
		const second = getTlsOptions(true)

		expect(first.httpsAgent).toBe(second.httpsAgent)
		expect(first.httpAgent).toBe(second.httpAgent)
		expect(first.dispatcher).toBe(second.dispatcher)
		expect(first.fetch).toBe(second.fetch)
	})

	it("adds dispatcher to init when skipTlsVerification=true", () => {
		const init = { headers: { foo: "bar" } }
		const withSkip = withTlsFetchInit(init, true)
		const noSkip = withTlsFetchInit(init, false)

		expect(withSkip).toMatchObject({ headers: init.headers })
		expect(withSkip).toHaveProperty("dispatcher")
		expect(noSkip).toBe(init)
	})

	it("allows calling a self-signed https server only when skipTlsVerification is true", async () => {
		const server = await startSelfSignedServer({ ok: true })

		try {
			await expect(fetch(server.url)).rejects.toThrow()

			const tls = getTlsOptions(true)
			const response = await (tls.fetch ?? fetch)(server.url)
			const data = await response.json()

			expect(data).toEqual({ ok: true })
		} finally {
			await server.close()
		}
	})
})
