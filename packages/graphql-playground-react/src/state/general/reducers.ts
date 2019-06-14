import { Record } from 'immutable'
import { handleActions } from 'redux-actions'

export class GeneralState extends Record({
	fixedEndpoint: false,
	endpoint: '',
	configString: '',
	envVars: {},
}) {}

export default handleActions<GeneralState, any>(
	{
		SET_CONFIG_STRING: (state, { payload: { configString } }) => state.set('configString', configString),
	},
	new GeneralState(),
)
