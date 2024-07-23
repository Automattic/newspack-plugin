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
 * @param props Component props.
 * @param props.title Section title.
 * @param props.description Section description.
 * @param props.children Section children.
 *
 * @return Component.
 */
export default function WizardSection( {
	title,
	description,
	children = null,
	heading = 3,
	className = '',
	titleClassName = '',
}: {
	title?: string;
	description?: string;
	children: React.ReactNode;
	heading?: number;
	className?: string;
	titleClassName?: string;
} ) {
	return (
		<div className={ `${ className } newspack-wizard__section` }>
			{ title && (
				<SectionHeader { ...{ title, description, heading } } className={ titleClassName } />
			) }
			{ children }
		</div>
	);
}
