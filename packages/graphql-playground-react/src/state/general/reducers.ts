import { Record } from 'immutable'
import { handleActions } from 'redux-actions'

export class GeneralState extends Record({
	fixedEndpoint: false,
	endpoint: '',
	configString: '',
	envVars: {},
}) {
	fixedEndpoint: boolean
	endpoint: string
	configString: string
	envVars: any
}

export default handleActions(
	{
		SET_ENDPOINT_DISABLED: (state, { payload: { value } }) =>
			state.set('endpointDisabled', value),
		SET_CONFIG_STRING: (state, { payload: { configString } }) =>
			state.set('configString', configString),
	},
	new GeneralState(),
)
