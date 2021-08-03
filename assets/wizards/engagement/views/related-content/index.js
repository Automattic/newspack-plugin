/**
 * Related content screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Card,
	Grid,
	Notice,
	TextControl,
	withWizardScreen,
} from '../../../../components/src';

/**
 * Related Content Screen
 */
class RelatedContent extends Component {
	/**
	 * Render.
	 */
	render() {
		const { onChange, relatedPostsEnabled, relatedPostsError, relatedPostsMaxAge } = this.props;

		return (
			<>
				{ relatedPostsError && <Notice noticeText={ relatedPostsError } isError /> }

				<ActionCard
					title={ __( 'Jetpack Related Posts', 'newspack' ) }
					description={ __(
						'Keep your visitors engaged with related content at the bottom of each post.',
						'newspack'
					) }
					actionText={ __( 'Configure' ) }
					handoff="jetpack"
					editLink="admin.php?page=jetpack#/traffic"
				/>

				{ relatedPostsEnabled && (
					<Grid>
						<Card isMedium>
							<TextControl
								help={ __(
									'If set, posts will be shown as related content only if published within the past number of months. If 0, any published post can be shown, regardless of publish date.',
									'newspack'
								) }
								label={ __( 'Maximum age of related content, in months', 'newspack' ) }
								onChange={ value => onChange( value ) }
								placeholder={ __( 'Maximum age of related content, in months' ) }
								type="number"
								value={ relatedPostsMaxAge || 0 }
								isWide
							/>
						</Card>
					</Grid>
				) }
			</>
		);
	}
}

export default withWizardScreen( RelatedContent );
