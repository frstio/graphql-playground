import debounce from 'lodash.debounce'
import { Store } from 'redux'
import { deserializePersistedState } from './workspace/deserialize'

export function serializeState(
	store: Store<any>,
	endpoint: string,
	headers?: Record<string, string>,
) {
	return debounce(
		async () => {
			const state = store.getState()
			if (!state.stateInjected) {
				await fetch(endpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', ...headers },
					body: JSON.stringify(state),
				})
			}
		},
		1000,
		{ trailing: true },
	) as any
}

export async function deserializeState(
	endpoint: string,
	headers: Record<string, string>,
) {
	try {
		const state = await fetch(endpoint, { headers }).then(req => req.json())
		if (state) {
			const result = deserializePersistedState(state) as any
			return result
		}
	} catch (e) {}
	return undefined
}
