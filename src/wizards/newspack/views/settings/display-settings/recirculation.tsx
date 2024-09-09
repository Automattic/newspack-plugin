import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

import WizardsActionCard from '../../../../wizards-action-card';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import { Card, Grid, hooks, TextControl } from '../../../../../components/src';

export default function Recirculation( {
	update,
	data,
}: {
	data: RecirculationData;
	update: ( a: Partial< {} > ) => void;
} ) {
	return (
		<>
			<pre>{ JSON.stringify( settings, null, 2 ) }</pre>
			<WizardsActionCard
				title={ __( 'Related Posts', 'newspack-plugin' ) }
				badge="Jetpack"
				description={
					<>
						{ __(
							'Automatically add related content at the bottom of each post.',
							'newspack-plugin'
						) }
					</>
				}
				editLink="admin.php?page=jetpack#/traffic"
			/>

			{ settings.relatedPostsEnabled && (
				<Grid>
					<Card noBorder>
						<TextControl
							help={ __(
								'If set, posts will be shown as related content only if published within the past number of months. If 0, any published post can be shown, regardless of publish date.',
								'newspack-plugin'
							) }
							label={ __(
								'Maximum age of related content, in months',
								'newspack-plugin'
							) }
							onChange={ ( relatedPostsMaxAge: number ) =>
								update( { relatedPostsMaxAge } )
							}
							placeholder={ __(
								'Maximum age of related content, in months',
								'newspack-plugin'
							) }
							type="number"
							value={ settings.relatedPostsMaxAge || 0 }
						/>
					</Card>
				</Grid>
			) }
		</>
	);
}
