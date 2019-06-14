import { Operation } from 'apollo-link'
import { parse } from 'graphql'
import { setIn } from 'immutable'

export interface GraphQLRequestData {
	query: string
	variables?: any
	operationName?: string
	extensions?: any
}

export function makeOperation(request: GraphQLRequestData): Operation {
	return setIn(request, ['query'], parse(request.query)) as any
}
