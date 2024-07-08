/**
 * Wizards Tab component.
 */

function WizardsTab( { title, children }: { title: string; children: React.ReactNode } ) {
	return (
		<div className="newspack-wizard__sections">
			<h1>{ title }</h1>
			{ children }
		</div>
	);
}

export default WizardsTab;
