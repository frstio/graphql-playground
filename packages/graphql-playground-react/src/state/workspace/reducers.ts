import { Map, OrderedMap, Record } from 'immutable'
import { Reducer } from 'redux'
import { combineReducers } from 'redux-immutable'
import { createSelector } from 'reselect'
import { immutableMemoize } from '../../components/Playground/util/immutableMemoize'
import appHistory, { AppHistory } from '../appHistory/reducers'
import docs, { DocsSession, DocsSessionState, DocsState } from '../docs/reducers'
import general, { GeneralState } from '../general/reducers'
import history, { HistoryState } from '../history/reducers'
import sessions, {
	makeSessionState,
	Session,
	sessionFromTab,
	SessionState,
	SessionStateProps,
	Tab,
} from '../sessions/reducers'
import sharing, { SharingState } from '../sharing/reducers'
import { deserializePersistedState } from './deserialize'
// import { createSelector } from 'reselect'

import { ISettings } from '../../types'

export function getSelectedWorkspaceId(state) {
	return state.get('selectedWorkspace')
}

export function getSelectedWorkspace(state) {
	return state.getIn(['workspaces', getSelectedWorkspaceId(state)])
}

export class Workspace extends Record({
	docs: Map<string, DocsSessionState>(),
	sessions: makeSessionState(),
	sharing: new SharingState(),
	history: OrderedMap<string, SessionStateProps>(),
}) {}

export const defaultSettings: ISettings = {
	'editor.cursorShape': 'line',
	'editor.fontFamily': `'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace`,
	'editor.fontSize': 14,
	'editor.reuseHeaders': true,
	'editor.theme': 'dark',
	'general.betaUpdates': false,
	'prettier.printWidth': 80,
	'prettier.tabWidth': 2,
	'prettier.useTabs': false,
	'request.credentials': 'omit',
	'schema.disableComments': true,
	'schema.polling.enable': true,
	'schema.polling.endpointFilter': '*localhost*',
	'schema.polling.interval': 2000,
	'tracing.hideTracingResponse': true,
}

// tslint:disable-next-line:max-classes-per-file
export class RootState extends Record({
	workspaces: Map<string, Workspace>([['', makeWorkspace()]]),
	selectedWorkspace: '',
	settingsString: JSON.stringify(defaultSettings, null, 2),
	stateInjected: false,
	appHistory: new AppHistory(),
	general: new GeneralState(),
}) {}

const workspaceReducers: Reducer<any> = combineReducers({
	docs,
	sessions,
	sharing,
	history,
	general,
	appHistory,
})

// todo: add lru-cache later when the localStorage is full
export const rootReducer = (state = new RootState(), action) => {
	if (action.type === 'SELECT_WORKSPACE') {
		return state.set('selectedWorkspace', action.payload.workspace)
	}

	if (action.type === 'SET_SETTINGS_STRING') {
		return state.set('settingsString', action.payload.settingsString)
	}

	if (action.type === 'INIT_STATE' && !state.stateInjected) {
		const { workspaceId } = action.payload
		if (!state.workspaces.get(workspaceId)) {
			const newState = state.setIn(['workspaces', workspaceId], makeWorkspace())
			return newState.set('selectedWorkspace', workspaceId)
		}
		return state.set('selectedWorkspace', workspaceId)
	}

	if (action.type === 'INJECT_STATE') {
		return deserializePersistedState(action.payload.state).set('stateInjected', true)
	}

	if (action.type === 'INJECT_TABS') {
		return makeStateFromTabs(action.payload.tabs)
	}

	if (action.type === 'SELECT_APP_HISTORY_ITEM') {
		return state.set('appHistory', appHistory(state.appHistory, action))
	}

	const generalActions = {
		OPEN_HISTORY: true,
		CLOSE_HISTORY: true,
		SET_ENDPOINT_DISABLED: true,
		SET_CONFIG_STRING: true,
	}

	if (generalActions[action.type]) {
		return state.set('general', general(state.general, action))
	}

	const selectedWorkspaceId =
		action.payload && action.payload.workspaceId ? action.payload.workspaceId : getSelectedWorkspaceId(state)

	const path = ['workspaces', selectedWorkspaceId]

	return state.setIn(path, workspaceReducers(state.getIn(path), action))
}

function makeStateFromTabs(tabs: Tab[]): RootState {
	const tabSessions = OrderedMap(
		tabs.map(sessionFromTab).reduce(
			(acc, curr) => {
				return { ...acc, [curr.id]: curr }
			},
			{} as OrderedMap<string, Session>,
		),
	)
	const selectedSessionId = tabSessions.first<Session>()!.id
	const workspace = makeWorkspace()
		.setIn(['sessions', 'sessions'], tabSessions)
		.setIn(['sessions', 'selectedSessionId'], selectedSessionId)
	return new RootState().setIn(['workspaces', ''], workspace).set('selectedWorkspace', '')
}

export function makeWorkspace() {
	const sessionState = makeSessionState()

	// weird typescript error
	return new Workspace({
		docs: Map({
			[sessionState.selectedSessionId]: new DocsSession(),
		}),
		sessions: sessionState,
		sharing: new SharingState(),
		history: OrderedMap(),
	})
}

export default rootReducer

export const getSessionCounts = immutableMemoize(state => {
	return state.workspaces.map(w => w.sessions.sessionCount)
})

export const getSettingsString = state => state.settingsString
export const getSettings = createSelector(
	[getSettingsString],
	parseSettingsString,
)

function normalizeSettings(settings) {
	const theme = settings['editor.theme']
	if (theme !== 'dark' && theme !== 'light') {
		settings['editor.theme'] = 'dark'
	}

	return {
		...defaultSettings,
		...settings,
	}
}

function parseSettingsString(settingsString) {
	try {
		return normalizeSettings(JSON.parse(settingsString))
	} catch (e) {
		return defaultSettings
	}
}

export function normalizeSettingsString(settingsString) {
	return JSON.stringify(parseSettingsString(settingsString), null, 2)
}

export const getTheme = (state, customSettings) => {
	const settings = customSettings || getSettings(state)
	return settings['editor.theme'] || 'dark'
}
