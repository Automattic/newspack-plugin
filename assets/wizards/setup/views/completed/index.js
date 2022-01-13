/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
	ActionCard,
	Button,
	Card,
	Grid,
	SectionHeader,
} from '../../../../components/src';

const Completed = () => {
	useEffect( () => {
		document.body.classList.add( 'newspack-wizard__blue' );
		document.querySelector( '.newspack-wizard__header' ).remove();
	}, [] );

	const cardClasses = classnames( 'flex', 'flex-column', 'justify-between' );
	const buttonClasses = classnames( 'flex', 'flex-row-reverse' );

	return (
		<>
			<Card noBorder>
				<SectionHeader
					title={ __( 'You’re ready to go!', 'newspack' ) }
					description={ __(
						'While youre off to a great start, there’s plenty more you can do:',
						'newspack'
					) }
					heading={ 1 }
					centered
					isWhite
				/>
			</Card>

			<Card isWhite>
				<Grid>
					<ActionCard
						title={ __( 'Configure Newspack', 'newspack' ) }
						description={ __(
							'Go in-depth with our various options to set up Newspack to meet your needs.',
							'newspack'
						) }
						className={ cardClasses }
					>
						<div className={ buttonClasses }>
							<Button isPrimary isSmall href={ newspack_urls.dashboard }>
								{ __( 'Go to Dashboard', 'newspack' ) }
							</Button>
						</div>
					</ActionCard>

					<ActionCard
						title={ __( 'Explore our documentation', 'newspack' ) }
						description={ __(
							'Read about the different tools, plugins, and themes that make up Newspack.',
							'newspack'
						) }
						className={ cardClasses }
					>
						<div className={ buttonClasses }>
							<Button isPrimary isSmall href={ newspack_urls.support }>
								{ __( 'Read Documentation', 'newspack' ) }
							</Button>
						</div>
					</ActionCard>

					<ActionCard
						title={ __( 'Update your homepage', 'newspack' ) }
						description={ __(
							'We’ve created the basics, now it’s time to update the content.',
							'newspack'
						) }
						className={ cardClasses }
					>
						<div className={ buttonClasses }>
							<Button isPrimary isSmall href={ newspack_urls.homepage }>
								{ __( 'Edit Homepage', 'newspack' ) }
							</Button>
						</div>
					</ActionCard>

					<ActionCard
						title={ __( 'View your site', 'newspack' ) }
						description={ __( 'Preview what you’ve created so far. It looks great!', 'newspack' ) }
						className={ cardClasses }
					>
						<div className={ buttonClasses }>
							<Button isPrimary isSmall href={ newspack_urls.site }>
								{ __( 'Visit Site', 'newspack' ) }
							</Button>
						</div>
					</ActionCard>
				</Grid>
			</Card>
		</>
	);
};

export default withWizardScreen( Completed, { hidePrimaryButton: true } );
