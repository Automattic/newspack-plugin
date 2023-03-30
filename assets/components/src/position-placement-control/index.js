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

const PositionPlacementControl = ( { value, label, help, onChange, size, ...props } ) => {
	/**
	 * Set layout options
	 */
	const options =
		size === 'full-width'
			? [
					{
						value: 'top',
						/* translators: Overlay Prompt Position */
						label: __( 'Top', 'newspack-popups' ),
					},
					{
						value: 'center',
						/* translators: Overlay Prompt Position */
						label: __( 'Center', 'newspack-popups' ),
					},
					{
						value: 'bottom',
						/* translators: Overlay Prompt Position */
						label: __( 'Bottom', 'newspack-popups' ),
					},
			  ]
			: [
					{
						value: 'top_left',
						/* translators: Overlay Prompt Position */
						label: __( 'Top Left', 'newspack-popups' ),
					},
					{
						value: 'top',
						/* translators: Overlay Prompt Position */
						label: __( 'Top Center', 'newspack-popups' ),
					},
					{
						value: 'top_right',
						/* translators: Overlay Prompt Position */
						label: __( 'Top Right', 'newspack-popups' ),
					},
					{
						value: 'center_left',
						/* translators: Overlay Prompt Position */
						label: __( 'Center Left', 'newspack-popups' ),
					},
					{
						value: 'center',
						/* translators: Overlay Prompt Position */
						label: __( 'Center', 'newspack-popups' ),
					},
					{
						value: 'center_right',
						/* translators: Overlay Prompt Position */
						label: __( 'Center Right', 'newspack-popups' ),
					},
					{
						value: 'bottom_left',
						/* translators: Overlay Prompt Position */
						label: __( 'Bottom Left', 'newspack-popups' ),
					},
					{
						value: 'bottom',
						/* translators: Overlay Prompt Position */
						label: __( 'Bottom Center', 'newspack-popups' ),
					},
					{
						value: 'bottom_right',
						/* translators: Overlay Prompt Position */
						label: __( 'Bottom Right', 'newspack-popups' ),
					},
			  ];
	return (
		<div className={ classnames( 'newspack-position-placement-control', 'size-' + size ) }>
			<p className="components-base-control__label">{ label }</p>
			<ButtonGroup aria-label={ __( 'Select Position', 'newspack-popups' ) } { ...props }>
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
								disabled={
									props.allowedPlacements?.length &&
									! props.allowedPlacements.includes( option.value )
								}
							/>
						</div>
					);
				} ) }
			</ButtonGroup>
			<p className="components-base-control__help">{ help }</p>
		</div>
	);
};

export default PositionPlacementControl;
