/**
 * Content Gate settings card component.
 * Used for additional global settings.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { DropdownMenu, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button, Card, Router } from '../../../../../packages/components/src';

const { useHistory } = Router;

/**
 * External dependencies
 */
import classNames from 'classnames';

type SettingsCardProps = {
	title: string;
	description?: string;
	enabled?: boolean;
	href?: string;
	requirements?: string;
	toggleEnabled?: () => void;
};

const SettingsCard = ( { title, description, enabled, requirements, toggleEnabled = () => {}, href = '' }: SettingsCardProps ) => {
	const history = useHistory();
	const classes = classNames( 'newspack-content-gates__settings-card', {
		'newspack-content-gates__settings-card--enabled': enabled && ! requirements,
		'newspack-content-gates__settings-card--disabled': ! enabled || !! requirements,
	} );
	const status = enabled ? __( 'Enabled', 'newspack-plugin' ) : __( 'Disabled', 'newspack-plugin' );
	const handleClick = () => {
		if ( ! enabled ) {
			toggleEnabled();
		} else {
			history.push( href );
		}
	};
	return (
		<Card
			className={ classes }
			__experimentalCoreCard
			__experimentalCoreProps={ {
				headerStyle: { padding: 32 },
				header: (
					<>
						<h2>{ title }</h2>
						{ description && <p className="newspack-content-gates__settings-card__description">{ description }</p> }
						<HStack alignment="edge">
							<HStack expanded={ false } justify="flex-start" spacing="8px" className="newspack-content-gates__settings-card__buttons">
								<Button variant="secondary" disabled={ !! requirements } onClick={ handleClick }>
									{ ! enabled || requirements ? __( 'Enable', 'newspack-plugin' ) : __( 'Configure', 'newspack-plugin' ) }
								</Button>
								{ enabled && ! requirements && (
									<DropdownMenu
										icon={ moreVertical }
										label={ __( 'More', 'newspack-plugin' ) }
										controls={ [
											{
												title: __( 'Disable', 'newspack-plugin' ),
												onClick: toggleEnabled,
											},
										] }
									/>
								) }
							</HStack>
							<p className="newspack-content-gates__settings-card__status">{ requirements || status }</p>
						</HStack>
					</>
				),
			} }
		/>
	);
};

export default SettingsCard;
