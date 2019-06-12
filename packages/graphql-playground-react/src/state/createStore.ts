import { compose, createStore, Store, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import rootSaga from './rootSaga'
import rootReducer from './workspace/reducers'
import { getSelectedSession } from './sessions/selectors'
import { deserializeState, serializeState } from './fetchWorkspace'

const sagaMiddleware = createSagaMiddleware()
const functions = [applyMiddleware(sagaMiddleware)]

const composeEnhancers =
	(window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export function createStoreSync(
	endpoint?: string,
	headers?: Record<string, string>,
): Store<any> {
	const initialState = undefined
	const store = createStore(
		rootReducer,
		initialState,
		composeEnhancers.apply(null, functions),
	)

	store.subscribe(serializeState(store, endpoint || '', headers))
	;(window as any).s = store
	;(window as any).session = () => {
		return getSelectedSession(store.getState())
	}

	sagaMiddleware.run(rootSaga)
	return store
}

export default async (
	endpoint: string,
	headers: Record<string, string>,
): Promise<Store<any>> => {
	const initialState = await deserializeState(endpoint, headers)
	const store = createStore(
		rootReducer,
		initialState,
		composeEnhancers.apply(null, functions),
	)

	store.subscribe(serializeState(store, endpoint, headers))
	;(window as any).s = store
	;(window as any).session = () => {
		return getSelectedSession(store.getState())
	}

	sagaMiddleware.run(rootSaga)
	return store
}
