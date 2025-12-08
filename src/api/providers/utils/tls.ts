import https from "https"
import { Agent as UndiciAgent, type Dispatcher } from "undici"

// Allow passing undici dispatcher through fetch init (not in standard RequestInit typing).
type FetchInitWithDispatcher = RequestInit & { dispatcher?: Dispatcher }

type TlsOptions = {
	httpAgent?: https.Agent
	httpsAgent?: https.Agent
	dispatcher?: Dispatcher
	fetch?: typeof fetch
}

let insecureHttpsAgent: https.Agent | undefined
let insecureDispatcher: Dispatcher | undefined
let insecureFetch: typeof fetch | undefined

function ensureInsecureTransports() {
	if (!insecureHttpsAgent) {
		insecureHttpsAgent = new https.Agent({ rejectUnauthorized: false })
	}

	if (!insecureDispatcher) {
		insecureDispatcher = new UndiciAgent({ connect: { rejectUnauthorized: false } })
	}

	if (!insecureFetch) {
		const dispatcher = insecureDispatcher!
		insecureFetch = ((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
			fetch(input, { ...(init ?? {}), dispatcher } as FetchInitWithDispatcher)) as typeof fetch
	}
}

/**
 * Returns shared TLS overrides that skip certificate verification.
 * Use only when skipTlsVerification is true for a specific endpoint/profile.
 */
export function getTlsOptions(skipTlsVerification?: boolean): TlsOptions {
	if (!skipTlsVerification) {
		return {}
	}

	ensureInsecureTransports()

	return {
		httpAgent: insecureHttpsAgent,
		httpsAgent: insecureHttpsAgent,
		dispatcher: insecureDispatcher,
		fetch: insecureFetch,
	}
}

/**
 * Helper to wrap fetch init with an insecure dispatcher when needed.
 */
export function withTlsFetchInit(
	init: Parameters<typeof fetch>[1] | undefined,
	skipTlsVerification?: boolean,
): Parameters<typeof fetch>[1] | undefined {
	if (!skipTlsVerification) {
		return init
	}

	ensureInsecureTransports()
	return { ...(init ?? {}), dispatcher: insecureDispatcher } as FetchInitWithDispatcher
}
