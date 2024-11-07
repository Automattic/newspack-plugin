/**
 * Wizards Section component.
 */

/**
 * Internal dependencies.
 */
import { SectionHeader } from '../components/src';

/**
 * Section component.
 *
 * @param props                Component props.
 * @param props.title          Section title.
 * @param props.description    Section description.
 * @param props.children       Section children.
 * @param props.scrollToAnchor Scroll to anchor.
 *
 * @return Component.
 */
export default function WizardSection( {
	title,
	description,
	children = null,
	scrollToAnchor = null,
}: {
	title?: string;
	description?: string;
	children: React.ReactNode;
	scrollToAnchor?: string | null;
} ) {
	return (
		<div className="newspack-wizard__section">
			{ title && (
				<SectionHeader
					id={ scrollToAnchor }
					heading={ 3 }
					title={ title }
					description={ description }
				/>
			) }
			{ children }
		</div>
	);
}
