/**
 * Wizards Tab component.
 */

function WizardsTab( {
	title,
	children,
	...props
}: {
	title: string;
	children: React.ReactNode;
	className?: string;
} ) {
	const className = props.className || '';
	return (
		<div className={ `${ className } newspack-wizard__sections` }>
			<h1>{ title }</h1>
			{ children }
		</div>
	);
}

export default WizardsTab;
