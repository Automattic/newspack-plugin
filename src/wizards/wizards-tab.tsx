/**
 * Wizards Tab component.
 */

function WizardsTab( {
	title,
	children,
	isFetching,
	description,
	...props
}: {
	title: string;
	children: React.ReactNode;
	isFetching?: boolean;
	className?: string;
	description?: React.ReactNode;
} ) {
	const className = props.className || '';
	return (
		<div
			className={ `${
				isFetching ? 'is-fetching ' : ''
			}${ className } newspack-wizard__sections` }
		>
			<h1>{ title }</h1>
			{ description && <p>{ description }</p> }
			{ children }
		</div>
	);
}

export default WizardsTab;
