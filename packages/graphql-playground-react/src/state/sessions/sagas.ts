import { parse } from 'graphql'
import { fromJS, is } from 'immutable'
import * as queryString from 'query-string'
import { delay } from 'redux-saga'
import {
	call,
	ForkEffect,
	put,
	select,
	takeEvery,
	takeLatest,
} from 'redux-saga/effects'
import { getQueryFacts } from '../../components/Playground/util/getQueryFacts'
import { getQueryTypes } from '../../components/Playground/util/getQueryTypes'
import getSelectedOperationName from '../../components/Playground/util/getSelectedOperationName'
import { getNewStack, getRootMap } from '../../components/Playground/util/stack'
import { prettify, safely } from '../../utils'
import { setStacks } from '../docs/actions'
import { DocsSessionState } from '../docs/reducers'
import { getSessionDocsState } from '../docs/selectors'
import { addHistoryItem } from '../history/actions'
import { HistoryState } from '../history/reducers'
import { getSelectedWorkspace, getSettings } from '../workspace/reducers'
import {
	editQuery,
	fetchSchema,
	refetchSchema,
	runQuery,
	schemaFetchingError,
	schemaFetchingSuccess,
	// fetchSchema,
	setOperationName,
	setOperations,
	setQueryTypes,
	setTracingSupported,
	setVariableToType,
} from './actions'
import { schemaFetcher } from './fetchingSagas'
import { Session } from './reducers'
import { getIsPollingSchema, getSelectedSession } from './selectors'

function* setQueryFacts() {
	// debounce by 100 ms
	yield call(delay, 100)
	const session: Session = yield select(getSelectedSession)

	const { schema } = yield schemaFetcher.fetch(session)
	try {
		const ast = parse(session.query)
		const queryFacts = getQueryFacts(schema, ast)

		if (queryFacts) {
			const immutableQueryFacts = fromJS(queryFacts)
			const operationName = getSelectedOperationName(
				session.operations,
				session.operationName,
				immutableQueryFacts.operations,
			)
			if (
				!is(
					immutableQueryFacts.get('variableToType'),
					session.variableToType,
				)
			) {
				// set variableToType
				yield put(
					setVariableToType(
						immutableQueryFacts.get('variableToType'),
					),
				)
			}
			if (
				!is(immutableQueryFacts.get('operations'), session.operations)
			) {
				// set operations
				yield put(setOperations(immutableQueryFacts.get('operations')))
			}
			if (operationName !== session.operationName) {
				yield put(setOperationName(operationName))
			}
		}

		const queryTypes = getQueryTypes(ast)
		yield put(setQueryTypes(queryTypes))
	} catch (e) {
		const queryTypes = getQueryTypes(null)
		yield put(setQueryTypes(queryTypes))
	}
}

function* reflectQueryToUrl({ payload }) {
	// debounce by 100 ms
	yield call(delay, 100)
	if (!location.search.includes('query')) {
		return
	}

	const params = queryString.parse(location.search)
	if (typeof params.query !== 'undefined') {
		const newSearch = queryString.stringify({
			...params,
			query: payload.query,
		})
		const url = `${location.origin}${location.pathname}?${newSearch}`
		window.history.replaceState(
			{},
			document.getElementsByTagName('title')[0].innerHTML,
			url,
		)
	}
}

function* runQueryAtPosition(action) {
	const { position } = action.payload
	const session: Session = yield select(getSelectedSession)
	if (session.operations) {
		let operationName
		const operations = session.operations.toJS()
		operations.forEach((operation: any) => {
			if (
				operation.loc &&
				operation.loc.start <= position &&
				operation.loc.end >= position
			) {
				operationName = operation.name && operation.name.value
			}
		})
		if (operationName) {
			yield put(runQuery(operationName))
		} else {
			yield put(runQuery())
		}
	} else {
		yield put(runQuery())
	}
}

function* getSessionWithCredentials() {
	const session = yield select(getSelectedSession)
	const settings = yield select(getSettings)

	return {
		endpoint: session.endpoint,
		headers: session.headers,
		credentials: settings['request.credentials'],
	}
}

function* fetchSchemaSaga() {
	const session: Session = yield getSessionWithCredentials()
	try {
		yield schemaFetcher.fetch(session)
		yield put(
			schemaFetchingSuccess(
				session.endpoint,
				null,
				yield select(getIsPollingSchema),
			),
		)
	} catch (e) {
		yield put(schemaFetchingError(session.endpoint))
		yield call(delay, 5000)
		yield put(fetchSchema())
	}
}

function* refetchSchemaSaga() {
	const session: Session = yield getSessionWithCredentials()
	try {
		yield schemaFetcher.refetch(session)
		yield put(
			schemaFetchingSuccess(
				session.endpoint,
				null,
				yield select(getIsPollingSchema),
			),
		)
	} catch (e) {
		yield put(schemaFetchingError(session.endpoint))
		yield call(delay, 5000)
		yield put(refetchSchema())
	}
}

let lastSchema

function* renewStacks() {
	const session: Session = yield select(getSelectedSession)
	const fetchSession = yield getSessionWithCredentials()
	const docs: DocsSessionState = yield select(getSessionDocsState)
	const result = yield schemaFetcher.fetch(fetchSession)
	const { schema, tracingSupported } = result
	if (schema && (!lastSchema || lastSchema !== schema)) {
		const rootMap = getRootMap(schema)
		const stacks = docs.navStack
			.map(stack => getNewStack(rootMap, schema, stack))
			.filter(s => s)
		yield put(setStacks(session.id, stacks))
		yield put(setTracingSupported(tracingSupported))
		lastSchema = schema
	}
}

function* addToHistory({ payload }) {
	const { sessionId } = payload
	const workspace = yield select(getSelectedWorkspace)
	const session = workspace.getIn(['sessions', sessionId])

	const history: HistoryState = workspace.get('history')

	const exists = history.toKeyedSeq().find(item => is(item, session))
	if (!exists) {
		yield put(addHistoryItem(session))
	}
}

function* prettifyQuery() {
	const { query } = yield select(getSelectedSession)
	const settings = yield select(getSettings)
	try {
		const prettyQuery = prettify(query, {
			printWidth: settings['prettier.printWidth'],
			tabWidth: settings['prettier.tabWidth'],
			useTabs: settings['prettier.useTabs'],
		})
		yield put(editQuery(prettyQuery))
	} catch (e) {
		// TODO show errors somewhere
		// tslint:disable-next-line
		console.log(e)
	}
}

export const sessionsSagas = [
	takeLatest('GET_QUERY_FACTS', safely(setQueryFacts)),
	takeLatest('SET_OPERATION_NAME', safely(setQueryFacts)),
	takeEvery('EDIT_QUERY', safely(setQueryFacts)),
	takeEvery('EDIT_QUERY', safely(reflectQueryToUrl)),
	takeEvery('RUN_QUERY_AT_POSITION', safely(runQueryAtPosition)),
	takeLatest('FETCH_SCHEMA', safely(fetchSchemaSaga)),
	takeLatest('REFETCH_SCHEMA', safely(refetchSchemaSaga)),
	takeLatest('SCHEMA_FETCHING_SUCCESS', safely(renewStacks)),
	takeEvery('QUERY_SUCCESS' as any, safely(addToHistory)),
	takeLatest('PRETTIFY_QUERY', safely(prettifyQuery)),
]

// needed to fix typescript
export { ForkEffect }
