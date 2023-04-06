/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Grid, TextControl } from '../../../../components/src';

/**
 * Expandable ActionCard for RAS prerequisites checklist.
 */
export default function Prerequisite( {
	config,
	getSharedProps,
	inFlight,
	prerequisite,
	saveConfig,
} ) {
	return (
		<ActionCard
			isMedium
			expandable
			collapse={ prerequisite.active }
			title={ prerequisite.label }
			description={ sprintf(
				/* translators: %s: Prerequisite status */
				__( 'Status: %s', 'newspack' ),
				prerequisite.active ? __( 'Ready', 'newspack' ) : __( 'Pending', 'newspack' )
			) }
			checkbox={ prerequisite.active ? 'checked' : 'unchecked' }
		>
			{
				// Inner card content.
				<>
					{ prerequisite.description && (
						<p>
							{ prerequisite.description }
							{ prerequisite.help_url && (
								<>
									{ ' ' }
									<ExternalLink href={ prerequisite.help_url }>
										{ __( 'Learn more', 'newspack-plugin' ) }
									</ExternalLink>
								</>
							) }
						</p>
					) }
					{
						// Form fields.
						prerequisite.fields && (
							<Grid columns={ 2 } gutter={ 16 }>
								<div>
									{ Object.keys( prerequisite.fields ).map( fieldName => (
										<TextControl
											key={ fieldName }
											label={ prerequisite.fields[ fieldName ].label }
											help={ prerequisite.fields[ fieldName ].description }
											{ ...getSharedProps( fieldName, 'text' ) }
										/>
									) ) }

									<Button
										isPrimary
										onClick={ () => {
											const dataToSave = {};

											Object.keys( prerequisite.fields ).forEach( fieldName => {
												dataToSave[ fieldName ] = config[ fieldName ];
											} );

											saveConfig( dataToSave );
										} }
										disabled={ inFlight }
									>
										{ inFlight
											? __( 'Saving…', 'newspack' )
											: sprintf(
													// Translators: Save or Update settings.
													__( '%s settings', 'newspack' ),
													prerequisite.active
														? __( 'Update', 'newspack' )
														: __( 'Save', 'newspack' )
											  ) }
									</Button>
								</div>
							</Grid>
						)
					}
					{
						// Link to another settings page or update config in place.
						prerequisite.href && prerequisite.action_text && (
							<Grid columns={ 2 } gutter={ 16 }>
								<div>
									<Button isPrimary href={ prerequisite.href }>
										{ /* eslint-disable no-nested-ternary */ }
										{ ( prerequisite.active
											? __( 'Update ', 'newspack' )
											: prerequisite.fields
											? __( 'Save ', 'newspack' )
											: __( 'Configure ', 'newspack' ) ) + prerequisite.action_text }
									</Button>
								</div>
							</Grid>
						)
					}
				</>
			}
		</ActionCard>
	);
}
