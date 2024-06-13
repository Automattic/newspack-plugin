/**
 * Wizards Sectional Component
 *
 * Component for wrapping wizard field groups
 */

import { SectionHeader } from '../components/src';

function WizardsSection( {
	title,
	description,
	children = null,
}: {
	title?: string;
	description?: string;
	children: React.ReactNode;
} ) {
	return (
		<div className="newspack-wizard__section">
			{ title && <SectionHeader heading={ 3 } title={ title } description={ description } /> }
			{ children }
		</div>
	);
}

export default WizardsSection;
