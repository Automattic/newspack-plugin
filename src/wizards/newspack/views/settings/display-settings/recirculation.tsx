import { __ } from '@wordpress/i18n';

import WizardsActionCard from '../../../../wizards-action-card';
import { Button, Card, Grid, TextControl } from '../../../../../components/src';

export default function Recirculation( {
	update,
	data,
}: ThemeModComponentProps< DisplaySettings > ) {
	return (
		<>
			<WizardsActionCard
				title={ __( 'Related Posts', 'newspack-plugin' ) }
				badge="Jetpack"
				description={ () => (
					<>
						{ __(
							'Automatically add related content at the bottom of each post.',
							'newspack-plugin'
						) }
					</>
				) }
				editLink="admin.php?page=jetpack#/traffic"
				actionText={
					<Button
						variant="link"
						href="admin.php?page=jetpack#/traffic"
					>
						{ __( 'Configure', 'newspack-plugin' ) }
					</Button>
				}
			/>

			{ data.relatedPostsEnabled && (
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
							value={ data.relatedPostsMaxAge || 0 }
						/>
					</Card>
				</Grid>
			) }
		</>
	);
}
