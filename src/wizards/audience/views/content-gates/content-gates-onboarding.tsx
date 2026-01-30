/**
 * Content Gates Onboarding component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ButtonCard, SectionHeader } from '../../../../../packages/components/src';
import { content, settings, wallPay } from '../../../../../packages/icons';

const ContentGatesOnboarding = () => {
	return (
		<>
			<SectionHeader
				icon={ wallPay }
				title={ __( 'Get started with access control', 'newspack-plugin' ) }
				description={ __(
					'Set up gates to manage what content readers can access across your site. Start by selecting which content to restrict, then configure access through registered and/or paid options (including metered rules).',
					'newspack-plugin'
				) }
				pageHeader
			>
				<ButtonCard
					href="#"
					title={ __( 'Restrict all posts', 'newspack-plugin' ) }
					desc={ __( 'All posts on your site will require access.', 'newspack-plugin' ) }
					borderRadius="large"
					icon={ content }
					iconBackgroundColor
					chevron
					isSmall
				/>
				<ButtonCard
					href="#"
					title={ __( 'Choose specific content', 'newspack-plugin' ) }
					desc={ __( 'Select which content to restrict using custom rules.', 'newspack-plugin' ) }
					borderRadius="large"
					icon={ settings }
					iconBackgroundColor
					chevron
					isSmall
				/>
			</SectionHeader>
		</>
	);
};

export default ContentGatesOnboarding;
