/* eslint import/namespace: ['error', { allowComputed: true }] */
import { __ } from '@wordpress/i18n';
import * as icons from '@wordpress/icons';
import { Card, Grid } from '../../../components/src';

const Icon = icons.Icon;

const { newspack_dashboard: newspackData } = window;

export default [
	{
		label: __( 'Main', 'newspack' ),
		path: '/',
		render: () => {
			return (
				<>
					{ Object.keys( newspackData ).map( sectionKey => {
						return (
							<div key={ sectionKey }>
								<h3>{ newspackData[ sectionKey ].title }</h3>
								<p>{ newspackData[ sectionKey ].desc }</p>
								<Grid columns={ 3 } key={ `${ sectionKey }-grid` }>
									{ newspackData[ sectionKey ].cards.map( ( sectionCard, i ) => {
										return (
											<Card key={ `${ sectionKey }-card-${ i }` }>
												<h4>{ sectionCard.title }</h4>
												<p>{ sectionCard.desc }</p>
												<Icon icon={ icons[ sectionCard.icon ] ?? icons.helpFilled } />
											</Card>
										);
									} ) }
								</Grid>
							</div>
						);
					} ) }
				</>
			);
		},
	},
];
