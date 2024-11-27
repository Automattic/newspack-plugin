/**
 * Wizards Card component.
 */

/**
 * Internal dependencies.
 */
import { Card } from '../components/src';

/**
 * Wizards Card component.
 *
 * @param props          Component props.
 * @param props.children Component children.
 *
 * @return Component.
 */
function WizardsCard( {
	children,
	...props
}: {
	children: React.ReactNode;
	className?: string;
} ) {
	return <Card { ...props }>{ children }</Card>;
}

export default WizardsCard;
