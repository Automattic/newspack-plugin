/**
 * Newspack > Settings > Advanced Settings > Accessibility Statement
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
import { Button, Card, Notice, SectionHeader } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

interface AccessibilityStatementProps {
	data: {
		accessibility_statement_page?: {
			editUrl: string;
			status: string;
			pageUrl: string;
		};
	};
	isFetching: boolean;
}

export default function AccessibilityStatement( { data, isFetching }: AccessibilityStatementProps ) {
	const { wizardApiFetch } = useWizardApiFetch( 'newspack-settings/display-settings/accessibility-statement' );
	const [ localIsFetching, setLocalIsFetching ] = useState( false );
	const [ localPageData, setLocalPageData ] = useState<AccessibilityStatementProps['data']['accessibility_statement_page'] | null>( null );

	// Function to fetch fresh data
	const fetchFreshData = () => {
		setLocalIsFetching( true );
		wizardApiFetch(
			{
				path: '/newspack/v1/wizard/newspack-settings/accessibility-statement',
				method: 'GET',
			},
			{
				onSuccess: ( response ) => {
					// Only update if we got a valid response
					if ( response && response.editUrl && response.status ) {
						setLocalPageData( response );
					} else {
						// If no valid response, clear the local data
						setLocalPageData( null );
					}
					setLocalIsFetching( false );
				},
				onError: () => {
					setLocalPageData( null );
					setLocalIsFetching( false );
				},
			}
		);
	};

	// Fetch on mount and when data changes
	useEffect( () => {
		if (data?.accessibility_statement_page) {
			setLocalPageData(data.accessibility_statement_page);
		}
		fetchFreshData();
	}, [data?.accessibility_statement_page] ); // Only depend on the accessibility statement page data

	const createPage = () => {
		setLocalIsFetching( true );
		wizardApiFetch(
			{
				path: '/newspack/v1/wizard/newspack-settings/accessibility-statement',
				method: 'POST',
			},
			{
				onSuccess: ( response ) => {
					if ( response && response.editUrl && response.status ) {
						setLocalPageData( response );
					} else {
						setLocalPageData( null );
					}
					fetchFreshData();
				},
				onError: () => {
					setLocalPageData( null );
					setLocalIsFetching( false );
				},
			}
		);
	};

	const getStatusMessage = () => {
		if ( ! localPageData ) {
			return {
				type: 'warning',
				message: __( 'Your accessibility statement has not been created yet.', 'newspack-plugin' ),
			};
		}

		switch ( localPageData.status ) {
			case 'publish':
				return {
					type: 'success',
					message: __( 'Your accessibility statement page is published.', 'newspack-plugin' ),
				};
			case 'draft':
			case 'pending':
				return {
					type: 'warning',
					message: __( 'Your accessibility statement page is not yet published. Please review and make edits before publishing.', 'newspack-plugin' ),
				};
			case 'trash':
			default:
				return {
					type: 'warning',
					message: __( 'Your accessibility statement page has not been created yet.', 'newspack-plugin' ),
				};
		}
	};

	const statusInfo = getStatusMessage();

	return (
		<>
			<Card noBorder headerActions>
				<SectionHeader
					title={ __( 'Accessibility Statement Page', 'newspack-plugin' ) }
					noMargin
					description={ __(
						'Create an accessibility statement page. Once published, a link to this page will display in the footer of your site.',
						'newspack-plugin'
					) }
				/>
				{ localPageData && localPageData.status !== 'trash' ? (
					<Button
						variant="secondary"
						isSmall
						href={ localPageData.editUrl }
					>
						{ __( 'Edit Page', 'newspack-plugin' ) }
					</Button>
				) : (
					<Button
						variant="secondary"
						isSmall
						onClick={ createPage }
						disabled={ isFetching || localIsFetching }
					>
						{ __( 'Create Page', 'newspack-plugin' ) }
					</Button>
				) }
			</Card>

			<Notice
				isSuccess={ statusInfo.type === 'success' }
				isWarning={ statusInfo.type === 'warning' }
				noticeText={ statusInfo.message }
			/>

			<p>
				{ __( 'An accessibility statement helps your readers understand how your site supports accessibility standards and what to do if they encounter accessibility issues.', 'newspack-plugin' ) }
				<ExternalLink href="https://www.w3.org/WAI/planning/statements/"> { __( 'Learn more about what makes a good accessibility statement.', 'newspack-plugin' ) } </ExternalLink>
			</p>

			<p>
				{ __( 'The page you create here will include a boilerplate accessibility statement, but we highly recommend you use the W3C Accessibility Statement Generator to create a custom statement.', 'newspack-plugin' ) }
				<ExternalLink href="https://www.w3.org/WAI/planning/statements/generator/#create"> { __( 'Try out the Accessibility Statement Generator.', 'newspack-plugin' ) } </ExternalLink>
			</p>
		</>
	);
}