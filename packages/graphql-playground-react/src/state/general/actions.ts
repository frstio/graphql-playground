import { createActions } from 'redux-actions'

export const {
	setSettingsString,
	setConfigString,
	closeHistory,
} = createActions({
	SET_SETTINGS_STRING: settingsString => ({ settingsString }),
	SET_CONFIG_STRING: configString => ({ configString }),
})
