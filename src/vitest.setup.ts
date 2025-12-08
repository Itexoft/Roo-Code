import { vi } from "vitest"
import nock from "nock"

// Mock vscode before importing utilities so the module resolves in the test environment.
vi.mock("vscode", () => ({
	workspace: {
		workspaceFolders: [],
		getConfiguration: () => ({
			get: () => undefined,
		}),
		getWorkspaceFolder: () => undefined,
	},
	window: {
		activeTextEditor: undefined,
		env: {
			clipboard: {
				readText: async () => "",
				writeText: async () => {},
			},
		},
	},
	commands: {
		executeCommand: async () => {},
	},
	Uri: {
		file: (fsPath: string) => ({ fsPath }),
	},
}))

import "./utils/path" // Import to enable String.prototype.toPosix().

// Disable network requests by default for all tests.
nock.disableNetConnect()

export function allowNetConnect(host?: string | RegExp) {
	if (host) {
		nock.enableNetConnect(host)
	} else {
		nock.enableNetConnect()
	}
}

// Global mocks that many tests expect.
global.structuredClone = global.structuredClone || ((obj: any) => JSON.parse(JSON.stringify(obj)))
