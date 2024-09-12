/**
 * Wizards Tab component.
 */

function WizardsTab( {
	title,
	children,
	isFetching,
	...props
}: {
	title: string;
	children: React.ReactNode;
	isFetching?: boolean;
	className?: string;
} ) {
	const className = props.className || '';
	return (
		<div
			className={ `${
				isFetching ? '' : 'is-fetching'
			} ${ className } newspack-wizard__sections` }
		>
			<h1>{ title }</h1>
			{ children }
		</div>
	);
}

export default WizardsTab;
