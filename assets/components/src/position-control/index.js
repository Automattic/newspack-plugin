/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ButtonGroup, Button } from '@wordpress/components';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

export default function PositionControl( {
	allowedPositions,
	value,
	label,
	help,
	onChange,
	size,
	...props
} ) {
	/**
	 * Set layout options
	 */
	const options =
		size === 'full-width'
			? [
					{
						value: 'top',
						/* translators: Overlay Position */
						label: __( 'Top', 'newspack' ),
					},
					{
						value: 'center',
						/* translators: Overlay Position */
						label: __( 'Center', 'newspack' ),
					},
					{
						value: 'bottom',
						/* translators: Overlay Position */
						label: __( 'Bottom', 'newspack' ),
					},
			  ]
			: [
					{
						value: 'top_left',
						/* translators: Overlay Position */
						label: __( 'Top Left', 'newspack' ),
					},
					{
						value: 'top',
						/* translators: Overlay Position */
						label: __( 'Top Center', 'newspack' ),
					},
					{
						value: 'top_right',
						/* translators: Overlay Position */
						label: __( 'Top Right', 'newspack' ),
					},
					{
						value: 'center_left',
						/* translators: Overlay Position */
						label: __( 'Center Left', 'newspack' ),
					},
					{
						value: 'center',
						/* translators: Overlay Position */
						label: __( 'Center', 'newspack' ),
					},
					{
						value: 'center_right',
						/* translators: Overlay Position */
						label: __( 'Center Right', 'newspack' ),
					},
					{
						value: 'bottom_left',
						/* translators: Overlay Position */
						label: __( 'Bottom Left', 'newspack' ),
					},
					{
						value: 'bottom',
						/* translators: Overlay Position */
						label: __( 'Bottom Center', 'newspack' ),
					},
					{
						value: 'bottom_right',
						/* translators: Overlay Position */
						label: __( 'Bottom Right', 'newspack' ),
					},
			  ];
	return (
		<div className={ classnames( 'newspack-position-placement-control', 'size-' + size ) }>
			<p className="components-base-control__label">{ label }</p>
			<ButtonGroup aria-label={ __( 'Select Position', 'newspack' ) } { ...props }>
				{ options.map( ( option, index ) => {
					return (
						<div
							key={ `newspack-position-placement-item-${ index }` }
							className={ option.value === value ? 'is-selected' : null }
						>
							<Button
								isSmall
								title={ option.label }
								aria-label={ option.label }
								isPrimary={ option.value === value }
								onClick={ () => {
									onChange( option.value );
								} }
								disabled={ allowedPositions?.length && ! allowedPositions.includes( option.value ) }
							/>
						</div>
					);
				} ) }
			</ButtonGroup>
			<p className="components-base-control__help">{ help }</p>
		</div>
	);
}
