/**
 * Wizards Tab component.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

function WizardsTab( { title, children }: { title: string; children: React.ReactNode } ) {
	return (
		<div className="newspack-wizard__sections">
			<h1>{ title }</h1>
			{ children }
		</div>
	);
}

export default WizardsTab;
