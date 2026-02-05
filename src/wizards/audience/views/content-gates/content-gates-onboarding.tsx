/**
 * Content Gates Onboarding component.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis

/**
 * Internal dependencies
 */
import { Card, SectionHeader } from '../../../../../packages/components/src';
import { content, settings, wallPay } from '../../../../../packages/icons';

const ContentGatesOnboarding = () => {
	return (
		<>
			<VStack style={ { margin: 'auto', gap: 0, maxWidth: '500px' } }>
				<SectionHeader
					icon={ wallPay }
					title={ __( 'Get started with access control', 'newspack-plugin' ) }
					description={ __(
						'Set up gates to manage what content readers can access across your site. Start by selecting which content to restrict, then configure access through registered and/or paid options (including metered rules).',
						'newspack-plugin'
					) }
					pageHeader
				/>
				<Card
					chevron
					isSmall
					__experimentalCoreCard
					__experimentalCoreProps={ {
						as: 'a',
						header: (
							<>
								<h3>{ __( 'Restrict all posts', 'newspack-plugin' ) }</h3>
								<p>{ __( 'All posts on your site will require access.', 'newspack-plugin' ) }</p>
							</>
						),
						href: '#',
						icon: content,
						iconBackgroundColor: true,
					} }
				/>
				<Card
					chevron
					isSmall
					__experimentalCoreCard
					__experimentalCoreProps={ {
						as: 'a',
						header: (
							<>
								<h3>{ __( 'Choose specific content', 'newspack-plugin' ) }</h3>
								<p>{ __( 'Select which content to restrict using custom rules.', 'newspack-plugin' ) }</p>
							</>
						),
						href: '#',
						icon: settings,
						iconBackgroundColor: true,
					} }
				/>
			</VStack>
		</>
	);
};

export default ContentGatesOnboarding;
