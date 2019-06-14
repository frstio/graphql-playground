import { astFromValue, GraphQLList, GraphQLNonNull, print } from 'graphql'
import * as React from 'react'
import { styled } from '../../../styled'

export interface Props {
	arg: any
	showDefaultValue?: boolean
}

export default function Argument({ arg, showDefaultValue }: Props) {
	const astNode = astFromValue(arg.defaultValue, arg.type)
	const strAstNode =
		arg.defaultValue !== undefined && showDefaultValue !== false && astNode
			? print(astNode)
			: ''

	return (
		<ArgumentLine>
			<span className="arg-name">{arg.name}</span>
			{': '}
			<span className="type-name">{renderType(arg.type)}</span>
			{strAstNode}
		</ArgumentLine>
	)
}

function renderType(type) {
	if (type instanceof GraphQLNonNull) {
		return (
			<span>
				{renderType(type.ofType)}
				{'!'}
			</span>
		)
	}
	if (type instanceof GraphQLList) {
		return (
			<span>
				{'['}
				{renderType(type.ofType)}
				{']'}
			</span>
		)
	}
	return <span>{type.name}</span>
}

const ArgumentLine = styled.div`
	margin-left: 16px;
`
