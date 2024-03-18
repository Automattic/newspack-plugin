/**
 * Newspack - Dashboard, Sections
 *
 * Component for outputting sections with grid and cards
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
/* eslint import/namespace: ['error', { allowComputed: true }] */
import * as icons from '@wordpress/icons';
import { Grid, Card } from '../../../components/src';

const Icon = icons.Icon;

const {
	newspack_dashboard: { sections: dashSections },
} = window;

export default [
	{
		label: __( 'Dashboard', 'newspack' ),
		path: '/',
		render: () => {
			const dashSectionsKeys = Object.keys( dashSections );
			return dashSectionsKeys.map( sectionKey => {
				return (
					<Fragment key={ sectionKey }>
						<hr />
						<div className="newspack-dashboard__section">
							<h3>{ dashSections[ sectionKey ].title }</h3>
							<p>{ dashSections[ sectionKey ].desc }</p>
							<Grid gutter="24" columns="3" key={ `${ sectionKey }-grid` }>
								{ dashSections[ sectionKey ].cards.map( ( sectionCard, i ) => {
									return (
										<a href={ sectionCard.href } key={ `${ sectionKey }-card-${ i }` }>
											<Card className="newspack-dashboard__card">
												<div className="newspack-dashboard__card-icon">
													<Icon size="32" icon={ icons[ sectionCard.icon ] ?? icons.help } />
												</div>
												<h4>{ sectionCard.title }</h4>
												<p>{ sectionCard.desc }</p>
											</Card>
										</a>
									);
								} ) }
							</Grid>
						</div>
					</Fragment>
				);
			} );
		},
	},
];
