const makeGeneralSelector = key => state => {
	return state.general.get(key)
}

export const getFixedEndpoint = makeGeneralSelector('fixedEndpoint')
export const getConfigString = makeGeneralSelector('configString')
