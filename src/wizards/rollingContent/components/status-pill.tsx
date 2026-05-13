/**
 * Rolling Content demo — shared status indicator.
 *
 * Renders a small icon + label for an item's status. Each caller passes its
 * own labels and icons keyed by its status union.
 */

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

export default function StatusPill< S extends string >( {
	status,
	labels,
	icons,
}: {
	status: S;
	labels: Record< S, string >;
	icons: Record< S, JSX.Element >;
} ) {
	return (
		<span style={ { display: 'inline-flex', alignItems: 'center', gap: 4 } }>
			<Icon icon={ icons[ status ] } size={ 18 } />
			<span>{ labels[ status ] }</span>
		</span>
	);
}
